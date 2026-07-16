"""Public RAG facade plus context and browser-safe source formatting."""

import json
import os
import re
from typing import List

from services.rag_legacy_service import (
    get_legacy_rag_collection,
    search_legacy_chunks,
)


ARTIFACT_SOURCE_ROUTES = {
    "ngoc_lu.md": "/pages/hien-vat.html?id=ngoc-lu",
    "hoang_ha.md": "/pages/hien-vat.html?id=hoang-ha",
    "co_loa.md": "/pages/hien-vat.html?id=co-loa",
    "tan_long.md": "/pages/hien-vat.html?id=tan-long",
}

WEBSITE_SOURCE_ROUTES = {
    "ban_do.md": "/pages/Map.html",
    "chatbox.md": "/index.html",
    "hoc_vui.md": "/pages/hocvui.html",
    "homepage.md": "/index.html",
    "tai_khoan.md": "/pages/profile.html",
    "tai_lieu.md": "/pages/tailieu.html",
    "trien_lam.md": "/pages/trienlam.html",
    "tro_choi.md": "/pages/trochoi.html",
    "website_qa.md": "/index.html",
    "xep_hang.md": "/pages/bxh.html",
}


class RagSearchError(Exception):
    pass


def select_citation_chunks(chunks: List[dict], max_sources: int = 3) -> List[dict]:
    """Keep distinct documents while merging their other retrieved sections."""

    selected = []
    selected_by_source = {}
    for chunk in chunks or []:
        source_key = chunk.get("document_id") or chunk.get("source")
        if not source_key:
            continue

        existing = selected_by_source.get(source_key)
        if existing is not None:
            additional_content = str(chunk.get("content") or "").strip()
            current_content = str(existing.get("content") or "").strip()
            if additional_content and additional_content not in current_content:
                section_title = str(chunk.get("title") or "").strip()
                section_prefix = (
                    f"## {section_title}\n"
                    if section_title and section_title != existing.get("title")
                    else ""
                )
                existing["content"] = (
                    f"{current_content}\n\n{section_prefix}{additional_content}"
                ).strip()
            continue

        if len(selected) >= max(1, min(int(max_sources), 3)):
            continue

        selected_chunk = dict(chunk)
        selected.append(selected_chunk)
        selected_by_source[source_key] = selected_chunk
    return selected


def build_rag_context(chunks: List[dict]) -> str:
    """Build grounded LLM context without exposing internal paths or chunk ids."""

    blocks = []
    for index, chunk in enumerate(select_citation_chunks(chunks, max_sources=3), start=1):
        document_title = (
            chunk.get("document_title")
            or chunk.get("title")
            or "Tài liệu Đông Sơn"
        )
        section_title = chunk.get("title")
        metadata_lines = []
        if section_title and section_title != document_title:
            metadata_lines.append(f"Mục: {section_title}")
        metadata_lines.append(
            "Trạng thái duyệt: "
            f"{chunk.get('review_status') or 'không rõ'}; "
            "độ tin cậy tài liệu: "
            f"{chunk.get('document_confidence') or 'không rõ'}"
        )
        blocks.append(
            f"[{index}] {document_title}\n"
            + "\n".join(metadata_lines)
            + f"\n{chunk.get('content') or ''}"
        )
    return "\n\n".join(blocks)


def _source_route(chunk):
    source = str(chunk.get("source") or "")
    filename = str(chunk.get("filename") or source.rsplit("/", 1)[-1])
    if source.startswith("knowledge/artifacts/"):
        return ARTIFACT_SOURCE_ROUTES.get(filename, "/pages/tailieu.html#artifacts"), "artifact"
    if source.startswith("knowledge/website/"):
        return WEBSITE_SOURCE_ROUTES.get(filename, "/index.html"), "website"
    return "/pages/tailieu.html", "document"


def _external_reference(references):
    values = references
    if isinstance(values, str):
        try:
            decoded = json.loads(values)
            values = decoded if isinstance(decoded, list) else [decoded]
        except (TypeError, ValueError, json.JSONDecodeError):
            values = [values]
    if not isinstance(values, list):
        return None
    return next(
        (str(value) for value in values if str(value).startswith(("https://", "http://"))),
        None,
    )


def _short_excerpt(content, max_length=360):
    plain_content = re.sub(r"(?m)^#{1,6}\s*", "", str(content or ""))
    plain_content = re.sub(r"[*_`]", "", plain_content)
    text = " ".join(plain_content.split())
    if len(text) <= max_length:
        return text
    shortened = text[: max_length - 1].rsplit(" ", 1)[0]
    if not shortened:
        shortened = text[: max_length - 1]
    return f"{shortened}…"


def build_sources(chunks: List[dict]) -> List[dict]:
    """Return only public source-card data needed by the browser."""

    sources = []
    for index, chunk in enumerate(select_citation_chunks(chunks, max_sources=3), start=1):
        url, source_type = _source_route(chunk)
        document_title = (
            chunk.get("document_title")
            or chunk.get("title")
            or "Tài liệu Đông Sơn"
        )
        sources.append(
            {
                "id": index,
                "citation": f"[{index}]",
                "title": document_title,
                "section_title": chunk.get("title"),
                "excerpt": _short_excerpt(chunk.get("content")),
                "url": url,
                "external_url": _external_reference(chunk.get("references")),
                "source_type": source_type,
            }
        )
    return sources


def retrieval_version():
    configured = os.getenv("RAG_RETRIEVAL_VERSION", "v3").strip().lower()
    return configured if configured in {"legacy", "v2", "v3"} else "v3"


def get_rag_collection():
    version = retrieval_version()
    try:
        if version == "legacy":
            return get_legacy_rag_collection()
        if version == "v2":
            from services.rag_v2_service import get_v2_collection

            return get_v2_collection()

        from services.rag_v3_service import get_v3_collection

        return get_v3_collection()
    except Exception as error:
        raise RagSearchError(str(error)) from error


def search_relevant_chunks(
    question: str,
    top_k: int = 5,
    query_embedding=None,
) -> List[dict]:
    version = retrieval_version()
    try:
        if version == "legacy":
            return search_legacy_chunks(question, top_k=top_k)
        if version == "v2":
            from services.rag_v2_service import search_v2

            return search_v2(question, top_k=top_k)

        from services.rag_v3_service import search_v3

        return search_v3(question, top_k=top_k, query_embedding=query_embedding)
    except Exception as error:
        raise RagSearchError(str(error)) from error
