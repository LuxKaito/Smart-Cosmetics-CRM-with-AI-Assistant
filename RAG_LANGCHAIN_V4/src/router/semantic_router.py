from __future__ import annotations

import logging
import re
from collections.abc import Callable, Iterable
from dataclasses import dataclass
from difflib import SequenceMatcher
from typing import Any

from src.processing.product_schema import normalize_match_text
from src.router.product_terms import ProductTermCatalog

logger = logging.getLogger(__name__)

PRODUCT_TYPE_KEYWORDS = {
    "serum",
    "sữa rửa mặt",
    "sua rua mat",
    "kem dưỡng",
    "kem duong",
    "toner",
    "kem chống nắng",
    "kem chong nang",
    "tẩy trang",
    "tay trang",
    "mặt nạ",
    "mat na",
    "son",
    "cushion",
    "lotion",
    "treatment",
    "kem mắt",
    "kem mat",
    "xịt khoáng",
    "xit khoang",
    "sữa dưỡng",
    "sua duong",
    "dầu tẩy trang",
    "dau tay trang",
}

BEAUTY_INTENT_KEYWORDS = {
    "dưỡng ẩm",
    "duong am",
    "cấp ẩm",
    "cap am",
    "làm sạch",
    "lam sach",
    "trị mụn",
    "tri mun",
    "mụn",
    "mun",
    "mụn ẩn",
    "mun an",
    "thâm mụn",
    "tham mun",
    "làm sáng",
    "lam sang",
    "chống nắng",
    "chong nang",
    "phục hồi",
    "phuc hoi",
    "chống lão hóa",
    "chong lao hoa",
    "kiềm dầu",
    "kiem dau",
    "làm dịu",
    "lam diu",
    "sạm da",
    "sam da",
    "ngừa lão hóa",
    "ngua lao hoa",
    "se khít lỗ chân lông",
    "se khit lo chan long",
    "tẩy tế bào chết",
    "tay te bao chet",
    "làm đều màu da",
    "lam deu mau da",
    "giảm kích ứng",
    "giam kich ung",
    "mỹ phẩm",
    "my pham",
    "chăm sóc da",
    "cham soc da",
    "làm đẹp",
    "lam dep",
}

INGREDIENT_KEYWORDS = {
    "bha",
    "aha",
    "pha",
    "retinol",
    "retinal",
    "tretinoin",
    "niacinamide",
    "vitamin c",
    "ascorbic acid",
    "hyaluronic acid",
    "ha",
    "ceramide",
    "panthenol",
    "b5",
    "salicylic acid",
    "glycolic acid",
    "lactic acid",
    "azelaic acid",
    "tranexamic acid",
    "peptide",
    "collagen",
    "centella",
    "cica",
    "tea tree",
    "rau má",
    "rau ma",
    "zinc",
    "zinc pca",
    "squalane",
    "glycerin",
    "allantoin",
    "arbutin",
    "alpha arbutin",
}

SKIN_TYPE_KEYWORDS = {
    "da dầu",
    "da dau",
    "da khô",
    "da kho",
    "da nhạy cảm",
    "da nhay cam",
    "da hỗn hợp",
    "da hon hop",
    "da mụn",
    "da mun",
    "da thường",
    "da thuong",
}

COMMERCE_KEYWORDS = {
    "giá",
    "gia",
    "bao nhiêu",
    "bao nhieu",
    "mua",
    "review",
    "rating",
    "đánh giá",
    "danh gia",
    "loại nào",
    "loai nao",
    "nên dùng",
    "nen dung",
    "tư vấn",
    "tu van",
    "so sánh",
    "so sanh",
    "có tốt không",
    "co tot khong",
    "công dụng là gì",
    "cong dung la gi",
    "thành phần là gì",
    "thanh phan la gi",
}

ADDITIONAL_PRODUCT_TYPE_KEYWORDS = {
    "duong the",
    "sua tam",
    "dau goi",
    "dung cu trang diem",
    "phan phu",
    "mascara",
    "nuoc hoa",
    "khu mui",
    "ban chai",
    "micellar",
    "cleanser",
    "sunscreen",
    "moisturizer",
    "body lotion",
    "shampoo",
    "mask",
}

