from __future__ import annotations

from contextlib import asynccontextmanager
import logging
import os
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from pymongo import MongoClient

from src.core.model_factory import build_llm
from src.history.chat_history import ChatHistoryStore
from src.inference.inference_engine import InferenceEngine
from src.processing.chunking import ChunkingService
from src.rag.embedding import build_embedding_model
from src.rag.indexer import IndexingService
from src.rag.reranker import RerankerService
from src.rag.retriever import RetrieverService
from src.rag.vector_store import QdrantVectorStoreManager
from src.router.semantic_router import SemanticRouter

logger = logging.getLogger(__name__)
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO").upper())
logging.getLogger("httpx").setLevel(logging.WARNING)


class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "RAG LangChain V4"
    app_env: str = "docker"

    mongodb_uri: str = "mongodb://mongo:27017"
    mongodb_database: str = "smart_cosmetics_crm"
    mongodb_collection: str = "products"

    qdrant_url: str = "http://qdrant:6333"
    qdrant_collection: str = "products_rag"

    chunk_size: int = 450
    chunk_overlap: int = 70
    top_n_candidates: int = 20
    top_k: int = 4
    max_ui_products: int = 4


class HealthResponse(BaseModel):
    status: str
    app: str
    environment: str
    mongodb: str
    qdrant: str


class ChatRequest(BaseModel):
    user_id: str = Field(min_length=1)
    session_id: str = Field(min_length=1)
    query: str = Field(min_length=1)


class ProductCard(BaseModel):
    product_id: str | None = None
    name: str
    summary: str | None = None
    price: int | None = None
    original_price: int | None = None
    promotion: str | None = None
    rating: float | None = None
    image_url: str | None = None
    product_url: str | None = None
    badge: str | None = None


class ChatResponse(BaseModel):
    answer: str
    rewrite_question: str
    confidence: float
    citations: dict[str, dict[str, Any]]
    route: str
    products: list[ProductCard] = Field(default_factory=list)
    sources: list[dict[str, Any]] = Field(default_factory=list)
    debug: dict[str, Any] | None = None


class IngestResponse(BaseModel):
    status: str
    chunks_indexed: int


class ReindexResponse(BaseModel):
    status: str
    product_chunks: int
    total_chunks: int


class ServiceContainer:
    def __init__(self, settings: AppSettings) -> None:
        self.settings = settings
        self._mongo_client: MongoClient | None = None
        self._embedding_model = None
        self._vector_store: QdrantVectorStoreManager | None = None
        self._indexer: IndexingService | None = None
        self._inference_engine: InferenceEngine | None = None
        self._reranker: RerankerService | None = None
        self._llm = None
        self._retriever: RetrieverService | None = None
        self._history_store: ChatHistoryStore | None = None
        self._router: SemanticRouter | None = None

    @property
    def mongo_client(self) -> MongoClient:
        if self._mongo_client is None:
            self._mongo_client = MongoClient(self.settings.mongodb_uri)
        return self._mongo_client

    @property
    def product_collection(self):
        return self.mongo_client[self.settings.mongodb_database][self.settings.mongodb_collection]

    @property
    def vector_store(self) -> QdrantVectorStoreManager:
        if self._vector_store is None:
            self._vector_store = QdrantVectorStoreManager(embedding_model=self.embedding_model)
            self._vector_store.ensure_collection()
        return self._vector_store

    @property
    def embedding_model(self):
        if self._embedding_model is None:
            self._embedding_model = build_embedding_model()
        return self._embedding_model

    @property
    def reranker(self) -> RerankerService:
        if self._reranker is None:
            self._reranker = RerankerService()
        return self._reranker

    @property
    def llm(self):
        if self._llm is None:
            self._llm = build_llm()
        return self._llm

    @property
    def retriever(self) -> RetrieverService:
        if self._retriever is None:
            self._retriever = RetrieverService(
                self.vector_store,
                top_n_candidates=self.settings.top_n_candidates,
            )
        return self._retriever

    @property
    def history_store(self) -> ChatHistoryStore:
        if self._history_store is None:
            self._history_store = ChatHistoryStore(
                mongo_uri=self.settings.mongodb_uri,
                database_name=self.settings.mongodb_database,
                sliding_window=8,
                summary_trigger=20,
            )
        return self._history_store

    @property
    def router(self) -> SemanticRouter:
        if self._router is None:
            fields = {
                "product_name_vn": 1,
                "product_name_en": 1,
                "brand": 1,
                "volume": 1,
                "origin": 1,
                "benefits": 1,
                "product_type": 1,
                "skin_type": 1,
            }
            self._router = SemanticRouter(records_loader=lambda: self.product_collection.find({}, fields))
        return self._router

    @property
    def indexer(self) -> IndexingService:
        if self._indexer is None:
            chunking = ChunkingService(
                chunk_size=self.settings.chunk_size,
                chunk_overlap=self.settings.chunk_overlap,
            )
            self._indexer = IndexingService(vector_store=self.vector_store, chunking=chunking)
        return self._indexer

    @property
    def inference_engine(self) -> InferenceEngine:
        if self._inference_engine is None:
            self._inference_engine = InferenceEngine(
                llm=self.llm,
                retriever=self.retriever,
                reranker=self.reranker,
                router=self.router,
                history_store=self.history_store,
                top_k=self.settings.top_k,
                max_ui_products=self.settings.max_ui_products,
            )
        return self._inference_engine

    def preload(self) -> None:
        _ = self.embedding_model
        _ = self.vector_store
        _ = self.llm
        _ = self.reranker
        _ = self.retriever
        _ = self.router
        _ = self.history_store
        self.reranker.warmup()
        _ = self.inference_engine

    def health_snapshot(self) -> dict[str, str]:
        mongodb_status = "up"
        qdrant_status = "up"

        try:
            self.mongo_client.admin.command("ping")
        except Exception:
            mongodb_status = "down"

        try:
            self.vector_store.client.get_collections()
        except Exception:
            qdrant_status = "down"

        return {
            "mongodb": mongodb_status,
            "qdrant": qdrant_status,
        }


