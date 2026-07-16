"""Knowledge-corpus validation, auditing and semantic chunking utilities.

This module deliberately has no dependency on ChromaDB or an embedding provider.  It
is the deterministic boundary between Markdown knowledge files and an ingest job:

* YAML front matter is parsed strictly (including duplicate-key detection).
* Required document metadata is validated and normalized.
* Markdown is chunked on semantic boundaries while retaining heading ancestry.
* Corpus and collection fingerprints make stale indexes observable.

All values placed in ``chunk["metadata"]`` are Chroma-compatible scalar values.
Lists from document metadata are represented as deterministic JSON strings.
"""

from __future__ import annotations

import difflib
import hashlib
import json
import re
import unicodedata
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, Optional, Sequence, Tuple

import yaml
from yaml.constructor import ConstructorError


BASE_DIR = Path(__file__).resolve().parents[1]
KNOWLEDGE_DIR = BASE_DIR / "knowledge"

PIPELINE_VERSION = "semantic-v3.0"
REQUIRED_METADATA_FIELDS = (
    "schema_version",
    "document_id",
    "title",
    "corpus",
    "topic",
    "entities",
    "references",
    "updated_at",
    "reviewed_by",
    "review_status",
    "confidence",
    "retrieval_enabled",
    "document_type",
)
CHUNK_CONFIGS: Dict[str, Dict[str, int]] = {
    "compact": {"max_chars": 700, "overlap_units": 0},
    "balanced": {"max_chars": 1000, "overlap_units": 1},
    "broad": {"max_chars": 1400, "overlap_units": 1},
}

_ALLOWED_CORPORA = {"heritage", "website"}
_ALLOWED_CONFIDENCE = {"low", "medium", "high"}
_DOCUMENT_ID_PATTERN = re.compile(r"^[a-z0-9][a-z0-9._-]*$")
_HEADING_PATTERN = re.compile(r"^(#{1,6})[ \t]+(.+?)[ \t]*$")
_LIST_LINE_PATTERN = re.compile(r"^[ \t]*(?:[-+*]|\d+[.)])[ \t]+")
_QA_ANSWER_PATTERN = re.compile(
    r"^[ \t]*(?:[-+*][ \t]+)?\*{0,2}"
    r"(?:câu\s*trả\s*lời|trả\s*lời|đáp\s*án|answer|a)"
    r"\*{0,2}[ \t]*:\*{0,2}(?:[ \t]|$)",
    flags=re.IGNORECASE | re.MULTILINE,
)
_QA_QUESTION_PATTERN = re.compile(
    r"^[ \t]*(?:[-+*][ \t]+)?\*{0,2}"
    r"(?:câu\s*hỏi|question|q)\*{0,2}[ \t]*:\*{0,2}(?:[ \t]|$)",
    flags=re.IGNORECASE | re.MULTILINE,
)


class KnowledgePipelineError(ValueError):
    """Base error for invalid knowledge-corpus input."""


class FrontmatterError(KnowledgePipelineError):
    """Raised when Markdown front matter cannot be parsed strictly."""


class MetadataValidationError(KnowledgePipelineError):
    """Raised when required document metadata is missing or malformed."""

    def __init__(self, source: str, errors: Sequence[str]):
        self.source = source
        self.errors = list(errors)
        message = f"Metadata không hợp lệ trong {source}: " + "; ".join(self.errors)
        super().__init__(message)


class _UniqueKeySafeLoader(yaml.SafeLoader):
    """Safe YAML loader that rejects duplicate mapping keys."""


def _construct_unique_mapping(
    loader: _UniqueKeySafeLoader,
    node: yaml.nodes.MappingNode,
    deep: bool = False,
) -> Dict[Any, Any]:
    loader.flatten_mapping(node)
    mapping: Dict[Any, Any] = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        try:
            duplicate = key in mapping
        except TypeError as exc:
            raise ConstructorError(
                "while constructing a mapping",
                node.start_mark,
                "found an unhashable key",
                key_node.start_mark,
            ) from exc
        if duplicate:
            raise ConstructorError(
                "while constructing a mapping",
                node.start_mark,
                f"found duplicate key ({key!r})",
                key_node.start_mark,
            )
        mapping[key] = loader.construct_object(value_node, deep=deep)
    return mapping


