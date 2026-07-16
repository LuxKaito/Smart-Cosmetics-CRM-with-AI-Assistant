from __future__ import annotations

from typing import Any

from langchain_core.documents import Document


def build_citations(documents: list[Document]) -> dict[str, dict[str, Any]]:
    citations: dict[str, dict[str, Any]] = {}
    for idx, doc in enumerate(documents, start=1):
        metadata = doc.metadata or {}
        citations[f"source_{idx}"] = {
            "source_type": metadata.get("source_type"),
            "source_id": metadata.get("source_id"),
            "collection": metadata.get("collection"),
            "file_name": metadata.get("file_name"),
            "page": metadata.get("page"),
            "chunk_index": metadata.get("chunk_index"),
            "score_retrieval": metadata.get("score_retrieval"),
            "score_business_boost": metadata.get("score_business_boost"),
            "score_retrieval_boosted": metadata.get("score_retrieval_boosted"),
            "score_rerank": metadata.get("score_rerank"),
        }
    return citations


def estimate_confidence(route_confidence: float, documents: list[Document]) -> float:
    if not documents:
        return round(max(min(route_confidence, 0.99), 0.05), 4)

    rerank_scores: list[float] = []
    for doc in documents:
        score = doc.metadata.get("score_rerank") if doc.metadata else None
        if isinstance(score, (int, float)):
            rerank_scores.append(float(score))

    if not rerank_scores:
        return round(max(min(route_confidence, 0.99), 0.05), 4)

    avg = sum(rerank_scores) / len(rerank_scores)
    if avg > 1.0:
        avg = 1.0
    if avg < 0.0:
        avg = 0.0

    blended = 0.6 * route_confidence + 0.4 * avg
    return round(max(min(blended, 0.99), 0.05), 4)
