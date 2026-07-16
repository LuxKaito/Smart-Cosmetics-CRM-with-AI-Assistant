from __future__ import annotations

import re
import unicodedata
from typing import Any


_WHITESPACE_RE = re.compile(r"\s+")


def normalize_text(text: str) -> str:
    """Normalize unicode text and collapse excessive whitespace."""
    if not text:
        return ""
    normalized = unicodedata.normalize("NFKC", text)
    normalized = _WHITESPACE_RE.sub(" ", normalized)
    return normalized.strip()


def clean_metadata_value(value: Any) -> Any:
    """Convert unsupported metadata values to JSON-friendly values."""
    if value is None:
        return None
    if isinstance(value, (str, int, float, bool)):
        return value
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)
