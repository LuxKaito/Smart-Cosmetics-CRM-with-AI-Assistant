from src.processing.product_schema import build_filter_payload, build_searchable_text


def test_searchable_text_only_contains_retrieval_fields() -> None:
    text = build_searchable_text(
        {
            "product_name_vn": "Serum A",
            "description": "Dưỡng ẩm",
            "benefits": "Làm Sạch Da",
            "product_type": "Sữa Rửa Mặt",
            "qa_count": 99,
            "category_level_1": "Sức Khỏe - Làm Đẹp",
            "category_level_2": "Chăm Sóc Da Mặt",
            "image_url": "https://example.com/image.png",
        }
    )

    assert "Tên sản phẩm tiếng Việt: Serum A" in text
    assert "Mô tả: Dưỡng ẩm" in text
    assert "Công dụng: Làm Sạch Da" in text
    assert "Loại sản phẩm: Sữa Rửa Mặt" in text
    assert "qa_count" not in text
    assert "category_level_1" not in text
    assert "category_level_2" not in text
    assert "image_url" not in text


def test_searchable_text_uses_vietnamese_labels_for_product_metadata() -> None:
    text = build_searchable_text(
        {
            "volume": "473ml",
            "skin_type": "Da dầu",
            "ingredients": "Ceramide",
            "usage_instructions": "Dùng mỗi tối",
        }
    )

    assert "Dung tích: 473ml" in text
    assert "Loại da: Da dầu" in text
    assert "Thành phần: Ceramide" in text
    assert "Hướng dẫn sử dụng: Dùng mỗi tối" in text


def test_filter_payload_expands_skin_type_for_exact_qdrant_match() -> None:
    payload = build_filter_payload({"skin_type": "Da dầu/Hỗn hợp dầu"})
    assert payload["skin_type_filter"] == ["da dau", "da dau/hon hop dau", "hon hop dau"]
