from __future__ import annotations

import os
import logging
import re
from typing import Any

from src.core.base_llm import BaseLLM
from src.history.chat_history import ChatHistoryStore
from src.inference.query_rewriter import QueryRewriteService
from src.inference.response_parser import build_citations, estimate_confidence
from src.processing.product_schema import normalize_match_text
from src.prompts.chain import build_product_opening_prompt, build_user_prompt
from src.prompts.templates import SYSTEM_PROMPT_CHITCHAT, SYSTEM_PROMPT_PRODUCT
from src.rag.reranker import RerankerService
from src.rag.retriever import RetrieverService
from src.router.semantic_router import RouteDecision, SemanticRouter

logger = logging.getLogger(__name__)

MIN_RECOMMENDED_PRODUCTS = 4
NO_PRODUCTS_ANSWER = (
    "Hiện tại tôi chưa tìm thấy sản phẩm phù hợp trong dữ liệu. "
    "Bạn có thể mô tả thêm loại da, công dụng hoặc khoảng giá mong muốn."
)
CHITCHAT_UNAVAILABLE_ANSWER = (
    "Hiện tại trợ lý đang gặp gián đoạn khi xử lý câu hỏi. "
    "Bạn vui lòng thử lại sau ít phút."
)
PRODUCT_ANSWER_FOOTER = (
    "Bạn muốn shop lọc tiếp theo mức giá, loại da, thương hiệu "
    "hoặc thành phần cụ thể không?"
)
_PRODUCT_TYPE_LABELS = (
    ("sua rua mat", "sữa rửa mặt"),
    ("kem chong nang", "kem chống nắng"),
    ("dau tay trang", "dầu tẩy trang"),
    ("kem duong", "kem dưỡng"),
    ("kem mat", "kem mắt"),
    ("xit khoang", "xịt khoáng"),
    ("sua duong", "sữa dưỡng"),
    ("tay trang", "tẩy trang"),
    ("mat na", "mặt nạ"),
    ("treatment", "treatment"),
    ("cushion", "cushion"),
    ("lotion", "lotion"),
    ("toner", "toner"),
    ("serum", "serum"),
    ("son", "son"),
)


