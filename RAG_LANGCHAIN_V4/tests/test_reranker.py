from langchain_core.documents import Document

from src.rag.reranker import RerankerService


def test_reranker_top_k_when_disabled() -> None:
    reranker = RerankerService(use_rerank=False)
    docs = [
        Document(page_content="serum dưỡng ẩm", metadata={"score_retrieval_boosted": 0.9}),
        Document(page_content="kem chống nắng", metadata={"score_retrieval_boosted": 0.7}),
        Document(page_content="toner", metadata={"score_retrieval_boosted": 0.3}),
    ]

    selected = reranker.rerank("serum", docs, top_k=2)

    assert len(selected) == 2
    assert selected[0].metadata["score_rerank"] == 0.9


def test_reranker_falls_back_safely_when_model_is_unavailable(monkeypatch) -> None:
    reranker = RerankerService(use_rerank=True)
    monkeypatch.setattr(reranker, "_load_backend", lambda: None)
    docs = [Document(page_content="serum", metadata={"score_retrieval": 0.81})]

    selected = reranker.rerank("serum", docs, top_k=1)

    assert selected[0].metadata["score_rerank"] == 0.81
