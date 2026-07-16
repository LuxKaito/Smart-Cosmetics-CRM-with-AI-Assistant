from __future__ import annotations

import logging
import re

from langchain_core.documents import Document

from src.processing.product_schema import normalize_match_text
from src.rag.query_analysis import QueryAnalysis, QueryMetadataAnalyzer
from src.rag.vector_store import QdrantVectorStoreManager
from src.router.product_terms import ProductTermCatalog

logger = logging.getLogger(__name__)

_PRODUCT_TYPE_RULES = (
    (("sua rua mat",), ("sua rua mat", "gel rua mat", "kem rua mat")),
    (("kem chong nang",), ("chong nang",)),
    (("dau tay trang",), ("dau tay trang",)),
    (("kem duong",), ("kem duong",)),
    (("kem mat",), ("kem mat",)),
    (("xit khoang",), ("xit khoang",)),
    (("sua duong",), ("sua duong",)),
    (("tay trang",), ("tay trang",)),
    (("mat na",), ("mat na",)),
    (("treatment",), ("treatment",)),
    (("cushion",), ("cushion",)),
    (("lotion",), ("lotion",)),
    (("toner",), ("toner", "nuoc can bang")),
    (("serum",), ("serum", "tinh chat")),
    (("son",), ("son",)),
    (("duong the", "body lotion"), ("duong the", "sua duong the", "body lotion")),
    (("sua tam",), ("sua tam",)),
    (("dau goi", "shampoo"), ("dau goi", "shampoo")),
    (("nuoc hoa",), ("nuoc hoa",)),
    (("khu mui",), ("khu mui", "lan khu mui")),
    (("ban chai",), ("ban chai",)),
    (("phan phu",), ("phan phu",)),
    (("mascara",), ("mascara",)),
    (("sunscreen",), ("chong nang", "kem chong nang")),
)


