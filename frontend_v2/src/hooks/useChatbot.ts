import { useEffect, useMemo, useRef, useState } from "react";
import { sendChatMessage } from "../services/chatbotService";
import { getCurrentUser } from "../utils/user";
import type { ChatbotProduct } from "../services/chatbotService";

const SESSION_KEY = "chatbotSession";

function getSessionId(): string {
    if (typeof window === "undefined") return "guest-session";
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const next = `session-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    window.localStorage.setItem(SESSION_KEY, next);
    return next;
}

interface ChatMessage {
    id: string;
    role: "user" | "bot";
    text: string;
    products?: ChatbotProduct[];
}

export function useChatbot() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: "intro",
            role: "bot",
            text: "Xin chao! Toi co the goi y san pham phu hop cho ban.",
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const endRef = useRef<HTMLDivElement | null>(null);

    const userId = useMemo(() => {
        const user = getCurrentUser();
        return user?._id || user?.email || "guest";
    }, []);

    const sessionId = useMemo(() => getSessionId(), []);

    useEffect(() => {
        if (endRef.current) {
            endRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isLoading]);

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;
        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: "user",
            text,
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);
        setError("");

        try {
            const response = await sendChatMessage({
                user_id: userId,
                session_id: sessionId,
                query: text,
            });

            const botMessage: ChatMessage = {
                id: `bot-${Date.now()}`,
                role: "bot",
                text: response.answer || "Toi chua tim duoc thong tin phu hop.",
                products: response.products || [],
            };
            setMessages((prev) => [...prev, botMessage]);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Chatbot dang gap loi.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        endRef,
    };
}
