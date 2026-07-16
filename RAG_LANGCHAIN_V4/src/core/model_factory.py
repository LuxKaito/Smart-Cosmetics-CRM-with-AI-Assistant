from __future__ import annotations

import os

from src.core.base_llm import BaseLLM
from src.core.local_llm import OllamaLLM
from src.core.online_llm import GeminiLLM


def build_llm() -> BaseLLM:
    provider = os.getenv("LLM_PROVIDER", "ollama").strip().lower()
    if provider in {"ollama", "local"}:
        return OllamaLLM()
    if provider in {"gemini", "google", "online"}:
        return GeminiLLM()
    raise ValueError(f"Unsupported LLM provider: {provider}")
