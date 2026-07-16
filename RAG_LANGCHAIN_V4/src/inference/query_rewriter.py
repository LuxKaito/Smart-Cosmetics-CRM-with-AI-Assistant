from __future__ import annotations

import re
from typing import Any

from src.core.base_llm import BaseLLM
from src.processing.product_schema import normalize_match_text
from src.prompts.chain import build_rewrite_prompt
from src.prompts.templates import SYSTEM_PROMPT_REWRITE
from src.router.semantic_router import ADDITIONAL_PRODUCT_TYPE_KEYWORDS, PRODUCT_TYPE_KEYWORDS

_AMBIGUOUS_PREFIXES = (
    "cai nay",
    "loai nao",
    "loai cho",
    "co loai",
    "co ban",
    "co ",
    "dung cho",
    "dung tich",
    "mau",
    "rating",
    "san pham",
    "nhe mat",
    "nguoi moi",
    "so voi",
    "gia",
    "duoi",
    "tren",
)
_CONTEXTUAL_FOLLOW_UP_TERMS = {
    "co ban mini",
    "mini",
    "dung tich",
    "lon nhat",
    "mau nao",
    "di hoc",
    "rating",
    "loai cho",
    "nhe mat",
    "nguoi moi",
    "nen chon",
}
_ALLOWED_REWRITE_TOKENS = {"cho", "va", "so", "sanh"}


class QueryRewriteService:
    """Viết lại truy vấn product_rag và dùng heuristic an toàn khi LLM lỗi."""

    def __init__(self, llm: BaseLLM) -> None:
        self.llm = llm

    def rewrite(self, query: str, history: dict[str, Any]) -> str:
        current = query.strip()
        normalized_current = normalize_match_text(current)
        if self._has_explicit_product_type(normalized_current):
            return current
        if self._is_contextual_followup(normalized_current) and self._latest_product_subject(history):
            return self._safe_rewrite(query, history)

        prompt = build_rewrite_prompt(
            query=query,
            history_summary=str(history.get("summary", "")),
            recent_text=str(history.get("recent_text", "")),
        )
        try:
            rewritten = self.llm.generate(system_prompt=SYSTEM_PROMPT_REWRITE, user_prompt=prompt)
        except Exception:
            return self._safe_rewrite(query, history)

        first_line = rewritten.strip().splitlines()[0].strip().strip('"')
        if first_line and self._is_grounded(first_line, query, history):
            return first_line
        return self._safe_rewrite(query, history)

    def _safe_rewrite(self, query: str, history: dict[str, Any]) -> str:
        current = query.strip()
        normalized = normalize_match_text(current)
        if self._has_explicit_product_type(normalized):
            return current

        recent_subject = self._latest_product_subject(history)
        if not recent_subject:
            return current

        if normalized in {"duong am", "cap am"}:
            return f"{recent_subject} {current}".strip()
        if normalized.startswith(_AMBIGUOUS_PREFIXES):
            words = current.split()
            if normalized.startswith("co loai nao "):
                words = words[3:]
            elif normalized.startswith("loai nao "):
                words = words[2:]
            simplified = " ".join(words)
            return f"{recent_subject} {simplified}".strip()
        return current

    @staticmethod
    def _has_explicit_product_type(normalized_query: str) -> bool:
        return any(keyword in normalized_query for keyword in PRODUCT_TYPE_KEYWORDS | ADDITIONAL_PRODUCT_TYPE_KEYWORDS)

    @staticmethod
    def _is_contextual_followup(normalized_query: str) -> bool:
        return normalized_query.startswith(_AMBIGUOUS_PREFIXES) or any(
            term in normalized_query for term in _CONTEXTUAL_FOLLOW_UP_TERMS
        )

    @staticmethod
    def _is_grounded(rewritten: str, query: str, history: dict[str, Any]) -> bool:
        """Reject rewrite tự thêm tiêu chí không tồn tại trong query hoặc lịch sử."""
        source = " ".join(
            (
                query,
                str(history.get("summary", "")),
                str(history.get("recent_text", "")),
            )
        )
        source_tokens = set(re.findall(r"\w+", normalize_match_text(source)))
        rewritten_tokens = set(re.findall(r"\w+", normalize_match_text(rewritten)))
        return rewritten_tokens.issubset(source_tokens | _ALLOWED_REWRITE_TOKENS)

    def _latest_product_subject(self, history: dict[str, Any]) -> str:
        recent_turns = list(history.get("recent_turns", []))
        for turn in reversed(recent_turns):
            if turn.get("role") != "user":
                continue
            content = str(turn.get("content", "")).strip()
            normalized = normalize_match_text(content)
            if self._has_explicit_product_type(normalized):
                return content
        return ""