ADDITIONAL_BEAUTY_INTENT_KEYWORDS = {
    "san pham",
    "routine",
    "skincare",
    "oily",
    "sensitive",
    "acne",
    "spf",
    "mini",
    "sample",
    "travel",
    "du lich",
    "dung tich",
    "nhe mat",
}

ADDITIONAL_COMMERCE_KEYWORDS = {
    "dung tich",
    "mini",
    "sample",
    "ban mini",
    "mau mini",
    "mau nao",
    "hop di hoc",
    "re nhat",
    "dat nhat",
    "lon nhat",
    "loai cho da",
    "san pham nao",
    "under",
    "below",
    "recommend",
}

STATIC_PRODUCT_KEYWORDS = set().union(
    PRODUCT_TYPE_KEYWORDS,
    ADDITIONAL_PRODUCT_TYPE_KEYWORDS,
    BEAUTY_INTENT_KEYWORDS,
    ADDITIONAL_BEAUTY_INTENT_KEYWORDS,
    INGREDIENT_KEYWORDS,
    SKIN_TYPE_KEYWORDS,
    COMMERCE_KEYWORDS,
    ADDITIONAL_COMMERCE_KEYWORDS,
)

_DIRECT_STATIC_KEYWORDS = set().union(
    PRODUCT_TYPE_KEYWORDS,
    ADDITIONAL_PRODUCT_TYPE_KEYWORDS,
    BEAUTY_INTENT_KEYWORDS,
    ADDITIONAL_BEAUTY_INTENT_KEYWORDS,
    INGREDIENT_KEYWORDS,
)
_ADVICE_KEYWORDS = set().union(
    COMMERCE_KEYWORDS,
    {"chọn", "chon", "gợi ý", "goi y", "tìm", "tim", "dùng gì", "dung gi"},
)
_ADVICE_KEYWORDS.update(ADDITIONAL_COMMERCE_KEYWORDS)
_NORMALIZED_PRODUCT_TYPE_KEYWORDS = {normalize_match_text(term) for term in PRODUCT_TYPE_KEYWORDS}
_NORMALIZED_DIRECT_STATIC_KEYWORDS = {normalize_match_text(term) for term in _DIRECT_STATIC_KEYWORDS}
_NORMALIZED_ADVICE_KEYWORDS = {normalize_match_text(term) for term in _ADVICE_KEYWORDS}
_NORMALIZED_SKIN_TYPE_KEYWORDS = {normalize_match_text(term) for term in SKIN_TYPE_KEYWORDS}
_NORMALIZED_FOLLOW_UP_PRODUCT_KEYWORDS = {
    normalize_match_text(term)
    for term in {
        "re nhat",
        "dat nhat",
        "mini",
        "sample",
        "ban mini",
        "dung tich",
        "lon nhat",
        "mau",
        "mau nao",
        "di hoc",
        "rating",
        "danh gia",
        "loai",
        "loai cho da",
        "san pham",
        "nhe mat",
        "cai nao",
        "nen chon",
        "co loai nao",
    }
}


@dataclass(frozen=True)
class RouteDecision:
    route: str
    confidence: float
    reason: str


def _contains_phrase(text: str, phrase: str) -> bool:
    return re.search(rf"(?<!\w){re.escape(phrase)}(?!\w)", text) is not None


def _contains_any(text: str, phrases: Iterable[str]) -> bool:
    return any(_contains_phrase(text, phrase) for phrase in phrases if phrase)


def _matching_term(text: str, terms: dict[str, str]) -> str | None:
    matches = [term for term in terms if _contains_phrase(text, term)]
    return max(matches, key=len) if matches else None


