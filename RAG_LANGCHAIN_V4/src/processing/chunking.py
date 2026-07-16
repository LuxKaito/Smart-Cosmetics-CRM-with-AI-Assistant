from __future__ import annotations

from typing import Iterable

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


class ChunkingService:
    def __init__(
        self,
        chunk_size: int = 450,
        chunk_overlap: int = 70,
    ) -> None:
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self._splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    def chunk_documents(self, documents: Iterable[Document]) -> list[Document]:
        docs = list(documents)
        if not docs:
            return []
        return self._splitter.split_documents(docs)

    def chunk_texts(self, texts: Iterable[str]) -> list[str]:
        output: list[str] = []
        for text in texts:
            output.extend(self._splitter.split_text(text))
        return output