class InferenceEngine:
    """Điều phối chat history -> router -> rewrite -> retrieval -> rerank -> LLM."""

    def __init__(
        self,
        llm: BaseLLM,
        retriever: RetrieverService,
        reranker: RerankerService,
        router: SemanticRouter,
        history_store: ChatHistoryStore,
        top_k: int | None = None,
        max_ui_products: int | None = None,
    ) -> None:
        self.llm = llm
        self.retriever = retriever
        self.reranker = reranker
        self.router = router
        self.history_store = history_store
        self.query_rewriter = QueryRewriteService(llm)
        configured_top_k = top_k if top_k is not None else int(os.getenv("TOP_K", "4"))
        self.max_ui_products = (
            max_ui_products
            if max_ui_products is not None
            else int(os.getenv("MAX_UI_PRODUCTS", "4"))
        )
        self.max_ui_products = max(self.max_ui_products, MIN_RECOMMENDED_PRODUCTS)
        self.top_k = max(configured_top_k, self.max_ui_products)

    @staticmethod
    def _first_non_empty(raw: dict[str, Any], keys: list[str]) -> str | None:
        for key in keys:
            value = raw.get(key)
            if value is None:
                continue
            text = str(value).strip()
            if text:
                return text
        return None

    @staticmethod
    def _parse_int(value: Any) -> int | None:
        if isinstance(value, (int, float)):
            return int(value)
        if not isinstance(value, str):
            return None
        digits = "".join(char for char in value if char.isdigit())
        return int(digits) if digits else None

    @staticmethod
    def _parse_float(value: Any) -> float | None:
        if isinstance(value, (int, float)):
            return float(value)
        if not isinstance(value, str):
            return None
        match = re.search(r"\d+(?:\.\d+)?", value)
        return float(match.group(0)) if match else None

    @staticmethod
    def _shorten_summary(text: str | None, max_length: int = 180) -> str | None:
        if not text:
            return None
        compact = " ".join(text.split())
        if len(compact) <= max_length:
            return compact
        return f"{compact[: max_length - 3].rstrip()}..."

    @staticmethod
    def _product_document_key(doc: Any, fallback_index: int) -> str:
        metadata = getattr(doc, "metadata", {}) or {}
        raw = metadata.get("raw_document")
        if isinstance(raw, dict):
            product_id = str(raw.get("_id", "")).strip()
            if product_id:
                return product_id
        source_id = str(metadata.get("source_id", "")).strip()
        return source_id or f"document:{fallback_index}"

    @classmethod
    def _deduplicate_product_documents(cls, documents: list[Any]) -> list[Any]:
        """Giữ chunk có thứ hạng cao nhất của mỗi sản phẩm trước khi rerank."""
        output: list[Any] = []
        seen_keys: set[str] = set()
        for index, doc in enumerate(documents):
            key = cls._product_document_key(doc, index)
            if key in seen_keys:
                continue
            seen_keys.add(key)
            output.append(doc)
        return output

    @staticmethod
    def _product_type_label(rewrite_question: str) -> str:
        normalized = normalize_match_text(rewrite_question)
        for keyword, label in _PRODUCT_TYPE_LABELS:
            if re.search(rf"(?<!\w){re.escape(keyword)}(?!\w)", normalized):
                return label
        return "sản phẩm"

    @staticmethod
    def _format_price(value: Any) -> str | None:
        if not isinstance(value, int) or value <= 0:
            return None
        return f"{value:,}".replace(",", ".") + "đ"

    @classmethod
    def _format_product_lines(cls, products: list[dict[str, Any]]) -> list[str]:
        lines: list[str] = []
        for index, product in enumerate(products, start=1):
            details: list[str] = []
            price = cls._format_price(product.get("price"))
            rating = product.get("rating")
            summary = product.get("summary")
            if price:
                details.append(f"Giá: {price}")
            if isinstance(rating, (int, float)) and rating > 0:
                details.append(f"Đánh giá: {rating:g}/5")
            if summary:
                details.append(f"Mô tả: {summary}")

            line = f"{index}. {product['name']}"
            if details:
                line += "\n" + "\n".join(f"   - {detail}" for detail in details)
            lines.append(line)
        return lines

    @staticmethod
    def _fallback_product_opening(product_type: str) -> str:
        return f"Dạ, bên shop mình đã xem kỹ nhu cầu {product_type} của bạn."

    def _generate_product_opening(self, query: str, rewrite_question: str, product_type: str) -> str:
        fallback = self._fallback_product_opening(product_type)
        prompt = build_product_opening_prompt(
            query=query,
            rewrite_question=rewrite_question,
            product_type=product_type,
        )
        try:
            raw = self.llm.generate(system_prompt=SYSTEM_PROMPT_PRODUCT, user_prompt=prompt)
        except Exception:
            return fallback

        first_line = next((line.strip().lstrip("- ").strip() for line in raw.splitlines() if line.strip()), "")
        if not first_line.startswith("Dạ,") or len(first_line) > 240 or "{" in first_line:
            return fallback
        return first_line

    def _build_product_answer(
        self,
        query: str,
        rewrite_question: str,
        products: list[dict[str, Any]],
    ) -> str:
        if not products:
            return NO_PRODUCTS_ANSWER

        product_type = self._product_type_label(rewrite_question)
        opening = self._generate_product_opening(query, rewrite_question, product_type)
        header = (
            f"Bên shop mình lọc được {len(products)} {product_type} "
            f"phù hợp với nhu cầu của bạn:"
        )
        product_lines = self._format_product_lines(products)
        return "\n\n".join((opening, header, *product_lines, PRODUCT_ANSWER_FOOTER))

    def _extract_products(self, documents: list[Any]) -> list[dict[str, Any]]:
        """Tạo card frontend từ raw_document, không bịa field không có trong Excel."""
        products: list[dict[str, Any]] = []
        seen_ids: set[str] = set()

        for doc in documents:
            raw = (getattr(doc, "metadata", {}) or {}).get("raw_document")
            if not isinstance(raw, dict):
                continue

            product_id = str(raw.get("_id", "")).strip()
            name = self._first_non_empty(raw, ["product_name_vn", "product_name_en"])
            unique_key = product_id or name or ""
            if not name or not unique_key or unique_key in seen_ids:
                continue
            seen_ids.add(unique_key)

            products.append(
                {
                    "product_id": product_id or None,
                    "name": name,
                    "summary": self._shorten_summary(self._first_non_empty(raw, ["description"])),
                    "price": self._parse_int(raw.get("sale_price")),
                    "original_price": self._parse_int(raw.get("original_price")),
                    "promotion": None,
                    "rating": self._parse_float(raw.get("rating")),
                    "image_url": self._first_non_empty(raw, ["image_url"]),
                    "product_url": f"/products/{product_id}" if product_id else None,
                }
            )
            if len(products) >= self.max_ui_products:
                break
        return products

    def chat(self, query: str, user_id: str, session_id: str) -> dict[str, Any]:
        model_name = str(getattr(self.llm, "model_name", self.llm.__class__.__name__))
        logger.info(
            "CHAT_QUERY user_id=%s session_id=%s model=%s query=%r",
            user_id,
            session_id,
            model_name,
            query,
        )
        try:
            history = self.history_store.get_context(user_id=user_id, session_id=session_id)
        except Exception:
            logger.exception("CHAT_HISTORY_READ_ERROR user_id=%s session_id=%s", user_id, session_id)
            history = {"summary": "", "recent_turns": [], "recent_text": ""}

        try:
            decision = self.router.route(query=query, recent_history=str(history.get("recent_text", "")))
        except Exception:
            logger.exception("CHAT_ROUTER_ERROR query=%r", query)
            decision = RouteDecision("product_rag", 0.5, "Router error fallback")
        logger.info(
            "CHAT_ROUTE route=%s confidence=%.4f reason=%s",
            decision.route,
            decision.confidence,
            decision.reason,
        )

        selected_docs = []
        rewrite_question = query

        if decision.route == "product_rag":
            # Chỉ product_rag mới được gọi rewrite, Qdrant và reranker.
            try:
                rewrite_question = self.query_rewriter.rewrite(query, history)
            except Exception:
                logger.exception("CHAT_REWRITE_ERROR query=%r", query)
                rewrite_question = query
            logger.info("CHAT_REWRITE original=%r rewritten=%r", query, rewrite_question)

            try:
                retrieved_docs = self.retriever.retrieve(rewrite_question, catalog=self.router.catalog)
            except Exception:
                logger.exception("CHAT_QDRANT_RETRIEVAL_ERROR rewritten=%r", rewrite_question)
                retrieved_docs = []
            logger.info("CHAT_QDRANT_RESULT_COUNT count=%s", len(retrieved_docs))

            distinct_docs = self._deduplicate_product_documents(retrieved_docs)
            try:
                selected_docs = self.reranker.rerank(rewrite_question, distinct_docs, top_k=self.top_k)
            except Exception:
                logger.exception("CHAT_RERANK_ERROR rewritten=%r", rewrite_question)
                selected_docs = distinct_docs[: self.top_k]
            products = self._extract_products(selected_docs)
            answer = self._build_product_answer(query, rewrite_question, products)
        else:
            user_prompt = build_user_prompt(
                query=query,
                history_summary=str(history.get("summary", "")),
                recent_text=str(history.get("recent_text", "")),
            )
            try:
                answer = self.llm.generate(system_prompt=SYSTEM_PROMPT_CHITCHAT, user_prompt=user_prompt)
            except Exception:
                logger.exception("CHAT_CHITCHAT_LLM_ERROR query=%r model=%s", query, model_name)
                answer = CHITCHAT_UNAVAILABLE_ANSWER
            products = []

        citations = build_citations(selected_docs)
        confidence = estimate_confidence(decision.confidence, selected_docs)

        try:
            self.history_store.append_turn(
                user_id=user_id,
                session_id=session_id,
                role="user",
                content=query,
                route=decision.route,
            )
            self.history_store.append_turn(
                user_id=user_id,
                session_id=session_id,
                role="assistant",
                content=answer,
                route=decision.route,
                extra={
                    "confidence": confidence,
                    "citations": citations,
                    "rewrite_question": rewrite_question,
                },
            )
        except Exception:
            logger.exception("CHAT_HISTORY_WRITE_ERROR user_id=%s session_id=%s", user_id, session_id)

        return {
            "answer": answer,
            "confidence": confidence,
            "citations": citations,
            "route": decision.route,
            "route_confidence": decision.confidence,
            "rewrite_question": rewrite_question,
            "products": products,
        }
