import axios from "axios";
import { AI_CHAT_URL } from "../lib/config";

export interface ChatbotRequest {
    user_id: string;
    session_id: string;
    query: string;
}

export interface ChatbotProduct {
    product_id?: string | null;
    name: string;
    summary?: string | null;
    price?: number | null;
    original_price?: number | null;
    promotion?: string | null;
    rating?: number | null;
    image_url?: string | null;
    product_url?: string | null;
    badge?: string | null;
}

export interface ChatbotResponse {
    answer?: string;
    products?: ChatbotProduct[];
    sources?: Record<string, unknown>[];
    debug?: Record<string, unknown> | null;
    route?: string;
    rewrite_question?: string;
    confidence?: number;
}

type RawChatbotProduct = ChatbotProduct & {
    id?: string | null;
    productId?: string | null;
    image?: string | null;
    imageUrl?: string | null;
    productUrl?: string | null;
    originalPrice?: number | null;
};

type RawChatbotResponse =
    | ChatbotResponse
    | {
          data?: ChatbotResponse;
      };

function unwrapResponse(payload: RawChatbotResponse): ChatbotResponse {
    if ("data" in payload && payload.data) {
        return payload.data;
    }
    return payload as ChatbotResponse;
}

function normalizeProduct(product: RawChatbotProduct): ChatbotProduct | null {
    const productId = product.product_id || product.productId || product.id || null;
    const name = String(product.name || "").trim();
    if (!name) return null;

    return {
        product_id: productId,
        name,
        summary: product.summary || null,
        price:
            typeof product.price === "number" && Number.isFinite(product.price)
                ? product.price
                : null,
        original_price:
            typeof product.original_price === "number"
                ? product.original_price
                : typeof product.originalPrice === "number"
                  ? product.originalPrice
                  : null,
        promotion: product.promotion || null,
        rating:
            typeof product.rating === "number" && Number.isFinite(product.rating)
                ? product.rating
                : null,
        image_url: product.image_url || product.imageUrl || product.image || null,
        product_url:
            product.product_url ||
            product.productUrl ||
            (productId ? `/products/${productId}` : null),
        badge: product.badge || null,
    };
}

function normalizeChatbotResponse(payload: RawChatbotResponse): ChatbotResponse {
    const response = unwrapResponse(payload);
    return {
        ...response,
        products: Array.isArray(response.products)
            ? response.products
                  .map((product) =>
                      normalizeProduct(product as RawChatbotProduct),
                  )
                  .filter((product): product is ChatbotProduct => Boolean(product))
            : [],
    };
}

export async function sendChatMessage(
    payload: ChatbotRequest,
): Promise<ChatbotResponse> {
    const response = await axios.post<RawChatbotResponse>(AI_CHAT_URL, payload, {
        headers: { "Content-Type": "application/json" },
    });
    return normalizeChatbotResponse(response.data);
}
