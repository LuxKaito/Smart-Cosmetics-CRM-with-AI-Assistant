from __future__ import annotations

import os

from dotenv import load_dotenv
from pymongo import MongoClient

from src.processing.chunking import ChunkingService
from src.rag.embedding import build_embedding_model
from src.rag.indexer import IndexingService
from src.rag.vector_store import QdrantVectorStoreManager


def main() -> None:
    load_dotenv()

    mongo_uri = os.getenv("MONGODB_URI", "mongodb://mongo:27017")
    database_name = os.getenv("MONGODB_DATABASE", "smart_cosmetics_crm")
    collection_name = os.getenv("MONGODB_COLLECTION", "products")
    chunk_size = int(os.getenv("CHUNK_SIZE", "450"))
    chunk_overlap = int(os.getenv("CHUNK_OVERLAP", "70"))

    mongo = MongoClient(mongo_uri)
    collection = mongo[database_name][collection_name]

    embedding = build_embedding_model()
    vector_store = QdrantVectorStoreManager(embedding_model=embedding)
    chunking = ChunkingService(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    indexer = IndexingService(vector_store=vector_store, chunking=chunking)

    result = indexer.reindex(collection=collection)
    print(f"Reindex finished: {result}")


if __name__ == "__main__":
    main()
