from src.core.local_llm import OllamaLLM


def test_ollama_client_keeps_model_loaded_without_env_timeout(monkeypatch) -> None:
    created_kwargs = {}

    class FakeChatOllama:
        def __init__(self, **kwargs) -> None:
            created_kwargs.update(kwargs)

    monkeypatch.setattr("src.core.local_llm.ChatOllama", FakeChatOllama)
    OllamaLLM(model_name="qwen2.5:3b", base_url="http://ollama:11434")

    assert "client_kwargs" not in created_kwargs
    assert created_kwargs["keep_alive"] == -1
