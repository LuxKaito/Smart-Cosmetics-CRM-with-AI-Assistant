from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Literal

from qdrant_client.http import models

from src.processing.product_schema import FILTER_PAYLOAD_FIELDS, normalize_match_text
from src.router.product_terms import ProductTermCatalog

FilterOperator = Literal["match", "lte", "gte"]
SortPreference = Literal["cheap", "rating", "reviews"]

_NUMBER_RE = r"(\d+(?:[.,]\d+)?)\s*(k|nghin|ngan|trieu|m)?"


@dataclass(frozen=True)
class MetadataCondition:
    field: str
    operator: FilterOperator
    value: str | float | int


@dataclass
class QueryAnalysis:
    conditions: list[MetadataCondition] = field(default_factory=list)
    sort_preferences: list[SortPreference] = field(default_factory=list)

    def to_qdrant_filter(self) -> models.Filter | None:
        must: list[models.FieldCondition] = []
        for condition in self.conditions:
            payload_field = FILTER_PAYLOAD_FIELDS.get(condition.field, condition.field)
            key = f"metadata.{payload_field}"
            if condition.operator == "match":
                must.append(
                    models.FieldCondition(
                        key=key,
                        match=models.MatchValue(value=condition.value),
                    )
                )
                continue

            range_kwargs = {condition.operator: condition.value}
            must.append(models.FieldCondition(key=key, range=models.Range(**range_kwargs)))
        return models.Filter(must=must) if must else None


def _contains_phrase(query: str, term: str) -> bool:
    if not term:
        return False
    return re.search(rf"(?<!\w){re.escape(term)}(?!\w)", query) is not None


def _longest_term_match(query: str, terms: dict[str, str]) -> str | None:
    matches = [
        (term, filter_value)
        for term, filter_value in terms.items()
        if _contains_phrase(query, term)
    ]
    if not matches:
        return None
    return max(matches, key=lambda item: len(item[0]))[1]


def _parse_amount(number: str, unit: str | None) -> int:
    amount = float(number.replace(",", "."))
    if unit in {"k", "nghin", "ngan"}:
        amount *= 1_000
    elif unit in {"trieu", "m"}:
        amount *= 1_000_000
    return int(amount)


class QueryMetadataAnalyzer:
    """Trích payload filter và tín hiệu ưu tiên từ rewritten query."""

    def analyze(self, query: str, catalog: ProductTermCatalog) -> QueryAnalysis:
        normalized = normalize_match_text(query)
        analysis = QueryAnalysis()

        for field_name, terms in (
            ("brand", catalog.brand_terms),
            ("benefits", catalog.benefit_terms),
            ("product_type", catalog.category_terms),
            ("skin_type", catalog.skin_type_terms),
            ("origin", catalog.origin_terms),
            ("volume", catalog.volume_terms),
        ):
            value = _longest_term_match(normalized, terms)
            if value is not None:
                analysis.conditions.append(MetadataCondition(field_name, "match", value))

        upper_price = re.search(
            rf"(?:duoi|khong qua|toi da|nho hon|under|below|less than|<=)\s*{_NUMBER_RE}",
            normalized,
        )
        lower_price = re.search(
            rf"(?:tren|tu|toi thieu|lon hon|>=)\s*{_NUMBER_RE}",
            normalized,
        )
        rating_floor = re.search(
            r"(?:rating|danh gia)[^\d]{0,24}(?:tu|tren|cao hon|>=)?\s*(\d+(?:[.,]\d+)?)",
            normalized,
        )
        price_field = "original_price" if "gia goc" in normalized else "sale_price"
        if upper_price:
            analysis.conditions.append(
                MetadataCondition(price_field, "lte", _parse_amount(upper_price.group(1), upper_price.group(2)))
            )
        skip_lower_price = lower_price and rating_floor and "gia" not in normalized
        if lower_price and not skip_lower_price:
            analysis.conditions.append(
                MetadataCondition(price_field, "gte", _parse_amount(lower_price.group(1), lower_price.group(2)))
            )

        if rating_floor:
            analysis.conditions.append(
                MetadataCondition("rating", "gte", float(rating_floor.group(1).replace(",", ".")))
            )

        review_floor = re.search(rf"(?:review|danh gia)\s*(?:tu|>=)\s*{_NUMBER_RE}", normalized)
        if review_floor:
            analysis.conditions.append(
                MetadataCondition(
                    "review_count",
                    "gte",
                    _parse_amount(review_floor.group(1), review_floor.group(2)),
                )
            )

        if any(term in normalized for term in ("gia re", "re nhat", "tiet kiem")):
            analysis.sort_preferences.append("cheap")
        if any(term in normalized for term in ("rating cao", "danh gia cao", "tot nhat")):
            analysis.sort_preferences.append("rating")
        if any(term in normalized for term in ("nhieu review", "nhieu danh gia", "ban chay")):
            analysis.sort_preferences.append("reviews")
        return analysis
