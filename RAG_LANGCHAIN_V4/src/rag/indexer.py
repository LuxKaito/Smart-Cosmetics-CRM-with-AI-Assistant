from __future__ import annotations

from typing import Any

from langchain_core.documents import Document
from pymongo.collection import Collection

from src.processing.chunking import ChunkingService
from src.processing.product_schema import (
    build_filter_payload,
    build_searchable_text,
    serialize_product_record,
)
from src.rag.vector_store import QdrantVectorStoreManager


class IndexingService:
    """Index dữ liệu sản phẩm MongoDB vào Qdrant từ schema Hasaki hiện hành."""

    def __init__(self, vector_store: QdrantVectorStoreManager, chunking: ChunkingService) -> None:
        self.vector_store = vector_store
        self.chunking = chunking

    @staticmethod
    def _assign_chunk_indexes(chunks: list[Document]) -> list[Document]:
        counter: dict[str, int] = {}
        output: list[Document] = []
        for chunk in chunks:
            metadata = dict(chunk.metadata or {})
            source_id = str(metadata.get("source_id", "unknown"))
            index = counter.get(source_id, 0)
            counter[source_id] = index + 1
            metadata["chunk_index"] = index
            output.append(Document(page_content=chunk.page_content, metadata=metadata))
        return output

    def ingest_mongodb_documents(self, collection_name: str, records: list[dict[str, Any]]) -> int:
        docs: list[Document] = []
        for index, record in enumerate(records):
            serialized = serialize_product_record(record)
            source_id = str(serialized.get("_id", f"{collection_name}:{index}"))
            text = build_searchable_text(serialized)
            if not text:
                continue

            metadata = {
                "source_type": "mongodb",
                "source_id": source_id,
                "collection": collection_name,
                "chunk_index": 0,
                "score_retrieval": None,
                "score_rerank": None,
                "raw_document": serialized,
                **build_filter_payload(serialized),
            }
            docs.append(Document(page_content=text, metadata=metadata))

        # Mỗi chunk vẫn giữ raw_document và payload filter để build context/card đầy đủ.
        chunks = self._assign_chunk_indexes(self.chunking.chunk_documents(docs))
        self.vector_store.upsert_documents(chunks)
        return len(chunks)

    def ingest_mongodb_collection(self, collection: Collection) -> int:
        records = list(collection.find({}))
        return self.ingest_mongodb_documents(collection.name, records)

    def reindex(self, collection: Collection) -> dict[str, int]:
        self.vector_store.reset_collection()
        product_chunks = self.ingest_mongodb_collection(collection)
        return {
            "product_chunks": product_chunks,
            "total_chunks": product_chunks,
        }
