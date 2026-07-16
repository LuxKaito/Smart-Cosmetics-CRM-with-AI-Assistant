from __future__ import annotations

import re
import unicodedata
from typing import Any

from src.processing.preprocessor import clean_metadata_value, normalize_text

MONGODB_PRODUCT_FIELDS = (
    "product_name_vn",
    "product_name_en",
    "description",
    "volume",
    "brand",
    "origin",
    "skin_type",
    "original_price",
    "sale_price",
    "rating",
    "review_count",
    "qa_count",
    "image_url",
    "category_level_1",
    "category_level_2",
    "benefits",
    "product_type",
    "ingredients",
    "usage_instructions",
)

SEARCHABLE_PRODUCT_FIELDS = (
    "product_name_vn",
    "product_name_en",
    "brand",
    "benefits",
    "product_type",
    "skin_type",
    "description",
    "ingredients",
    "usage_instructions",
    "origin",
    "volume",
    "original_price",
    "sale_price",
    "rating",
    "review_count",
)

SEARCHABLE_PRODUCT_FIELD_LABELS = {
    "product_name_vn": "Tên sản phẩm tiếng Việt",
    "product_name_en": "Tên sản phẩm tiếng Anh",
    "brand": "Thương hiệu",
    "benefits": "Công dụng",
    "product_type": "Loại sản phẩm",
    "skin_type": "Loại da",
    "description": "Mô tả",
    "ingredients": "Thành phần",
    "usage_instructions": "Hướng dẫn sử dụng",
    "origin": "Xuất xứ",
    "volume": "Dung tích",
    "original_price": "Giá gốc",
    "sale_price": "Giá bán",
    "rating": "Đánh giá",
    "review_count": "Số lượt đánh giá",
}

ROUTER_DYNAMIC_FIELDS = (
    "product_name_vn",
    "product_name_en",
    "brand",
    "volume",
    "origin",
    "benefits",
    "product_type",
    "skin_type",
)

FILTER_PAYLOAD_FIELDS = {
    "brand": "brand_filter",
    "benefits": "benefits_filter",
    "product_type": "product_type_filter",
    "skin_type": "skin_type_filter",
    "origin": "origin_filter",
    "volume": "volume_filter",
}

_WHITESPACE_RE = re.compile(r"\s+")
_SPLIT_RE = re.compile(r"[/,;|]+")


def normalize_match_text(value: Any) -> str:
    """Chuẩn hóa chuỗi để router và payload filter so khớp ổn định."""
    if value is None:
        return ""
    text = unicodedata.normalize("NFD", str(value).lower())
    without_accents = "".join(char for char in text if unicodedata.category(char) != "Mn")
    return _WHITESPACE_RE.sub(" ", without_accents).strip()


def expand_filter_values(value: Any, *, split_parts: bool = False) -> list[str]:
    """Tạo các giá trị exact-match cho payload Qdrant, gồm cả biến thể tách loại da."""
    normalized = normalize_match_text(value)
    if not normalized:
        return []

    values = {normalized}
    if split_parts:
        values.update(
            normalize_match_text(part)
            for part in _SPLIT_RE.split(str(value))
            if normalize_match_text(part)
        )
    return sorted(values)


def serialize_product_record(record: dict[str, Any]) -> dict[str, Any]:
    """Chuyển record MongoDB sang metadata JSON-friendly và giữ đúng schema sản phẩm."""
    serialized: dict[str, Any] = {}
    for key, value in record.items():
        if key == "_id":
            serialized[key] = str(value)
            continue
        serialized[key] = clean_metadata_value(value)
    return serialized


def build_searchable_text(record: dict[str, Any]) -> str:
    """Chỉ đưa các field phục vụ retrieval vào embedding text."""
    lines = [
        f"{SEARCHABLE_PRODUCT_FIELD_LABELS[field]}: {record[field]}"
        for field in SEARCHABLE_PRODUCT_FIELDS
        if record.get(field) not in (None, "")
    ]
    return normalize_text("\n".join(lines))


def build_filter_payload(record: dict[str, Any]) -> dict[str, Any]:
    """Tạo metadata phẳng để Qdrant lọc trước khi rerank."""
    payload: dict[str, Any] = {}
    for source_field, payload_field in FILTER_PAYLOAD_FIELDS.items():
        payload[payload_field] = expand_filter_values(
            record.get(source_field),
            split_parts=source_field == "skin_type",
        )

    for field in ("sale_price", "original_price", "rating", "review_count"):
        value = record.get(field)
        if isinstance(value, (int, float)):
            payload[field] = value
    return payload