_UniqueKeySafeLoader.add_constructor(
    yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG,
    _construct_unique_mapping,
)


def parse_yaml_frontmatter(content: str, source: str = "<memory>") -> Tuple[Dict[str, Any], str]:
    """Parse strict YAML front matter and return ``(metadata, body)``.

    A document must begin with ``---`` (a UTF-8 BOM is tolerated), contain a
    second exact ``---`` delimiter, and decode to a YAML mapping. Duplicate YAML
    keys are rejected rather than silently overwritten.
    """

    if not isinstance(content, str):
        raise FrontmatterError(f"{source}: nội dung Markdown phải là chuỗi")

    normalized = content.lstrip("\ufeff")
    lines = normalized.splitlines()
    if not lines or lines[0] != "---":
        raise FrontmatterError(f"{source}: thiếu YAML front matter ở đầu file")

    try:
        closing_index = lines.index("---", 1)
    except ValueError as exc:
        raise FrontmatterError(f"{source}: thiếu dấu đóng YAML front matter `---`") from exc

    yaml_text = "\n".join(lines[1:closing_index])
    if not yaml_text.strip():
        raise FrontmatterError(f"{source}: YAML front matter đang rỗng")

    try:
        parsed = yaml.load(yaml_text, Loader=_UniqueKeySafeLoader)
    except yaml.YAMLError as exc:
        raise FrontmatterError(f"{source}: YAML front matter không hợp lệ: {exc}") from exc

    if not isinstance(parsed, dict):
        raise FrontmatterError(f"{source}: YAML front matter phải là một mapping")
    if any(not isinstance(key, str) for key in parsed):
        raise FrontmatterError(f"{source}: mọi khóa metadata phải là chuỗi")

    return parsed, "\n".join(lines[closing_index + 1 :]).strip()


def _non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _normalize_iso_timestamp(value: Any) -> Optional[str]:
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if not isinstance(value, str) or not value.strip():
        return None

    candidate = value.strip()
    try:
        if "T" in candidate or " " in candidate:
            datetime.fromisoformat(candidate.replace("Z", "+00:00"))
        else:
            date.fromisoformat(candidate)
    except ValueError:
        return None
    return candidate


def _validate_string_list(
    metadata: Mapping[str, Any], field: str, errors: List[str], allow_empty: bool
) -> List[str]:
    value = metadata.get(field)
    if not isinstance(value, list):
        errors.append(f"`{field}` phải là list")
        return []
    if not allow_empty and not value:
        errors.append(f"`{field}` không được rỗng")
        return []

    normalized: List[str] = []
    seen = set()
    for index, item in enumerate(value):
        if not _non_empty_string(item):
            errors.append(f"`{field}[{index}]` phải là chuỗi không rỗng")
            continue
        clean_item = item.strip()
        if clean_item not in seen:
            normalized.append(clean_item)
            seen.add(clean_item)
    return normalized