class RetrieverService:
    """Vector search Qdrant, payload filter và boost nhẹ theo yêu cầu người dùng."""

    def __init__(
        self,
        vector_store: QdrantVectorStoreManager,
        top_n_candidates: int = 20,
        query_analyzer: QueryMetadataAnalyzer | None = None,
    ) -> None:
        self.vector_store = vector_store
        self.top_n_candidates = top_n_candidates
        self.query_analyzer = query_analyzer or QueryMetadataAnalyzer()

    @staticmethod
    def _metadata_number(doc: Document, field: str) -> float | None:
        value = (doc.metadata or {}).get(field)
        return float(value) if isinstance(value, (int, float)) else None

    def _apply_business_boost(
        self,
        documents: list[Document],
        analysis: QueryAnalysis,
    ) -> list[Document]:
        if not documents:
            return []

        prices = [value for doc in documents if (value := self._metadata_number(doc, "sale_price")) is not None]
        ratings = [value for doc in documents if (value := self._metadata_number(doc, "rating")) is not None]
        reviews = [value for doc in documents if (value := self._metadata_number(doc, "review_count")) is not None]

        def normalized_inverse(value: float | None, values: list[float]) -> float:
            if value is None or not values or max(values) == min(values):
                return 0.0
            return (max(values) - value) / (max(values) - min(values))

        def normalized(value: float | None, values: list[float]) -> float:
            if value is None or not values or max(values) == min(values):
                return 0.0
            return (value - min(values)) / (max(values) - min(values))

        boosted_docs: list[Document] = []
        for doc in documents:
            metadata = dict(doc.metadata or {})
            boost = 0.0
            if "cheap" in analysis.sort_preferences:
                boost += 0.08 * normalized_inverse(self._metadata_number(doc, "sale_price"), prices)
            if "rating" in analysis.sort_preferences:
                boost += 0.08 * normalized(self._metadata_number(doc, "rating"), ratings)
            if "reviews" in analysis.sort_preferences:
                boost += 0.08 * normalized(self._metadata_number(doc, "review_count"), reviews)

            retrieval_score = float(metadata.get("score_retrieval") or 0.0)
            metadata["score_business_boost"] = round(boost, 6)
            metadata["score_retrieval_boosted"] = round(retrieval_score + boost, 6)
            boosted_docs.append(Document(page_content=doc.page_content, metadata=metadata))

        return sorted(
            boosted_docs,
            key=lambda item: float(item.metadata.get("score_retrieval_boosted", 0.0)),
            reverse=True,
        )

    @staticmethod
    def _contains_phrase(text: str, phrase: str) -> bool:
        return re.search(rf"(?<!\w){re.escape(phrase)}(?!\w)", text) is not None

    @classmethod
    def _requested_product_terms(cls, query: str) -> tuple[str, ...] | None:
        normalized = normalize_match_text(query)
        for query_terms, product_terms in _PRODUCT_TYPE_RULES:
            if query_terms == ("treatment",) and any(
                cls._contains_phrase(normalized, phrase)
                for phrase in ("sau treatment", "da treatment", "phuc hoi da sau treatment")
            ):
                continue
            if any(cls._contains_phrase(normalized, term) for term in query_terms):
                return product_terms
        return None

    @staticmethod
    def _product_match_text(doc: Document) -> str:
        metadata = doc.metadata or {}
        raw = metadata.get("raw_document")
        values = []
        if isinstance(raw, dict):
            values.extend(
                str(raw.get(field, ""))
                for field in (
                    "product_name_vn",
                    "product_name_en",
                    "product_type",
                )
            )
        else:
            values.append(doc.page_content)
        return normalize_match_text(" ".join(values))

    @classmethod
    def _filter_explicit_product_type(cls, query: str, documents: list[Document]) -> list[Document]:
        product_terms = cls._requested_product_terms(query)
        if not product_terms:
            return documents
        return [
            doc
            for doc in documents
            if any(cls._contains_phrase(cls._product_match_text(doc), term) for term in product_terms)
        ]

    def retrieve(self, query: str, catalog: ProductTermCatalog | None = None) -> list[Document]:
        analysis = self.query_analyzer.analyze(query, catalog or ProductTermCatalog())
        scored_results = self.vector_store.similarity_search_with_score(
            query,
            k=self.top_n_candidates,
            qdrant_filter=analysis.to_qdrant_filter(),
        )

        documents = self._with_retrieval_scores(scored_results)
        filtered_documents = self._filter_explicit_product_type(query, documents)
        if self._requested_product_terms(query) and not filtered_documents:
            retry_limit = max(self.top_n_candidates * 5, 100)
            logger.info(
                "RETRIEVER_EXPLICIT_TYPE_RETRY query=%r candidates=%s",
                query,
                retry_limit,
            )
            retry_results = self.vector_store.similarity_search_with_score(
                query,
                k=retry_limit,
                qdrant_filter=analysis.to_qdrant_filter(),
            )
            filtered_documents = self._filter_explicit_product_type(
                query,
                self._with_retrieval_scores(retry_results),
            )
        if not filtered_documents and analysis.conditions:
            retry_limit = max(self.top_n_candidates * 5, 100)
            logger.info(
                "RETRIEVER_FILTER_FALLBACK query=%r conditions=%s candidates=%s",
                query,
                [(item.field, item.operator, item.value) for item in analysis.conditions],
                retry_limit,
            )
            fallback_results = self.vector_store.similarity_search_with_score(
                query,
                k=retry_limit,
                qdrant_filter=None,
            )
            fallback_documents = self._with_retrieval_scores(fallback_results)
            filtered_documents = self._filter_explicit_product_type(query, fallback_documents)
            if self._requested_product_terms(query) and not filtered_documents:
                filtered_documents = fallback_documents
        return self._apply_business_boost(filtered_documents, analysis)

    @staticmethod
    def _with_retrieval_scores(scored_results) -> list[Document]:
        documents: list[Document] = []
        for doc, score in scored_results:
            metadata = dict(doc.metadata or {})
            metadata["score_retrieval"] = float(score)
            documents.append(Document(page_content=doc.page_content, metadata=metadata))
        return documents
