from fastapi.testclient import TestClient

from src.api.main import app


class _FakeInferenceEngine:
    def chat(self, query: str, user_id: str, session_id: str):
        return {
            "answer": f"goi y cho: {query}",
            "confidence": 0.81,
            "citations": {
                "source_1": {
                    "source_type": "mongodb",
                    "source_id": "abc",
                    "collection": "products",
                    "file_name": None,
                    "page": None,
                    "chunk_index": 0,
                    "score_retrieval": 0.7,
                    "score_rerank": 0.9,
                }
            },
            "route": "product_rag",
        }


class _FakeContainer:
    @property
    def inference_engine(self):
        return _FakeInferenceEngine()

    def health_snapshot(self):
        return {"mongodb": "up", "qdrant": "up"}


class _FailingInferenceEngine:
    def chat(self, query: str, user_id: str, session_id: str):
        raise RuntimeError("qdrant timeout")


class _FailingContainer:
    @property
    def inference_engine(self):
        return _FailingInferenceEngine()


def test_health_endpoint() -> None:
    app.state.container = _FakeContainer()
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"


def test_chat_endpoint() -> None:
    app.state.container = _FakeContainer()
    client = TestClient(app)

    response = client.post(
        "/chat",
        json={
            "user_id": "u1",
            "session_id": "s1",
            "query": "toi can serum duong am",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert "answer" in payload
    assert payload["route"] == "product_rag"
    assert payload["sources"]
    assert payload["debug"] is None


def test_chat_endpoint_returns_structured_service_error() -> None:
    app.state.container = _FailingContainer()
    client = TestClient(app)

    response = client.post(
        "/chat",
        json={
            "user_id": "u1",
            "session_id": "s1",
            "query": "toi can serum duong am",
        },
    )

    assert response.status_code == 503
    assert response.json()["detail"] == {
        "message": "Internal error while processing chat request",
        "error": "qdrant timeout",
    }
