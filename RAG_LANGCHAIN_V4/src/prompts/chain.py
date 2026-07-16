from __future__ import annotations

def build_user_prompt(
    query: str,
    history_summary: str,
    recent_text: str = "",
) -> str:
    parts = [
        "Lịch sử hội thoại tóm tắt:",
        history_summary or "(không có)",
        "",
        "Các tin nhắn gần đây:",
        recent_text or "(không có)",
        "",
        "Câu hỏi người dùng:",
        query,
        "",
    ]
    return "\n".join(parts)


def build_product_opening_prompt(query: str, rewrite_question: str, product_type: str) -> str:
    return "\n".join(
        (
            "Câu hỏi hiện tại của người dùng:",
            query,
            "",
            "Truy vấn tìm kiếm đã viết lại:",
            rewrite_question,
            "",
            "Loại sản phẩm cần tư vấn:",
            product_type,
            "",
            "Chỉ viết một câu mở đầu:",
        )
    )


def build_rewrite_prompt(query: str, history_summary: str, recent_text: str) -> str:
    parts = [
        "Tóm tắt lịch sử chat:",
        history_summary or "(không có)",
        "",
        "Các tin nhắn gần đây:",
        recent_text or "(không có)",
        "",
        "Câu hỏi hiện tại:",
        query,
        "",
        "Rewritten query:",
    ]
    return "\n".join(parts)
