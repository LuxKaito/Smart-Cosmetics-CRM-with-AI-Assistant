from __future__ import annotations

import logging
import os
from typing import Iterable

from langchain_core.documents import Document

logger = logging.getLogger(__name__)

try:
    import torch
    from transformers import AutoModelForSequenceClassification, AutoTokenizer
except Exception:  # pragma: no cover - fallback được test bằng monkeypatch
    torch = None
    AutoModelForSequenceClassification = None
    AutoTokenizer = None

DEFAULT_RERANK_MODEL = "AITeamVN/Vietnamese_Reranker"


class RerankerService:
    """Rerank bằng Vietnamese_Reranker và fallback theo retrieval score nếu model lỗi."""

    def __init__(
        self,
        model_name: str | None = None,
        use_rerank: bool | None = None,
        max_length: int = 2304,
    ) -> None:
        self.model_name = model_name or os.getenv("RERANK_MODEL", DEFAULT_RERANK_MODEL)
        self.use_rerank = (
            use_rerank
            if use_rerank is not None
            else os.getenv("USE_RERANK", "true").lower() == "true"
        )
        self.max_length = max_length
        self.device = os.getenv("RERANK_DEVICE", "cpu")
        self._tokenizer = None
        self._model = None
        self._load_failed = False

    def _load_backend(self):
        if not self.use_rerank or self._load_failed:
            return None
        if self._tokenizer is not None and self._model is not None:
            return self._tokenizer, self._model
        if torch is None or AutoTokenizer is None or AutoModelForSequenceClassification is None:
            return None

        try:
            self._tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self._model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
            self._model.to(self.device)
            self._model.eval()
        except Exception as exc:
            self._load_failed = True
            logger.warning("Không load được reranker %s: %s", self.model_name, exc)
            return None
        return self._tokenizer, self._model

    def warmup(self) -> None:
        if self.use_rerank:
            self._load_backend()

    @staticmethod
    def _fallback(documents: list[Document], top_k: int) -> list[Document]:
        """Nếu model chưa sẵn sàng, giữ thứ tự vector search đã được boost."""
        output: list[Document] = []
        for doc in documents[:top_k]:
            metadata = dict(doc.metadata or {})
            metadata["score_rerank"] = metadata.get("score_retrieval_boosted", metadata.get("score_retrieval", 0.0))
            output.append(Document(page_content=doc.page_content, metadata=metadata))
        return output

    def rerank(self, query: str, documents: Iterable[Document], top_k: int = 4) -> list[Document]:
        docs = list(documents)
        if not docs:
            return []
        if not self.use_rerank:
            return self._fallback(docs, top_k)

        backend = self._load_backend()
        if backend is None:
            return self._fallback(docs, top_k)

        tokenizer, model = backend
        pairs = [[query, doc.page_content] for doc in docs]
        try:
            inputs = tokenizer(
                pairs,
                padding=True,
                truncation=True,
                return_tensors="pt",
                max_length=self.max_length,
            )
            inputs = {name: value.to(self.device) for name, value in inputs.items()}
            with torch.no_grad():
                scores = model(**inputs, return_dict=True).logits.view(-1).float().tolist()
        except Exception as exc:
            logger.warning("Rerank lỗi, giữ thứ tự vector search: %s", exc)
            return self._fallback(docs, top_k)

        ranked: list[Document] = []
        for doc, score in zip(docs, scores):
            metadata = dict(doc.metadata or {})
            metadata["score_rerank"] = float(score)
            ranked.append(Document(page_content=doc.page_content, metadata=metadata))
        ranked.sort(key=lambda item: float(item.metadata.get("score_rerank", 0.0)), reverse=True)
        return ranked[:top_k]
