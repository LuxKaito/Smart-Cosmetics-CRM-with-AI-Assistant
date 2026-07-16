from langchain_core.documents import Document

from src.processing.chunking import ChunkingService


def test_chunking_splits_long_document() -> None:
    service = ChunkingService(chunk_size=80, chunk_overlap=20)
    text = "A" * 220
    docs = [Document(page_content=text, metadata={"source_id": "x"})]

    chunks = service.chunk_documents(docs)

    assert len(chunks) >= 3
    assert all(chunk.page_content for chunk in chunks)
