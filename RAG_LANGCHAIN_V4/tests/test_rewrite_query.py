from src.inference.query_rewriter import QueryRewriteService


class _FailingLLM:
    def generate(self, system_prompt: str, user_prompt: str) -> str:
        raise RuntimeError("offline")


class _HallucinatingLLM:
    def generate(self, system_prompt: str, user_prompt: str) -> str:
        return "serum dưỡng ẩm CeraVe dưới 300k"


class _MixingOldContextLLM:
    def __init__(self) -> None:
        self.call_count = 0

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        self.call_count += 1
        return "sữa rửa mặt dưỡng ẩm cho da nhạy cảm"


def _history(query: str) -> dict:
    return {
        "summary": "",
        "recent_text": f"user: {query}\nassistant: tư vấn {query}",
        "recent_turns": [
            {"role": "user", "content": query},
            {"role": "assistant", "content": f"tư vấn {query}"},
        ],
    }


def test_rewrite_followup_keeps_latest_product_context_when_llm_fails() -> None:
    service = QueryRewriteService(_FailingLLM())
    assert service.rewrite("dưỡng ẩm", _history("serum")) == "serum dưỡng ẩm"


def test_rewrite_new_product_type_does_not_mix_old_context_when_llm_fails() -> None:
    service = QueryRewriteService(_FailingLLM())
    assert service.rewrite("sữa rửa mặt", _history("serum")) == "sữa rửa mặt"


def test_rewrite_new_product_type_bypasses_llm_to_avoid_old_context() -> None:
    llm = _MixingOldContextLLM()
    service = QueryRewriteService(llm)

    assert service.rewrite("sữa rửa mặt", _history("serum dưỡng ẩm cho da nhạy cảm")) == "sữa rửa mặt"
    assert llm.call_count == 0


def test_rewrite_price_followup_uses_latest_product_context_when_llm_fails() -> None:
    service = QueryRewriteService(_FailingLLM())
    assert service.rewrite("loại nào dưới 300k", _history("kem chống nắng")) == "kem chống nắng dưới 300k"


def test_rewrite_rejects_llm_hallucinated_filters() -> None:
    service = QueryRewriteService(_HallucinatingLLM())
    assert service.rewrite("dưỡng ẩm", _history("serum")) == "serum dưỡng ẩm"