class SemanticRouter:
    """Router rule-based chỉ phân loại intent chitchat hoặc product_rag."""

    def __init__(
        self,
        records: Iterable[dict[str, Any]] | None = None,
        records_loader: Callable[[], Iterable[dict[str, Any]]] | None = None,
    ) -> None:
        self._records_loader = records_loader
        self.catalog = ProductTermCatalog.from_records(records or [])
        self._dynamic_terms_loaded = records is not None

    def refresh_dynamic_terms(self) -> None:
        """Nạp lại term sau seed/reindex; nếu Mongo lỗi router vẫn chạy bằng static keywords."""
        if self._records_loader is None:
            return
        try:
            catalog = ProductTermCatalog.from_records(self._records_loader())
        except Exception as exc:  # pragma: no cover - phụ thuộc trạng thái MongoDB runtime
            logger.warning("Không thể nạp dynamic product terms: %s", exc)
            return
        self.catalog = catalog
        self._dynamic_terms_loaded = not catalog.is_empty()

    def _ensure_dynamic_terms(self) -> None:
        if not self._dynamic_terms_loaded:
            self.refresh_dynamic_terms()

    @staticmethod
    def _looks_like_product_name(query: str, product_names: Iterable[str]) -> bool:
        query_tokens = {token for token in query.split() if len(token) >= 2}
        for product_name in product_names:
            if _contains_phrase(query, product_name) or _contains_phrase(product_name, query):
                return True

            name_tokens = {token for token in product_name.split() if len(token) >= 2}
            overlap = query_tokens.intersection(name_tokens)
            if len(overlap) >= 2 and len(overlap) / max(min(len(query_tokens), len(name_tokens)), 1) >= 0.8:
                return True
            if SequenceMatcher(None, query, product_name).ratio() >= 0.82:
                return True
        return False

    def _has_product_signal(self, text: str) -> bool:
        return (
            _contains_any(text, _NORMALIZED_DIRECT_STATIC_KEYWORDS)
            or _matching_term(text, self.catalog.brand_terms) is not None
            or _matching_term(text, self.catalog.category_terms) is not None
            or _matching_term(text, self.catalog.benefit_terms) is not None
        )

    def route(self, query: str, recent_history: str = "") -> RouteDecision:
        self._ensure_dynamic_terms()
        normalized_query = normalize_match_text(query)
        normalized_history = normalize_match_text(recent_history)

        if _contains_any(normalized_query, _NORMALIZED_DIRECT_STATIC_KEYWORDS):
            return RouteDecision("product_rag", 0.95, "Khớp static cosmetic keyword")

        brand = _matching_term(normalized_query, self.catalog.brand_terms)
        if brand:
            return RouteDecision("product_rag", 0.94, f"Khớp thương hiệu: {brand}")

        category = _matching_term(normalized_query, self.catalog.category_terms)
        if category:
            return RouteDecision("product_rag", 0.93, f"Khớp loại sản phẩm: {category}")

        benefit = _matching_term(normalized_query, self.catalog.benefit_terms)
        if benefit:
            return RouteDecision("product_rag", 0.92, f"Khớp công dụng: {benefit}")

        has_advice_intent = _contains_any(normalized_query, _NORMALIZED_ADVICE_KEYWORDS)
        has_skin_type = _contains_any(normalized_query, _NORMALIZED_SKIN_TYPE_KEYWORDS) or (
            _matching_term(normalized_query, self.catalog.skin_type_terms) is not None
        )
        if has_skin_type and has_advice_intent:
            return RouteDecision("product_rag", 0.9, "Loại da đi kèm intent tư vấn")

        origin = _matching_term(normalized_query, self.catalog.origin_terms)
        if origin and (self._has_product_signal(normalized_query) or has_advice_intent):
            return RouteDecision("product_rag", 0.86, f"Xuất xứ đi kèm intent sản phẩm: {origin}")

        volume = _matching_term(normalized_query, self.catalog.volume_terms)
        if volume and self._has_product_signal(normalized_query):
            return RouteDecision("product_rag", 0.85, f"Dung tích đi kèm intent sản phẩm: {volume}")

        if self._looks_like_product_name(normalized_query, self.catalog.product_name_terms):
            return RouteDecision("product_rag", 0.88, "Fuzzy match tên sản phẩm")

        if (
            self._has_product_signal(normalized_history)
            and _contains_any(normalized_query, _NORMALIZED_FOLLOW_UP_PRODUCT_KEYWORDS)
        ):
            return RouteDecision("product_rag", 0.8, "Follow-up co tin hieu loc san pham")

        if has_advice_intent and self._has_product_signal(normalized_history):
            return RouteDecision("product_rag", 0.78, "Follow-up của chủ đề sản phẩm gần nhất")

        return RouteDecision("chitchat", 0.9, "Không có intent sản phẩm")
