from __future__ import annotations

import os

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from src.core.base_llm import BaseLLM


class GeminiLLM(BaseLLM):
    def __init__(
        self,
        model_name: str | None = None,
        api_key: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> None:
        self.model_name = model_name or os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("Missing GOOGLE_API_KEY or GEMINI_API_KEY for Gemini LLM.")

        self.temperature = (
            temperature if temperature is not None else float(os.getenv("LLM_TEMPERATURE", "0.2"))
        )
        self.max_tokens = max_tokens if max_tokens is not None else int(os.getenv("LLM_MAX_TOKENS", "512"))

        self._client = ChatGoogleGenerativeAI(
            model=self.model_name,
            google_api_key=self.api_key,
            temperature=self.temperature,
            max_output_tokens=self.max_tokens,
        )

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        response = self._client.invoke(
            [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt),
            ]
        )
        if isinstance(response.content, str):
            return response.content.strip()
        return str(response.content).strip()
