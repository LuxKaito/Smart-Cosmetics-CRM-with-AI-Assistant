from __future__ import annotations

import logging
import os
import warnings
from functools import lru_cache

from langchain_core.embeddings import Embeddings
from langchain_huggingface import HuggingFaceEmbeddings

from src.processing.preprocessor import normalize_text

with warnings.catch_warnings():
    # PyVi 0.1.1 còn regex string cũ và pickle NumPy cũ; warning không ảnh hưởng tokenize.
    warnings.filterwarnings("ignore", category=SyntaxWarning)
    warnings.filterwarnings("ignore", message=r"dtype\(\): align should be passed .*")
    from pyvi.ViTokenizer import tokenize

logger = logging.getLogger(__name__)

DEFAULT_EMBEDDING_MODEL = "dangvantuan/vietnamese-embedding"


def _cap_roberta_max_seq_length(delegate: HuggingFaceEmbeddings) -> None:
    """Cap RoBERTa input length when SentenceTransformer metadata exceeds the backbone limit."""
    client = delegate._client
    config = client._first_module().auto_model.config
    if config.model_type != "roberta":
        return

    safe_max_seq_length = config.max_position_embeddings - config.pad_token_id - 1
    if client.max_seq_length <= safe_max_seq_length:
        return

    logger.warning(
        "Cap embedding max_seq_length from %s to %s for RoBERTa backbone",
        client.max_seq_length,
        safe_max_seq_length,
    )
    client.max_seq_length = safe_max_seq_length


class VietnameseTokenizedEmbeddings(Embeddings):
    """Tokenize tiếng Việt bằng PyVi trước khi gọi embedding model Hugging Face."""

    def __init__(self, delegate: Embeddings) -> None:
        self.delegate = delegate

    @staticmethod
    def _prepare(text: str) -> str:
        normalized = normalize_text(text)
        if not normalized:
            return ""
        try:
            return tokenize(normalized)
        except Exception as exc:  # pragma: no cover - chỉ xảy ra khi PyVi runtime lỗi
            logger.warning("PyVi tokenize lỗi, dùng text đã chuẩn hóa: %s", exc)
            return normalized

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self.delegate.embed_documents([self._prepare(text) for text in texts])

    def embed_query(self, text: str) -> list[float]:
        return self.delegate.embed_query(self._prepare(text))


@lru_cache(maxsize=4)
def build_embedding_model(model_name: str | None = None) -> VietnameseTokenizedEmbeddings:
    selected = model_name or os.getenv("EMBEDDING_MODEL", DEFAULT_EMBEDDING_MODEL)

    hf_token = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACEHUB_API_TOKEN")
    model_kwargs: dict[str, object] = {"device": os.getenv("EMBEDDING_DEVICE", "cpu")}
    if hf_token:
        os.environ.setdefault("HF_TOKEN", hf_token)
        os.environ.setdefault("HUGGINGFACEHUB_API_TOKEN", hf_token)
        model_kwargs["token"] = hf_token

    delegate = HuggingFaceEmbeddings(
        model_name=selected,
        model_kwargs=model_kwargs,
        encode_kwargs={"normalize_embeddings": True},
    )
    _cap_roberta_max_seq_length(delegate)
    return VietnameseTokenizedEmbeddings(delegate)