settings = AppSettings()
@asynccontextmanager
async def lifespan(app: FastAPI):
    container = app.state.container
    container.preload()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.state.container = ServiceContainer(settings)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_container() -> ServiceContainer:
    return app.state.container


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    container = get_container()
    service = container.health_snapshot()
    status = "ok" if all(value == "up" for value in service.values()) else "degraded"
    return HealthResponse(
        status=status,
        app=settings.app_name,
        environment=settings.app_env,
        mongodb=service["mongodb"],
        qdrant=service["qdrant"],
    )


@app.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    container = get_container()
    try:
        result = container.inference_engine.chat(
            query=payload.query,
            user_id=payload.user_id,
            session_id=payload.session_id,
        )
    except Exception as exc:
        logger.exception(
            "CHAT_ENDPOINT_ERROR user_id=%s session_id=%s query=%r model=%s",
            payload.user_id,
            payload.session_id,
            payload.query,
            os.getenv("OLLAMA_MODEL", "qwen2.5:3b"),
        )
        error_message = str(exc) if settings.app_env != "production" else "Chat service unavailable"
        raise HTTPException(
            status_code=_chat_error_status(exc),
            detail={
                "message": "Internal error while processing chat request",
                "error": error_message,
            },
        ) from exc

    citations = dict(result.get("citations", {}))

    return ChatResponse(
        answer=str(result.get("answer", "")),
        confidence=float(result.get("confidence", 0.0)),
        citations=citations,
        route=str(result.get("route", "chitchat")),
        rewrite_question=str(result.get("rewrite_question", "")),
        products=[ProductCard(**item) for item in result.get("products", [])],
        sources=[{"id": source_id, **source} for source_id, source in citations.items()],
        debug=None,
    )


def _chat_error_status(exc: Exception) -> int:
    error_text = f"{exc.__class__.__name__}: {exc}".lower()
    upstream_terms = ("connection", "timeout", "timed out", "qdrant", "ollama", "embedding", "model")
    return 503 if any(term in error_text for term in upstream_terms) else 500


@app.post("/ingest/mongodb", response_model=IngestResponse)
def ingest_mongodb() -> IngestResponse:
    container = get_container()
    try:
        chunks = container.indexer.ingest_mongodb_collection(container.product_collection)
        container.router.refresh_dynamic_terms()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"MongoDB ingest failed: {exc}") from exc

    return IngestResponse(status="ok", chunks_indexed=chunks)


@app.post("/reindex", response_model=ReindexResponse)
def reindex() -> ReindexResponse:
    container = get_container()
    try:
        result = container.indexer.reindex(container.product_collection)
        container.router.refresh_dynamic_terms()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Reindex failed: {exc}") from exc

    return ReindexResponse(status="ok", **result)
