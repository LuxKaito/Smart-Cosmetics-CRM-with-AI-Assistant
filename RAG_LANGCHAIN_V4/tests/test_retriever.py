from langchain_core.documents import Document

from src.rag.query_analysis import QueryMetadataAnalyzer
from src.rag.retriever import RetrieverService
from src.router.product_terms import ProductTermCatalog


class _FakeVectorStore:
    def __init__(self, docs_with_scores):
        self.docs_with_scores = docs_with_scores
        self.received_filter = None
        self.received_limits = []

    def similarity_search_with_score(self, query, k=20, qdrant_filter=None):
        self.received_filter = qdrant_filter
        self.received_limits.append(k)
        return self.docs_with_scores[:k]


def _catalog() -> ProductTermCatalog:
    return ProductTermCatalog.from_records(
        [
            {
                "brand": "CeraVe",
                "product_type": "Sữa Rửa Mặt",
                "skin_type": "Da dầu/Hỗn hợp dầu",
            }
        ]
    )


def test_retriever_calls_vector_search_with_payload_filter() -> None:
    store = _FakeVectorStore(
        [
            (
                Document(
                    page_content="sữa rửa mặt CeraVe",
                    metadata={"sale_price": 250_000, "rating": 4.8, "review_count": 120},
                ),
                0.88,
            )
        ]
    )
    service = RetrieverService(vector_store=store, top_n_candidates=2)

    result = service.retrieve("CeraVe dưới 300k", catalog=_catalog())

    assert len(result) == 1
    assert result[0].metadata["score_retrieval"] == 0.88
    assert store.received_filter is not None
    assert len(store.received_filter.must) == 2


def test_retriever_applies_cheap_boost_without_replacing_relevance() -> None:
    store = _FakeVectorStore(
        [
            (Document(page_content="serum A", metadata={"sale_price": 300_000}), 0.9),
            (Document(page_content="serum B", metadata={"sale_price": 100_000}), 0.85),
        ]
    )
    result = RetrieverService(store).retrieve("serum giá rẻ")

    assert result[0].page_content == "serum B"
    assert result[0].metadata["score_business_boost"] == 0.08
    assert result[0].metadata["score_retrieval_boosted"] == 0.93


def test_retriever_filters_explicit_product_type_before_rerank() -> None:
    store = _FakeVectorStore(
        [
            (Document(page_content="kem dưỡng ẩm", metadata={}), 0.95),
            (Document(page_content="serum dưỡng ẩm", metadata={}), 0.9),
        ]
    )

    result = RetrieverService(store).retrieve("serum dưỡng ẩm")

    assert [doc.page_content for doc in result] == ["serum dưỡng ẩm"]


def test_retriever_does_not_accept_product_type_only_mentioned_in_description() -> None:
    store = _FakeVectorStore(
        [
            (
                Document(
                    page_content="kem dưỡng dùng sau serum",
                    metadata={
                        "raw_document": {
                            "product_name_vn": "Kem Dưỡng A",
                            "product_type": "Kem Dưỡng",
                        }
                    },
                ),
                0.95,
            ),
            (
                Document(
                    page_content="serum dưỡng ẩm",
                    metadata={
                        "raw_document": {
                            "product_name_vn": "Serum B",
                            "product_type": "Serum",
                        }
                    },
                ),
                0.9,
            ),
        ]
    )

    result = RetrieverService(store).retrieve("serum dưỡng ẩm")

    assert [doc.page_content for doc in result] == ["serum dưỡng ẩm"]


def test_retriever_retries_with_more_candidates_for_explicit_product_type() -> None:
    moisturizer_docs = [
        (
            Document(
                page_content=f"kem dưỡng {index}",
                metadata={
                    "raw_document": {
                        "product_name_vn": f"Kem Dưỡng {index}",
                        "product_type": "Kem Dưỡng",
                    }
                },
            ),
            0.99 - index / 100,
        )
        for index in range(20)
    ]
    serum_doc = (
        Document(
            page_content="serum dưỡng ẩm",
            metadata={
                "raw_document": {
                    "product_name_vn": "Serum B",
                    "product_type": "Serum",
                }
            },
        ),
        0.7,
    )
    store = _FakeVectorStore([*moisturizer_docs, serum_doc])

    result = RetrieverService(store, top_n_candidates=20).retrieve("serum dưỡng ẩm")

    assert [doc.page_content for doc in result] == ["serum dưỡng ẩm"]
    assert store.received_limits == [20, 100]


def test_query_analyzer_extracts_skin_type_and_rating_sort() -> None:
    analysis = QueryMetadataAnalyzer().analyze("sữa rửa mặt cho da dầu rating cao", _catalog())
    assert any(item.field == "skin_type" and item.value == "da dau" for item in analysis.conditions)
    assert "rating" in analysis.sort_preferences
