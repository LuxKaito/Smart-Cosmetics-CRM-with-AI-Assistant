from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Iterable

from src.processing.product_schema import expand_filter_values, normalize_match_text


def _add_term(target: dict[str, str], term: Any, filter_value: Any | None = None) -> None:
    normalized_term = normalize_match_text(term)
    normalized_filter = normalize_match_text(filter_value if filter_value is not None else term)
    if normalized_term and normalized_filter:
        target.setdefault(normalized_term, normalized_filter)


@dataclass
class ProductTermCatalog:
    """Catalog gọn cho router và metadata filter, không chứa các field mô tả dài."""

    product_name_terms: set[str] = field(default_factory=set)
    brand_terms: dict[str, str] = field(default_factory=dict)
    volume_terms: dict[str, str] = field(default_factory=dict)
    origin_terms: dict[str, str] = field(default_factory=dict)
    benefit_terms: dict[str, str] = field(default_factory=dict)
    category_terms: dict[str, str] = field(default_factory=dict)
    skin_type_terms: dict[str, str] = field(default_factory=dict)

    @classmethod
    def from_records(cls, records: Iterable[dict[str, Any]]) -> "ProductTermCatalog":
        catalog = cls()
        for record in records:
            for field_name in ("product_name_vn", "product_name_en"):
                term = normalize_match_text(record.get(field_name))
                if len(term) >= 4:
                    catalog.product_name_terms.add(term)

            _add_term(catalog.brand_terms, record.get("brand"))
            _add_term(catalog.volume_terms, record.get("volume"))
            _add_term(catalog.origin_terms, record.get("origin"))
            _add_term(catalog.benefit_terms, record.get("benefits"))
            _add_term(catalog.category_terms, record.get("product_type"))

            skin_type = record.get("skin_type")
            for term in expand_filter_values(skin_type, split_parts=True):
                _add_term(catalog.skin_type_terms, term, term)
        return catalog

    def is_empty(self) -> bool:
        return not any(
            (
                self.product_name_terms,
                self.brand_terms,
                self.volume_terms,
                self.origin_terms,
                self.benefit_terms,
                self.category_terms,
                self.skin_type_terms,
            )
        )
