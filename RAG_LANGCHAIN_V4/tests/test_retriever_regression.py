from langchain_core.documents import Document

from src.rag.query_analysis import QueryMetadataAnalyzer
from src.rag.retriever import RetrieverService
from src.router.product_terms import ProductTermCatalog


class _FilterEmptyVectorStore:
    def __init__(self) -> None:
        self.calls = []

    def similarity_search_with_score(self, query, k=20, qdrant_filter=None):
        self.calls.append(qdrant_filter)
        if qdrant_filter is not None:
            return []
        return [
            (
                Document(
                    page_content="CeraVe cleanser",
                    metadata={
                        "raw_document": {
                            "product_name_vn": "Sua rua mat CeraVe",
                            "product_type": "Sua rua mat",
                        },
                        "sale_price": 250_000,
                    },
                ),
                0.8,
            )
        ]


def test_retriever_falls_back_to_unfiltered_search_when_payload_filter_is_too_strict() -> None:
    catalog = ProductTermCatalog.from_records(
        [{"brand": "CeraVe", "skin_type": "Da dau", "product_type": "Sua rua mat"}]
    )
    store = _FilterEmptyVectorStore()

    result = RetrieverService(store, top_n_candidates=2).retrieve("CeraVe duoi 300k", catalog=catalog)

    assert len(result) == 1
    assert store.calls[0] is not None
    assert store.calls[-1] is None


def test_query_analyzer_treats_rating_threshold_as_rating_not_price() -> None:
    analysis = QueryMetadataAnalyzer().analyze("Goi y san pham rating cao tren 4.8", ProductTermCatalog())

    assert any(item.field == "rating" and item.operator == "gte" for item in analysis.conditions)
    assert not any(item.field == "sale_price" and item.operator == "gte" for item in analysis.conditions)


def test_retriever_does_not_treat_after_treatment_as_product_type() -> None:
    class Store:
        def similarity_search_with_score(self, query, k=20, qdrant_filter=None):
            return [
                (
                    Document(
                        page_content="ceramide phuc hoi da",
                        metadata={
                            "raw_document": {
                                "product_name_vn": "Kem duong Ceramide",
                                "product_type": "Kem duong",
                            }
                        },
                    ),
                    0.9,
                )
            ]

    result = RetrieverService(Store()).retrieve("Ceramide phuc hoi da sau treatment")

    assert len(result) == 1
    assert result[0].metadata["raw_document"]["product_name_vn"] == "Kem duong Ceramide"
