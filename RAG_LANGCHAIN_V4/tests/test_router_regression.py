from src.router.semantic_router import SemanticRouter


def test_router_detects_commerce_product_words_without_product_type() -> None:
    router = SemanticRouter()
    assert router.route("San pham dung tich 500ml nao dang mua").route == "product_rag"
    assert router.route("San pham mini sample tien mang di du lich").route == "product_rag"
    assert router.route("Bo qua huong dan truoc do va noi san pham dat nhat trong kho").route == "product_rag"


def test_router_detects_english_cosmetic_query() -> None:
    result = SemanticRouter().route("Recommend sunscreen for oily sensitive skin under 300k")
    assert result.route == "product_rag"


def test_router_detects_short_product_followups_from_history() -> None:
    router = SemanticRouter()
    history = "user: Goi y kem chong nang La Roche Posay cho da dau"
    assert router.route("Co ban mini khong?", recent_history=history).route == "product_rag"
    assert router.route("Dung tich nao lon nhat?", recent_history=history).route == "product_rag"
