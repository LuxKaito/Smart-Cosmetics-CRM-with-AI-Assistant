from __future__ import annotations

import os

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_ollama import ChatOllama

from src.core.base_llm import BaseLLM


class OllamaLLM(BaseLLM):
    def __init__(
        self,
        model_name: str | None = None,
        base_url: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> None:
        self.model_name = model_name or os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
        self.base_url = base_url or os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
        self.temperature = (
            temperature if temperature is not None else float(os.getenv("LLM_TEMPERATURE", "0.2"))
        )
        self.max_tokens = max_tokens if max_tokens is not None else int(os.getenv("LLM_MAX_TOKENS", "512"))
        self.num_ctx = int(os.getenv("OLLAMA_NUM_CTX", "2048"))

        self._client = ChatOllama(
            model=self.model_name,
            base_url=self.base_url,
            temperature=self.temperature,
            num_predict=self.max_tokens,
            num_ctx=self.num_ctx,
            keep_alive=-1,
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
