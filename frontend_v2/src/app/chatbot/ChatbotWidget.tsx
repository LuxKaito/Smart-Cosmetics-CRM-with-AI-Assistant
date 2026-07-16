"use client";

import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
    Bot,
    Droplet,
    HeartHandshake,
    Minus,
    Plus,
    Send,
    ShieldCheck,
    Smile,
    Sparkles,
    X,
} from "lucide-react";
import { useChatbot } from "../../hooks/useChatbot";
import { useCartStore } from "../../stores/cartStore";
import type { ChatbotProduct } from "../../services/chatbotService";

type ChatbotVariant = "floating" | "page";

interface ChatbotWidgetProps {
    variant?: ChatbotVariant;
}

const quickSuggestions = [
    {
        label: "Tư vấn sản phẩm phù hợp",
        icon: Sparkles,
    },
    {
        label: "Da dầu mụn nên dùng gì?",
        icon: Droplet,
    },
    {
        label: "Sản phẩm cho da dầu",
        icon: Droplet,
    },
    {
        label: "Tư vấn serum dưỡng ẩm có đánh giá cao nhất",
        icon: HeartHandshake,
    },
];

const formatPrice = (value?: number | null) => {
    if (!value) return "Liên hệ";
    return `${value.toLocaleString("vi-VN")}đ`;
};

const formatTime = (value?: string) => {
    if (!value) return "";
    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
};

function AssistantAvatar({ small = false }: { small?: boolean }) {
    return (
        <div
            className={`grid shrink-0 place-items-center rounded-full bg-white shadow-[0_10px_24px_rgba(249,153,183,0.25)] ring-1 ring-white/70 ${
                small ? "h-8 w-8" : "h-12 w-12"
            }`}>
            <div
                className={`grid place-items-center rounded-full bg-gradient-to-br from-[#FFF7FA] to-[#FFD4E1] text-[#F999B7] ${
                    small ? "h-7 w-7" : "h-10 w-10"
                }`}>
                <Bot className={small ? "h-4 w-4" : "h-5 w-5"} />
            </div>
        </div>
    );
}

function ProductImage({
    product,
    index,
}: {
    product: ChatbotProduct;
    index: number;
}) {
    if (product.image_url) {
        return (
            <div
                className="h-[128px] w-full rounded-[18px] bg-[#FFF7FA] bg-contain bg-center bg-no-repeat transition duration-200 group-hover:scale-[1.02]"
                style={{ backgroundImage: `url(${product.image_url})` }}
                role="img"
                aria-label={product.name}
            />
        );
    }

    return (
        <div className="grid h-[128px] w-full place-items-center rounded-[18px] bg-gradient-to-br from-[#FFF7FA] via-white to-[#FFD4E1] transition duration-200 group-hover:scale-[1.02]">
            {index % 2 === 0 ? (
                <Sparkles className="h-9 w-9 text-[#F999B7]" />
            ) : (
                <Droplet className="h-9 w-9 text-[#F999B7]" />
            )}
        </div>
    );
}

function ProductTitleLink({
    product,
    children,
    className,
}: {
    product: ChatbotProduct;
    children: ReactNode;
    className?: string;
}) {
    if (!product.product_url) {
        return <div className={className}>{children}</div>;
    }

    return (
        <a
            href={product.product_url}
            className={className}
            aria-label={`Xem chi tiết ${product.name}`}>
            {children}
        </a>
    );
}