def validate_document_metadata(document: Mapping[str, Any]) -> Dict[str, Any]:
    """Validate and normalize required metadata from a loaded document.

    The input is a document mapping containing ``metadata`` and optionally
    ``source``. Unknown metadata keys are retained so editorial tags and
    descriptions can evolve without changing this ingestion boundary.
    """

    source = str(document.get("source") or "<memory>")
    metadata = document.get("metadata")
    if not isinstance(metadata, Mapping):
        raise MetadataValidationError(source, ["`metadata` phải là mapping"])

    errors: List[str] = []
    missing = [field for field in REQUIRED_METADATA_FIELDS if field not in metadata]
    if missing:
        errors.append("thiếu trường bắt buộc: " + ", ".join(missing))

    normalized = dict(metadata)

    schema_version = metadata.get("schema_version")
    if isinstance(schema_version, bool) or not isinstance(schema_version, (str, int, float)):
        errors.append("`schema_version` phải là chuỗi hoặc số")
    elif not str(schema_version).strip():
        errors.append("`schema_version` không được rỗng")
    else:
        normalized["schema_version"] = str(schema_version).strip()

    document_id = metadata.get("document_id")
    if not _non_empty_string(document_id) or not _DOCUMENT_ID_PATTERN.fullmatch(document_id.strip()):
        errors.append("`document_id` chỉ được gồm chữ thường, số, dấu `.`, `_`, `-`")
    else:
        normalized["document_id"] = document_id.strip()

    for field in ("title", "topic", "reviewed_by", "review_status", "document_type"):
        value = metadata.get(field)
        if not _non_empty_string(value):
            errors.append(f"`{field}` phải là chuỗi không rỗng")
        else:
            normalized[field] = value.strip()

    corpus = metadata.get("corpus")
    if corpus not in _ALLOWED_CORPORA:
        errors.append("`corpus` phải là `heritage` hoặc `website`")

    normalized["entities"] = _validate_string_list(metadata, "entities", errors, allow_empty=True)
    normalized["references"] = _validate_string_list(
        metadata, "references", errors, allow_empty=False
    )
    if "retrieval_exclude_headings" in metadata:
        normalized["retrieval_exclude_headings"] = _validate_string_list(
            metadata,
            "retrieval_exclude_headings",
            errors,
            allow_empty=True,
        )

    updated_at = _normalize_iso_timestamp(metadata.get("updated_at"))
    if updated_at is None:
        errors.append("`updated_at` phải là ngày hoặc thời điểm ISO 8601 hợp lệ")
    else:
        normalized["updated_at"] = updated_at

    confidence = metadata.get("confidence")
    if confidence not in _ALLOWED_CONFIDENCE:
        errors.append("`confidence` phải là `low`, `medium` hoặc `high`")

    if not isinstance(metadata.get("retrieval_enabled"), bool):
        errors.append("`retrieval_enabled` phải là boolean")

    if errors:
        raise MetadataValidationError(source, errors)
    return normalized


def _source_name(knowledge_dir: Path, file_path: Path) -> str:
    relative = file_path.relative_to(knowledge_dir).as_posix()
    return f"knowledge/{relative}"


def load_knowledge_documents(
    knowledge_dir: Path = KNOWLEDGE_DIR,
    *,
    strict: bool = True,
) -> List[Dict[str, Any]]:
    """Load Markdown documents recursively in a stable order.

    With ``strict=True`` (the ingest default), malformed front matter or metadata
    fails fast. ``strict=False`` retains invalid/empty files and records their
    messages in ``validation_errors`` so :func:`audit_corpus` can report them.
    """

    root = Path(knowledge_dir)
    if not root.exists() or not root.is_dir():
        raise FileNotFoundError(f"Không tìm thấy knowledge directory: {root}")

    documents: List[Dict[str, Any]] = []
    for file_path in sorted(root.rglob("*.md"), key=lambda path: path.as_posix().lower()):
        raw_content = file_path.read_text(encoding="utf-8")
        source = _source_name(root, file_path)
        source_sha256 = hashlib.sha256(raw_content.encode("utf-8")).hexdigest()
        errors: List[str] = []

        try:
            metadata, body = parse_yaml_frontmatter(raw_content, source)
        except FrontmatterError as exc:
            if strict:
                raise
            metadata, body = {}, raw_content.strip()
            errors.append(str(exc))

        document: Dict[str, Any] = {
            "source": source,
            "filename": file_path.name,
            "content": raw_content,
            "body": body,
            "metadata": metadata,
            "source_sha256": source_sha256,
        }
        if metadata:
            try:
                document["metadata"] = validate_document_metadata(document)
            except MetadataValidationError as exc:
                if strict:
                    raise
                errors.extend(exc.errors)

        if errors:
            document["validation_errors"] = errors
        documents.append(document)

    return documents


def _normalized_audit_text(text: str) -> str:
    normalized = unicodedata.normalize("NFKC", text or "").casefold()
    return re.sub(r"\s+", " ", normalized).strip()


