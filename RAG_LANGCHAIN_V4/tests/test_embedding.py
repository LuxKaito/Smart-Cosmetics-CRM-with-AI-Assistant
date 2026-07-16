from types import SimpleNamespace

from src.rag.embedding import _cap_roberta_max_seq_length


class FakeEmbeddingDelegate:
    def __init__(self, *, model_type: str, max_seq_length: int) -> None:
        config = SimpleNamespace(
            model_type=model_type,
            max_position_embeddings=258,
            pad_token_id=1,
        )
        first_module = SimpleNamespace(auto_model=SimpleNamespace(config=config))
        self._client = SimpleNamespace(
            max_seq_length=max_seq_length,
            _first_module=lambda: first_module,
        )


def test_cap_roberta_max_seq_length_uses_backbone_position_limit() -> None:
    delegate = FakeEmbeddingDelegate(model_type="roberta", max_seq_length=512)

    _cap_roberta_max_seq_length(delegate)

    assert delegate._client.max_seq_length == 256


def test_cap_roberta_max_seq_length_keeps_non_roberta_model_unchanged() -> None:
    delegate = FakeEmbeddingDelegate(model_type="bert", max_seq_length=512)

    _cap_roberta_max_seq_length(delegate)

    assert delegate._client.max_seq_length == 512
