from __future__ import annotations

import os

from dotenv import load_dotenv
from pymongo import MongoClient

from src.rag.embedding import build_embedding_model
from src.rag.vector_store import QdrantVectorStoreManager


def main() -> None:
    load_dotenv()

    mongo_uri = os.getenv("MONGODB_URI", "mongodb://mongo:27017")
    database_name = os.getenv("MONGODB_DATABASE", "smart_cosmetics_crm")

    embedding = build_embedding_model()
    vector_store = QdrantVectorStoreManager(embedding_model=embedding)
    vector_store.reset_collection()

    mongo = MongoClient(mongo_uri)
    db = mongo[database_name]
    db["chat_history"].delete_many({})
    db["chat_history_summary"].delete_many({})

    print("Cleanup completed: vector store reset, chat history cleared.")


if __name__ == "__main__":
    main()