def _near_duplicate_similarity(left: str, right: str) -> float:
    left_tokens = re.findall(r"\w+", left, flags=re.UNICODE)
    right_tokens = re.findall(r"\w+", right, flags=re.UNICODE)
    if not left_tokens or not right_tokens:
        return 0.0

    shingle_size = 5 if min(len(left_tokens), len(right_tokens)) >= 10 else 2
    left_shingles = {
        tuple(left_tokens[index : index + shingle_size])
        for index in range(len(left_tokens) - shingle_size + 1)
    }
    right_shingles = {
        tuple(right_tokens[index : index + shingle_size])
        for index in range(len(right_tokens) - shingle_size + 1)
    }
    union = left_shingles | right_shingles
    jaccard = len(left_shingles & right_shingles) / len(union) if union else 0.0
    # Whole-document SequenceMatcher is quadratic and made the watcher stall on
    # long articles. Clearly unrelated shingle sets do not need the expensive
    # second pass; plausible candidates are compared as token sequences with
    # autojunk enabled to keep corpus audits fast and deterministic.
    if jaccard < 0.30:
        return jaccard
    sequence_ratio = difflib.SequenceMatcher(
        None,
        left_tokens,
        right_tokens,
        autojunk=True,
    ).ratio()
    return max(jaccard, sequence_ratio)


def audit_corpus(
    documents: Sequence[Mapping[str, Any]],
    *,
    near_duplicate_threshold: float = 0.88,
) -> Dict[str, Any]:
    """Audit empty, invalid, exact-duplicate and near-duplicate documents."""

    if not 0.0 <= near_duplicate_threshold <= 1.0:
        raise ValueError("near_duplicate_threshold phải nằm trong khoảng 0..1")

    empty_documents: List[str] = []
    metadata_errors: List[Dict[str, Any]] = []
    non_empty: List[Tuple[str, str]] = []

    for document in documents:
        source = str(document.get("source") or "<memory>")
        body = str(document.get("body") or "")
        normalized_body = _normalized_audit_text(body)
        if not normalized_body:
            empty_documents.append(source)
        else:
            non_empty.append((source, normalized_body))

        errors = list(document.get("validation_errors") or [])
        if not errors:
            try:
                validate_document_metadata(document)
            except MetadataValidationError as exc:
                errors = exc.errors
        if errors:
            metadata_errors.append({"source": source, "errors": errors})

    by_digest: Dict[str, List[str]] = {}
    for source, normalized_body in non_empty:
        digest = hashlib.sha256(normalized_body.encode("utf-8")).hexdigest()
        by_digest.setdefault(digest, []).append(source)

    exact_duplicates = [
        {"sha256": digest, "sources": sorted(sources)}
        for digest, sources in sorted(by_digest.items())
        if len(sources) > 1
    ]
    exact_pairs = {
        tuple(sorted((left, right)))
        for group in exact_duplicates
        for index, left in enumerate(group["sources"])
        for right in group["sources"][index + 1 :]
    }

    near_duplicates: List[Dict[str, Any]] = []
    for index, (left_source, left_body) in enumerate(non_empty):
        for right_source, right_body in non_empty[index + 1 :]:
            pair = tuple(sorted((left_source, right_source)))
            if pair in exact_pairs:
                continue
            similarity = _near_duplicate_similarity(left_body, right_body)
            if similarity >= near_duplicate_threshold:
                near_duplicates.append(
                    {
                        "sources": list(pair),
                        "similarity": round(similarity, 6),
                    }
                )

    near_duplicates.sort(key=lambda item: (-item["similarity"], item["sources"]))
    result = {
        "document_count": len(documents),
        "empty_documents": sorted(empty_documents),
        "metadata_errors": metadata_errors,
        "exact_duplicates": exact_duplicates,
        "near_duplicates": near_duplicates,
    }
    result["is_clean"] = not any(
        result[key]
        for key in ("empty_documents", "metadata_errors", "exact_duplicates", "near_duplicates")
    )
    return result


def _heading_path(title: str, stack: Sequence[Tuple[int, str]]) -> List[str]:
    path = [heading for _, heading in stack]
    if not path or _normalized_audit_text(path[0]) != _normalized_audit_text(title):
        path.insert(0, title)
    return path


