from src.router.semantic_router import SemanticRouter


def _router() -> SemanticRouter:
    return SemanticRouter(
        records=[
            {
                "product_name_vn": "Sữa Rửa Mặt CeraVe Sạch Sâu Cho Da Thường Đến Da Dầu 473ml",
                "product_name_en": "Foaming Cleanser",
                "brand": "CeraVe",
                "volume": "473ml",
                "origin": "Mỹ",
                "benefits": "Làm Sạch Da",
                "product_type": "Sữa Rửa Mặt",
                "skin_type": "Da dầu/Hỗn hợp dầu",
            }
        ]
    )


def test_router_only_returns_chitchat_or_product_rag() -> None:
    router = _router()
    assert router.route("xin chào bạn").route == "chitchat"
    assert router.route("ok").route == "chitchat"
    assert router.route("serum dưỡng ẩm").route == "product_rag"


def test_router_does_not_route_beach_chitchat_to_rag() -> None:
    result = _router().route("nay tôi buồn tôi muốn đi biển")
    assert result.route == "chitchat"


def test_router_detects_dynamic_brand_and_product_name() -> None:
    result = _router().route("CeraVe Foaming Cleanser có tốt không")
    assert result.route == "product_rag"


def test_router_detects_static_skin_advice_intent() -> None:
    result = _router().route("da dầu mụn nên dùng gì")
    assert result.route == "product_rag"


def test_router_requires_product_context_for_volume_and_origin() -> None:
    router = _router()
    assert router.route("473ml là bao nhiêu lít").route == "chitchat"
    assert router.route("Mỹ ở đâu").route == "chitchat"
    assert router.route("sữa rửa mặt 473ml").route == "product_rag"
