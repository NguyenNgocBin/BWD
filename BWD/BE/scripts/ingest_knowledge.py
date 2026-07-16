import hashlib
import re
import shutil
import sys
from pathlib import Path
from typing import Dict, List


BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from services.legacy_embedding_service import LocalHashEmbeddingFunction


KNOWLEDGE_DIR = BASE_DIR / "knowledge"
CHROMA_DIR = BASE_DIR / "vector_store" / "chroma"
COLLECTION_NAME = "dong_son_knowledge"


def load_markdown_documents(knowledge_dir: Path) -> List[Dict[str, str]]:
    documents = []

    for file_path in sorted(knowledge_dir.rglob("*.md")):
        content = file_path.read_text(encoding="utf-8").strip()
        if not content:
            continue

        documents.append(
            {
                "source": str(file_path.relative_to(BASE_DIR)).replace("\\", "/"),
                "filename": file_path.name,
                "content": content,
            }
        )

    return documents


def split_markdown_by_headings(content: str) -> List[Dict[str, str]]:
    sections = []
    current_heading = "Tổng quan"
    current_lines = []

    for line in content.splitlines():
        heading_match = re.match(r"^(#{1,6})\s+(.+)$", line.strip())

        if heading_match and current_lines:
            sections.append(
                {
                    "heading": current_heading,
                    "content": "\n".join(current_lines).strip(),
                }
            )
            current_lines = []

        if heading_match:
            current_heading = heading_match.group(2).strip()

        current_lines.append(line)

    if current_lines:
        sections.append(
            {
                "heading": current_heading,
                "content": "\n".join(current_lines).strip(),
            }
        )

    return [section for section in sections if section["content"]]


def split_text_with_overlap(text: str, chunk_size: int = 900, chunk_overlap: int = 160) -> List[str]:
    text = re.sub(r"\n{3,}", "\n\n", text).strip()

    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0

    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk = text[start:end]

        if end < len(text):
            paragraph_break = chunk.rfind("\n\n")
            sentence_break = max(chunk.rfind(". "), chunk.rfind("? "), chunk.rfind("! "))

            split_at = max(paragraph_break, sentence_break)
            if split_at > chunk_size * 0.55:
                end = start + split_at + 1
                chunk = text[start:end]

        chunk = chunk.strip()
        if chunk:
            chunks.append(chunk)

        if end >= len(text):
            break

        start = max(0, end - chunk_overlap)

    return chunks


def build_chunks(documents: List[Dict[str, str]]) -> List[Dict[str, object]]:
    chunks = []

    for document in documents:
        sections = split_markdown_by_headings(document["content"])

        for section_index, section in enumerate(sections):
            text_chunks = split_text_with_overlap(section["content"])

            for chunk_index, chunk_text in enumerate(text_chunks):
                chunk_id_raw = f"{document['filename']}::{section_index}::{chunk_index}::{section['heading']}"
                chunk_id = hashlib.sha1(chunk_id_raw.encode("utf-8")).hexdigest()

                chunks.append(
                    {
                        "id": chunk_id,
                        "text": chunk_text,
                        "metadata": {
                            "source": document["source"],
                            "filename": document["filename"],
                            "heading": section["heading"],
                            "section_index": section_index,
                            "chunk_index": chunk_index,
                            "language": "vi",
                        },
                    }
                )

    return chunks


def reset_chroma_dir(chroma_dir: Path) -> None:
    if chroma_dir.exists():
        shutil.rmtree(chroma_dir)

    chroma_dir.mkdir(parents=True, exist_ok=True)


def ingest_to_chroma(chunks: List[Dict[str, object]]) -> None:
    try:
        import chromadb
    except ImportError as exc:
        raise RuntimeError(
            "Thiếu package `chromadb`. Hãy chạy: pip install -r BWD/BE/requirements.txt"
        ) from exc

    reset_chroma_dir(CHROMA_DIR)

    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=LocalHashEmbeddingFunction(),
        metadata={
            "description": "Knowledge base RAG về trống đồng Đông Sơn và website Đông Sơn",
            "embedding": "local_hash_embedding",
        },
    )

    collection.add(
        ids=[chunk["id"] for chunk in chunks],
        documents=[chunk["text"] for chunk in chunks],
        metadatas=[chunk["metadata"] for chunk in chunks],
    )

    print("Ingest knowledge thành công.")
    print(f"- Knowledge dir: {KNOWLEDGE_DIR}")
    print(f"- Chroma dir: {CHROMA_DIR}")
    print(f"- Collection: {COLLECTION_NAME}")
    print(f"- Số chunks: {collection.count()}")


def main() -> int:
    if not KNOWLEDGE_DIR.exists():
        print(f"Không tìm thấy thư mục knowledge: {KNOWLEDGE_DIR}", file=sys.stderr)
        return 1

    documents = load_markdown_documents(KNOWLEDGE_DIR)
    if not documents:
        print(f"Không tìm thấy file .md nào trong: {KNOWLEDGE_DIR}", file=sys.stderr)
        return 1

    chunks = build_chunks(documents)
    if not chunks:
        print("Không tạo được chunk nào từ knowledge base.", file=sys.stderr)
        return 1

    ingest_to_chroma(chunks)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