def _markdown_sections(body: str, title: str) -> List[Dict[str, Any]]:
    sections: List[Dict[str, Any]] = []
    stack: List[Tuple[int, str]] = []
    current_lines: List[str] = []
    current_level = 1
    current_path = [title]
    in_fence = False

    def flush() -> None:
        content = "\n".join(current_lines).strip()
        if content:
            sections.append(
                {
                    "level": current_level,
                    "path": list(current_path),
                    "content": content,
                }
            )

    for line in body.splitlines():
        if line.lstrip().startswith("```") or line.lstrip().startswith("~~~"):
            in_fence = not in_fence
            current_lines.append(line)
            continue

        match = None if in_fence else _HEADING_PATTERN.match(line)
        if not match:
            current_lines.append(line)
            continue

        flush()
        current_lines = []
        level = len(match.group(1))
        heading = match.group(2).strip().rstrip("#").strip()
        stack = [(old_level, old_heading) for old_level, old_heading in stack if old_level < level]
        stack.append((level, heading))
        current_level = level
        current_path = _heading_path(title, stack)

    flush()
    return sections


def _is_qa_section(section: Mapping[str, Any]) -> bool:
    content = str(section["content"])
    heading = str(section["path"][-1])
    has_answer = bool(_QA_ANSWER_PATTERN.search(content))
    heading_is_question = heading.rstrip().endswith("?")
    has_labeled_question = bool(_QA_QUESTION_PATTERN.search(content))
    return bool(
        (has_answer and (has_labeled_question or heading_is_question))
        or (heading_is_question and content.strip())
    )


def _pack_words(text: str, max_chars: int) -> List[str]:
    words = text.split()
    if not words:
        return []
    parts: List[str] = []
    current: List[str] = []
    for word in words:
        if current and len(" ".join(current + [word])) > max_chars:
            parts.append(" ".join(current))
            current = []
        if len(word) > max_chars:
            if current:
                parts.append(" ".join(current))
                current = []
            parts.extend(word[index : index + max_chars] for index in range(0, len(word), max_chars))
        else:
            current.append(word)
    if current:
        parts.append(" ".join(current))
    return parts


def _split_oversized_block(block: str, max_chars: int) -> List[str]:
    if len(block) <= max_chars:
        return [block]

    lines = [line.strip() for line in block.splitlines() if line.strip()]
    if len(lines) > 1 and any(_LIST_LINE_PATTERN.match(line) for line in lines):
        fragments = lines
    else:
        fragments = [part.strip() for part in re.split(r"(?<=[.!?…])\s+", block) if part.strip()]

    result: List[str] = []
    current: List[str] = []
    separator = "\n" if len(lines) > 1 else " "
    for fragment in fragments:
        if len(fragment) > max_chars:
            if current:
                result.append(separator.join(current))
                current = []
            result.extend(_pack_words(fragment, max_chars))
            continue
        candidate = separator.join(current + [fragment])
        if current and len(candidate) > max_chars:
            result.append(separator.join(current))
            current = [fragment]
        else:
            current.append(fragment)
    if current:
        result.append(separator.join(current))
    return result


def _semantic_units(content: str, max_chars: int) -> List[str]:
    blocks = [block.strip() for block in re.split(r"\n\s*\n", content) if block.strip()]
    units: List[str] = []
    for block in blocks:
        units.extend(_split_oversized_block(block, max_chars))
    return units


def _joined_length(units: Sequence[str]) -> int:
    return len("\n\n".join(units))


def _group_units(units: Sequence[str], max_chars: int, overlap_units: int) -> List[List[str]]:
    groups: List[List[str]] = []
    current: List[str] = []
    index = 0
    while index < len(units):
        unit = units[index]
        if not current or _joined_length(current + [unit]) <= max_chars:
            current.append(unit)
            index += 1
            continue

        groups.append(current)
        overlap = current[-overlap_units:] if overlap_units else []
        current = overlap if overlap and _joined_length(overlap + [unit]) <= max_chars else []

    if current:
        groups.append(current)
    return groups


