from __future__ import annotations

import os
import uuid
from dataclasses import dataclass

from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.http import models


@dataclass
class VectorStoreConfig:
    url: str
    collection_name: str
    api_key: str | None = None
    id_strategy: str = "uuid5"


class QdrantVectorStoreManager:
    def __init__(
        self,
        embedding_model: Embeddings,
        config: VectorStoreConfig | None = None,
    ) -> None:
        self.embedding_model = embedding_model
        self.config = config or VectorStoreConfig(
            url=os.getenv("QDRANT_URL", "http://qdrant:6333"),
            collection_name=os.getenv("QDRANT_COLLECTION", "products_rag"),
            api_key=os.getenv("QDRANT_API_KEY"),
            id_strategy=os.getenv("QDRANT_ID_STRATEGY", "uuid5"),
        )
        self.client = QdrantClient(
            url=self.config.url,
            api_key=self.config.api_key,
            timeout=float(os.getenv("QDRANT_TIMEOUT_SECONDS", "20")),
        )

    def ensure_collection(self) -> None:
        collections = self.client.get_collections().collections
        existing = {item.name for item in collections}
        if self.config.collection_name in existing:
            return

        dim = len(self.embedding_model.embed_query("dimension_probe"))
        self.client.create_collection(
            collection_name=self.config.collection_name,
            vectors_config=models.VectorParams(size=dim, distance=models.Distance.COSINE),
        )

    def get_vectorstore(self) -> QdrantVectorStore:
        return QdrantVectorStore(
            client=self.client,
            collection_name=self.config.collection_name,
            embedding=self.embedding_model,
        )

    def build_point_id(self, source_type: str, source_id: str, chunk_index: int) -> str:
        strategy = self.config.id_strategy.lower()
        if strategy == "uuid5":
            stable_key = f"{source_type}:{source_id}:{chunk_index}"
            return str(uuid.uuid5(uuid.NAMESPACE_URL, stable_key))
        return str(uuid.uuid4())

    def upsert_documents(self, documents: list[Document]) -> list[str]:
        if not documents:
            return []
        self.ensure_collection()

        ids: list[str] = []
        normalized_docs: list[Document] = []
        for doc in documents:
            metadata = dict(doc.metadata or {})
            source_type = str(metadata.get("source_type", "unknown"))
            source_id = str(metadata.get("source_id", "unknown"))
            chunk_index = int(metadata.get("chunk_index", 0))
            point_id = self.build_point_id(source_type, source_id, chunk_index)

            metadata.setdefault("score_retrieval", None)
            metadata.setdefault("score_rerank", None)

            ids.append(point_id)
            normalized_docs.append(Document(page_content=doc.page_content, metadata=metadata))

        vectorstore = self.get_vectorstore()
        vectorstore.add_documents(documents=normalized_docs, ids=ids)
        return ids

    def similarity_search_with_score(
        self,
        query: str,
        k: int = 20,
        qdrant_filter: models.Filter | None = None,
    ):
        self.ensure_collection()
        vectorstore = self.get_vectorstore()
        return vectorstore.similarity_search_with_score(query=query, k=k, filter=qdrant_filter)

    def reset_collection(self) -> None:
        try:
            self.client.delete_collection(collection_name=self.config.collection_name)
        except Exception:
            pass
        self.ensure_collection()