function ProductRail({
    products,
    onProductAction,
}: {
    products: ChatbotProduct[];
    onProductAction: (product: ChatbotProduct) => void;
}) {
    const visibleProducts = products.slice(0, 4);
    if (!visibleProducts.length) return null;

    return (
        <div className="mt-3 w-full">
            <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-3 [scrollbar-width:thin]">
                {visibleProducts.map((product, index) => (
                    <article
                        key={`${product.name}-${index}`}
                        className="flex h-[376px] min-w-[174px] max-w-[174px] snap-start flex-col rounded-[20px] border border-[#FFD4E1] bg-white p-2.5 shadow-[0_12px_28px_rgba(249,153,183,0.12)] sm:min-w-[188px] sm:max-w-[188px]">
                        <div className="relative overflow-hidden rounded-[18px]">
                            <ProductTitleLink
                                product={product}
                                className="group block outline-none focus-visible:ring-2 focus-visible:ring-[#F999B7]">
                                <ProductImage product={product} index={index} />
                            </ProductTitleLink>
                            {(product.badge || index === 0) && (
                                <span className="absolute left-2 top-2 rounded-full bg-[#F999B7] px-2.5 py-1 text-[9px] font-bold text-white shadow-sm">
                                    {product.badge || "BEST SELLER"}
                                </span>
                            )}
                        </div>
                        <div className="mt-3 flex min-h-0 flex-1 flex-col">
                            <ProductTitleLink
                                product={product}
                                className="line-clamp-3 min-h-[54px] text-[13px] font-semibold leading-[18px] text-[#2B1B24] transition hover:text-[#F999B7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD4E1]">
                                {product.name}
                            </ProductTitleLink>
                            {product.summary ? (
                                <p className="mt-2 line-clamp-4 min-h-[64px] text-[11px] leading-4 text-[#7A6A70]">
                                    {product.summary}
                                </p>
                            ) : (
                                <p className="mt-2 line-clamp-4 min-h-[64px] text-[11px] leading-4 text-[#7A6A70]">
                                    LuxBerry sẽ tư vấn thêm nếu bạn cần lọc theo loại da.
                                </p>
                            )}
                            <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                                <strong className="text-[13px] text-[#2B1B24]">
                                    {formatPrice(product.price)}
                                </strong>
                                <button
                                    type="button"
                                    onClick={() => onProductAction(product)}
                                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F999B7] text-white shadow-[0_10px_18px_rgba(249,153,183,0.35)] transition hover:scale-105 hover:bg-[#f27fa4] focus:outline-none focus:ring-2 focus:ring-[#FFD4E1]"
                                    aria-label={`Thêm ${product.name}`}>
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}

export default function ChatbotWidget({
    variant = "floating",
}: ChatbotWidgetProps) {
    const pathname = usePathname();
    const isFloating = variant === "floating";
    const [isOpen, setIsOpen] = useState(!isFloating);
    const [input, setInput] = useState("");
    const [notice, setNotice] = useState("");
    const addCartItem = useCartStore((state) => state.addItem);
    const { messages, isLoading, error, sendMessage, endRef } = useChatbot();

    const handleSend = useCallback(async () => {
        const text = input.trim();
        if (!text || isLoading) return;
        setInput("");
        setNotice("");
        await sendMessage(text);
    }, [input, isLoading, sendMessage]);

    const handleSuggestion = useCallback(
        async (text: string) => {
            if (isLoading) return;
            setInput("");
            setNotice("");
            await sendMessage(text);
        },
        [isLoading, sendMessage],
    );

    const handleProductAction = useCallback(
        async (product: ChatbotProduct) => {
            setNotice("");
            if (product.product_id) {
                try {
                    await addCartItem({
                        productId: product.product_id,
                        name: product.name,
                        price: product.price || 0,
                        originalPrice: product.original_price,
                        image: product.image_url || "",
                        quantity: 1,
                    });
                    setNotice(`Đã thêm ${product.name} vào giỏ hàng.`);
                    return;
                } catch {
                    setNotice("Chưa thêm được vào giỏ, mình sẽ tư vấn thêm trong chat.");
                }
            }

            await sendMessage(`Tư vấn thêm cho tôi về ${product.name}`);
        },
        [addCartItem, sendMessage],
    );

    if (pathname?.startsWith("/admin")) return null;
    if (isFloating && pathname?.startsWith("/chatbot")) return null;

    const panel = (
        <section
            className={`flex h-[580px] max-h-[calc(100svh_-_48px)] w-[430px] max-w-[92vw] flex-col overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-[0_28px_80px_rgba(43,27,36,0.18)] ring-1 ring-[#FFD4E1]/70 ${
                isFloating
                    ? "animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-300"
                    : ""
            }`}
            role="dialog"
            aria-label="LuxBerry Assistant">
            <header className="flex shrink-0 items-center justify-between gap-3 rounded-t-[24px] bg-gradient-to-r from-[#F999B7] to-[#FFD4E1] px-4 py-4 text-white">
                <div className="flex min-w-0 items-center gap-3">
                    <AssistantAvatar />
                    <div className="min-w-0">
                        <h3 className="truncate text-base font-bold leading-tight">
                            LuxBerry Assistant
                        </h3>
                        <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-white/95">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.2)]" />
                            Đang hoạt động
                        </div>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="grid h-9 w-9 place-items-center rounded-full text-white/90 transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/60"
                        aria-label="Thu nhỏ chatbot">
                        <Minus className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="grid h-9 w-9 place-items-center rounded-full text-white/90 transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/60"
                        aria-label="Đóng chatbot">
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto bg-[#FFF7FA] px-4 py-4">
                <div className="space-y-4">
                    {messages.map((message) => {
                        const isUser = message.role === "user";

                        if (isUser) {
                            return (
                                <div key={message.id} className="flex justify-end">
                                    <div className="flex max-w-[78%] flex-col items-end">
                                        <div className="rounded-[22px] rounded-br-md bg-[#FFD4E1] px-4 py-3 text-sm leading-relaxed text-[#2B1B24] shadow-sm">
                                            <p className="whitespace-pre-line">
                                                {message.text}
                                            </p>
                                        </div>
                                        <span className="mt-1 px-1 text-[11px] text-[#7A6A70]">
                                            {formatTime(message.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={message.id} className="space-y-2">
                                <div className="flex items-start gap-2">
                                    <AssistantAvatar small />
                                    <div className="min-w-0 flex-1">
                                        <div className="max-w-[82%] rounded-[22px] rounded-bl-md bg-white px-4 py-3 text-sm leading-relaxed text-[#2B1B24] shadow-sm ring-1 ring-[#FFD4E1]/55">
                                            <p className="whitespace-pre-line">
                                                {message.text}
                                            </p>
                                        </div>
                                        <span className="mt-1 block px-1 text-[11px] text-[#7A6A70]">
                                            {formatTime(message.createdAt)}
                                        </span>
                                    </div>
                                </div>
                                {message.products?.length ? (
                                    <ProductRail
                                        products={message.products}
                                        onProductAction={handleProductAction}
                                    />
                                ) : null}
                            </div>
                        );
                    })}

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {quickSuggestions.map((suggestion) => {
                            const Icon = suggestion.icon;
                            return (
                                <button
                                    key={suggestion.label}
                                    type="button"
                                    onClick={() =>
                                        void handleSuggestion(suggestion.label)
                                    }
                                    disabled={isLoading}
                                    className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#FFD4E1] bg-white px-3 py-2 text-left text-xs font-medium leading-snug text-[#2B1B24] transition hover:bg-[#fff0f5] hover:text-[#F999B7] focus:outline-none focus:ring-2 focus:ring-[#FFD4E1] disabled:cursor-not-allowed disabled:opacity-60">
                                    <Icon className="h-4 w-4 shrink-0 text-[#F999B7]" />
                                    <span>{suggestion.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <AssistantAvatar small />
                            <div className="flex items-center gap-1 rounded-full bg-white px-4 py-3 ring-1 ring-[#FFD4E1]/55">
                                <span className="h-2 w-2 animate-bounce rounded-full bg-[#F999B7]" />
                                <span className="h-2 w-2 animate-bounce rounded-full bg-[#F999B7] [animation-delay:120ms]" />
                                <span className="h-2 w-2 animate-bounce rounded-full bg-[#F999B7] [animation-delay:240ms]" />
                            </div>
                        </div>
                    ) : null}
                    {error ? (
                        <div className="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                            {error}
                        </div>
                    ) : null}
                    {notice ? (
                        <div className="rounded-2xl border border-[#FFD4E1] bg-white px-3 py-2 text-xs text-[#7A6A70]">
                            {notice}
                        </div>
                    ) : null}
                    <div ref={endRef} />
                </div>
            </div>

            <footer className="sticky bottom-0 shrink-0 border-t border-[#FFD4E1]/70 bg-white px-4 py-3">
                <div className="flex items-center gap-2 rounded-full border border-[#FFD4E1] bg-[#FFF7FA] px-3 py-2 shadow-inner">
                    <Smile className="h-5 w-5 shrink-0 text-[#7A6A70]" />
                    <input
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        placeholder="Nhập tin nhắn của bạn..."
                        className="min-w-0 flex-1 bg-transparent text-sm text-[#2B1B24] outline-none placeholder:text-[#7A6A70]"
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                void handleSend();
                            }
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => void handleSend()}
                        disabled={isLoading || !input.trim()}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F999B7] text-white shadow-[0_12px_22px_rgba(249,153,183,0.35)] transition hover:scale-105 hover:bg-[#f27fa4] focus:outline-none focus:ring-2 focus:ring-[#FFD4E1] disabled:cursor-not-allowed disabled:opacity-55"
                        aria-label="Gửi tin nhắn">
                        <Send className="h-4 w-4" />
                    </button>
                </div>
                <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-[#7A6A70]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#F999B7]" />
                    <span>Trả lời nhanh chóng • Bảo mật thông tin</span>
                </div>
            </footer>
        </section>
    );

    if (!isFloating) {
        return <div className="mx-auto my-8 w-fit max-w-full">{panel}</div>;
    }

    return (
        <div className="pointer-events-none fixed bottom-6 right-6 z-50">
            <div className="pointer-events-auto">
                {isOpen ? (
                    panel
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsOpen(true)}
                        className="group relative grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[#F999B7] to-[#ff7fa6] text-white shadow-[0_20px_45px_rgba(249,153,183,0.38)] transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#FFD4E1]"
                        aria-label="Mở LuxBerry Assistant">
                        <span className="absolute inset-[-8px] rounded-full border border-[#FFD4E1] opacity-80 transition group-hover:scale-110" />
                        <Bot className="h-7 w-7" />
                    </button>
                )}
            </div>
        </div>
    );
}