def _scalar_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def _document_intent(metadata: Mapping[str, Any], source: str) -> str:
    explicit_intent = metadata.get("intent")
    if _non_empty_string(explicit_intent):
        return explicit_intent.strip()
    if source.startswith("knowledge/artifacts/"):
        return "artifact"
    if source.startswith("knowledge/website/"):
        filename = source.rsplit("/", 1)[-1]
        if filename in {"tai_khoan.md", "tro_choi.md", "xep_hang.md"}:
            return "account_game"
        return "website"
    return "dong_son_knowledge"


def _chunk_metadata(
    document: Mapping[str, Any],
    section: Mapping[str, Any],
    config_name: str,
    section_index: int,
    chunk_index: int,
    chunk_kind: str,
    char_count: int,
) -> Dict[str, Any]:
    from services.query_understanding_service import source_entities

    metadata = document["metadata"]
    path = list(section["path"])
    parent_heading = path[-2] if len(path) > 1 else path[0]
    source = str(document["source"])
    return {
        "schema_version": str(metadata["schema_version"]),
        "document_id": str(metadata["document_id"]),
        "title": str(metadata["title"]),
        "corpus": str(metadata["corpus"]),
        "topic": str(metadata["topic"]),
        "entities": ",".join(metadata["entities"]),
        "entity_ids": source_entities(" ".join(metadata["entities"])),
        "references": _scalar_json(metadata["references"]),
        "updated_at": str(metadata["updated_at"]),
        "reviewed_by": str(metadata["reviewed_by"]),
        "review_status": str(metadata["review_status"]),
        "confidence": str(metadata["confidence"]),
        "document_confidence": str(metadata["confidence"]),
        "retrieval_enabled": bool(metadata["retrieval_enabled"]),
        "document_type": str(metadata["document_type"]),
        "intent": _document_intent(metadata, source),
        "source": source,
        "filename": str(document.get("filename") or Path(source).name),
        "source_sha256": str(document["source_sha256"]),
        "heading": path[-1],
        "heading_path": " > ".join(path),
        "parent_heading": parent_heading,
        "chunk_kind": chunk_kind,
        "section_index": section_index,
        "chunk_index": chunk_index,
        "char_count": char_count,
        "chunk_config": config_name,
        "chunking_version": PIPELINE_VERSION,
        "language": str(metadata.get("language") or "vi"),
    }


def build_semantic_chunks(
    documents: Sequence[Mapping[str, Any]],
    config_name: str = "balanced",
) -> List[Dict[str, Any]]:
    """Build deterministic semantic chunks with heading and entity context."""

    if config_name not in CHUNK_CONFIGS:
        raise ValueError(
            f"Chunk config không hợp lệ: {config_name}. Chọn một trong {sorted(CHUNK_CONFIGS)}"
        )
    config = CHUNK_CONFIGS[config_name]
    max_chars = config["max_chars"]
    overlap_units = config["overlap_units"]
    chunks: List[Dict[str, Any]] = []

    for document in documents:
        metadata = validate_document_metadata(document)
        if not metadata["retrieval_enabled"]:
            continue
        body = str(document.get("body") or "").strip()
        if not body:
            continue

        normalized_document = dict(document)
        normalized_document["metadata"] = metadata
        normalized_document.setdefault(
            "source_sha256",
            hashlib.sha256(str(document.get("content") or body).encode("utf-8")).hexdigest(),
        )
        sections = _markdown_sections(body, metadata["title"])
        excluded_headings = {
            _normalized_audit_text(value)
            for value in metadata.get("retrieval_exclude_headings", [])
            if _non_empty_string(value)
        }
        document_chunk_index = 0

        for section_index, section in enumerate(sections):
            heading = section["path"][-1]
            if _normalized_audit_text(heading) in excluded_headings:
                continue
            header = f"{'#' * min(max(int(section['level']), 1), 6)} {heading}"
            is_qa = _is_qa_section(section)
            if is_qa:
                groups = [[str(section["content"])]]
            else:
                available_chars = max(120, max_chars - len(header) - 2)
                units = _semantic_units(str(section["content"]), available_chars)
                groups = _group_units(units, available_chars, overlap_units)

            for group in groups:
                body_text = "\n\n".join(group).strip()
                if not body_text:
                    continue
                text = f"{header}\n\n{body_text}"
                chunk_kind = "qa" if is_qa else "semantic"
                chunk_metadata = _chunk_metadata(
                    normalized_document,
                    section,
                    config_name,
                    section_index,
                    document_chunk_index,
                    chunk_kind,
                    len(text),
                )
                embed_text = (
                    f"{metadata['title']}\n"
                    f"Chủ đề: {metadata['topic']}\n"
                    f"Đường dẫn: {chunk_metadata['heading_path']}\n\n{text}"
                )
                raw_id = "|".join(
                    (
                        str(metadata["document_id"]),
                        str(normalized_document["source_sha256"]),
                        config_name,
                        str(section_index),
                        str(document_chunk_index),
                        text,
                    )
                )
                chunks.append(
                    {
                        "id": hashlib.sha256(raw_id.encode("utf-8")).hexdigest(),
                        "text": text,
                        "embed_text": embed_text,
                        "metadata": chunk_metadata,
                    }
                )
                document_chunk_index += 1

    return chunks


