"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useChatbot } from "../../hooks/useChatbot";

type ChatbotVariant = "floating" | "page";

interface ChatbotWidgetProps {
    variant?: ChatbotVariant;
}

export default function ChatbotWidget({
    variant = "floating",
}: ChatbotWidgetProps) {
    const pathname = usePathname();
    const isFloating = variant === "floating";
    const avoidRightSideCta =
        pathname?.startsWith("/cart") || pathname?.startsWith("/checkout");
    const [isOpen, setIsOpen] = useState(!isFloating);
    const { messages, isLoading, error, sendMessage, endRef } = useChatbot();
    const [input, setInput] = useState("");

    if (pathname?.startsWith("/admin")) return null;
    if (isFloating && pathname?.startsWith("/chatbot")) return null;

    const handleSend = async () => {
        if (!input.trim()) return;
        const next = input;
        setInput("");
        await sendMessage(next);
    };

    return (
        <div
            className={
                isFloating
                    ? `chatbot-float${isOpen ? " is-open" : ""}${
                          avoidRightSideCta ? " is-safe-zone" : ""
                      }`
                    : "chatbot-page"
            }>
            {isFloating ? (
                <button
                    type="button"
                    className="chatbot-trigger"
                    aria-label="Mo chatbot AI"
                    onClick={() => setIsOpen((prev) => !prev)}>
                    <span className="chatbot-icon">AI</span>
                    <span className="chatbot-pulse" aria-hidden="true" />
                </button>
            ) : null}

            <div
                className="chatbot-panel"
                role="dialog"
                aria-label="Chatbot AI">
                <div className="chatbot-header">
                    <div>
                        <strong>TK Beauty AI</strong>
                        <span>Tu van nhanh thong minh</span>
                    </div>
                    {isFloating ? (
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            aria-label="Dong">
                            ✕
                        </button>
                    ) : null}
                </div>

                <div className="chatbot-body">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`chatbot-bubble ${msg.role === "user" ? "is-user" : "is-bot"}`}>
                            <p>{msg.text}</p>
                            {Array.isArray(msg.products) &&
                            msg.products.length > 0 ? (
                                <div className="chatbot-products">
                                    {msg.products
                                        .slice(0, 3)
                                        .map((product, index) => (
                                            <div
                                                key={`${product.name}-${index}`}
                                                className="chatbot-product">
                                                <div
                                                    className="chatbot-product-thumb"
                                                    style={
                                                        product.image_url
                                                            ? {
                                                                  backgroundImage: `url(${product.image_url})`,
                                                              }
                                                            : undefined
                                                    }
                                                />
                                                <div>
                                                    <strong>
                                                        {product.name}
                                                    </strong>
                                                    {product.price ? (
                                                        <span>
                                                            {product.price.toLocaleString(
                                                                "vi-VN",
                                                            )}{" "}
                                                            d
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : null}
                        </div>
                    ))}
                    {isLoading ? (
                        <div className="chatbot-bubble is-bot">
                            Dang suy nghi...
                        </div>
                    ) : null}
                    {error ? (
                        <div className="chatbot-error">{error}</div>
                    ) : null}
                    <div ref={endRef} />
                </div>

                <div className="chatbot-input">
                    <input
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        placeholder="Nhap cau hoi ve san pham..."
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={isLoading}>
                        Gui
                    </button>
                </div>
            </div>
        </div>
    );
}
