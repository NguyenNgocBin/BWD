"""Ingest semantic RAG V2 without touching the legacy hash collection."""

import argparse
import hashlib
import shutil
import sys
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from scripts.ingest_knowledge import (
    KNOWLEDGE_DIR,
    build_chunks as build_legacy_chunks,
    load_markdown_documents,
)
from services.embedding_service import GeminiEmbeddingFunction
from services.query_understanding_service import classify_source_intent, source_entities


CHROMA_V2_DIR = BASE_DIR / "vector_store" / "chroma_v2"
COLLECTION_V2_NAME = "dong_son_knowledge_v2"


def enrich_chunks(chunks):
    enriched = []
    for chunk in chunks:
        metadata = dict(chunk["metadata"])
        source = metadata["source"]
        metadata.update(
            {
                "intent": classify_source_intent(source),
                "topic": Path(metadata["filename"]).stem,
                "entities": source_entities(
                    f"{metadata.get('heading', '')}\n{chunk['text']}"
                ),
                "retrieval_version": "v2",
                "embedding_model": "gemini-embedding-001",
            }
        )
        versioned_id = hashlib.sha1(f"v2::{chunk['id']}".encode("utf-8")).hexdigest()
        enriched.append({"id": versioned_id, "text": chunk["text"], "metadata": metadata})
    return enriched


def reset_v2_dir():
    if CHROMA_V2_DIR.exists():
        shutil.rmtree(CHROMA_V2_DIR)
    CHROMA_V2_DIR.mkdir(parents=True, exist_ok=True)


def ingest_to_chroma_v2(chunks):
    try:
        import chromadb
    except ImportError as error:
        raise RuntimeError("Thiếu chromadb. Hãy chạy pip install -r requirements.txt") from error

    reset_v2_dir()
    embedding_function = GeminiEmbeddingFunction()
    client = chromadb.PersistentClient(path=str(CHROMA_V2_DIR))
    collection = client.get_or_create_collection(
        name=COLLECTION_V2_NAME,
        embedding_function=embedding_function,
        configuration={"hnsw": {"space": "cosine"}},
        metadata={
            "description": "Semantic RAG V2: Gemini embedding + intent metadata",
            "embedding_model": embedding_function.model,
            "embedding_dimensions": embedding_function.dimensions,
            "retrieval_version": "v2",
        },
    )

    collection.add(
        ids=[chunk["id"] for chunk in chunks],
        documents=[chunk["text"] for chunk in chunks],
        metadatas=[chunk["metadata"] for chunk in chunks],
    )

    print("Ingest semantic knowledge V2 thành công.")
    print(f"- Knowledge dir: {KNOWLEDGE_DIR}")
    print(f"- Chroma V2 dir: {CHROMA_V2_DIR}")
    print(f"- Collection: {COLLECTION_V2_NAME}")
    print(f"- Embedding: {embedding_function.model} ({embedding_function.dimensions} chiều)")
    print(f"- Số chunks: {collection.count()}")


def update_one_source(source):
    try:
        import chromadb
    except ImportError as error:
        raise RuntimeError("Thiếu chromadb. Hãy chạy pip install -r requirements.txt") from error

    source = source.replace("\\", "/").lstrip("./")
    documents = [
        document
        for document in load_markdown_documents(KNOWLEDGE_DIR)
        if document["source"] == source
    ]
    if not documents:
        raise RuntimeError(f"Không tìm thấy hoặc file knowledge đang rỗng: {source}")

    chunks = enrich_chunks(build_legacy_chunks(documents))
    client = chromadb.PersistentClient(path=str(CHROMA_V2_DIR))
    collection = client.get_collection(
        name=COLLECTION_V2_NAME,
        embedding_function=GeminiEmbeddingFunction(),
    )
    collection.delete(where={"source": source})
    collection.add(
        ids=[chunk["id"] for chunk in chunks],
        documents=[chunk["text"] for chunk in chunks],
        metadatas=[chunk["metadata"] for chunk in chunks],
    )
    print(f"Cập nhật V2 thành công: {source}")
    print(f"- Chunks của source: {len(chunks)}")
    print(f"- Tổng chunks: {collection.count()}")


def parse_args():
    parser = argparse.ArgumentParser(description="Ingest semantic knowledge V2")
    parser.add_argument(
        "--source",
        help="Chỉ cập nhật một source, ví dụ knowledge/dong_son/heger.md",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    if args.source:
        update_one_source(args.source)
        return 0
    documents = load_markdown_documents(KNOWLEDGE_DIR)
    if not documents:
        print(f"Không tìm thấy knowledge trong {KNOWLEDGE_DIR}", file=sys.stderr)
        return 1
    chunks = enrich_chunks(build_legacy_chunks(documents))
    if not chunks:
        print("Không tạo được chunk V2.", file=sys.stderr)
        return 1
    ingest_to_chroma_v2(chunks)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