def compute_corpus_checksum(documents: Sequence[Mapping[str, Any]]) -> str:
    """Return an order-independent checksum of source paths and exact file bytes."""

    entries: List[Dict[str, str]] = []
    seen_sources = set()
    for document in documents:
        source = str(document.get("source") or "")
        if not source:
            raise ValueError("Mọi document phải có `source` để tính corpus checksum")
        if source in seen_sources:
            raise ValueError(f"Source bị lặp khi tính corpus checksum: {source}")
        seen_sources.add(source)

        source_sha256 = document.get("source_sha256")
        if not _non_empty_string(source_sha256):
            content = str(document.get("content") or document.get("body") or "")
            source_sha256 = hashlib.sha256(content.encode("utf-8")).hexdigest()
        entries.append({"source": source, "sha256": str(source_sha256)})

    payload = _scalar_json(sorted(entries, key=lambda entry: entry["source"]))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def compute_collection_fingerprint(
    corpus_checksum: Optional[str] = None,
    embedding_model: str = "",
    embedding_dimensions: int = 0,
    chunk_config_name: str = "balanced",
    pipeline_version: str = PIPELINE_VERSION,
    collection_name: str = "",
    *,
    documents: Optional[Sequence[Mapping[str, Any]]] = None,
    extra: Optional[Mapping[str, Any]] = None,
) -> str:
    """Fingerprint every setting that determines collection compatibility."""

    if corpus_checksum is None:
        if documents is None:
            raise ValueError("Cần truyền `corpus_checksum` hoặc `documents`")
        corpus_checksum = compute_corpus_checksum(documents)
    if not re.fullmatch(r"[0-9a-f]{64}", str(corpus_checksum)):
        raise ValueError("`corpus_checksum` phải là SHA-256 dạng hex")
    if not _non_empty_string(embedding_model):
        raise ValueError("`embedding_model` không được rỗng")
    if isinstance(embedding_dimensions, bool) or not isinstance(embedding_dimensions, int):
        raise ValueError("`embedding_dimensions` phải là số nguyên dương")
    if embedding_dimensions <= 0:
        raise ValueError("`embedding_dimensions` phải là số nguyên dương")
    if chunk_config_name not in CHUNK_CONFIGS:
        raise ValueError(f"Chunk config không hợp lệ: {chunk_config_name}")

    payload = {
        "chunk_config": {
            "name": chunk_config_name,
            **CHUNK_CONFIGS[chunk_config_name],
        },
        "collection_name": collection_name,
        "corpus_checksum": corpus_checksum,
        "embedding_dimensions": embedding_dimensions,
        "embedding_model": embedding_model.strip(),
        "extra": dict(extra or {}),
        "pipeline_version": pipeline_version,
    }
    canonical = _scalar_json(payload)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


__all__ = [
    "CHUNK_CONFIGS",
    "KNOWLEDGE_DIR",
    "PIPELINE_VERSION",
    "FrontmatterError",
    "KnowledgePipelineError",
    "MetadataValidationError",
    "audit_corpus",
    "build_semantic_chunks",
    "compute_collection_fingerprint",
    "compute_corpus_checksum",
    "load_knowledge_documents",
    "parse_yaml_frontmatter",
    "validate_document_metadata",
]
