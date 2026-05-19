import axios from "axios";
import { AI_CHAT_URL } from "../lib/config";

export interface ChatbotRequest {
    user_id: string;
    session_id: string;
    query: string;
}

export interface ChatbotProduct {
    name: string;
    price?: number;
    image_url?: string;
}

export interface ChatbotResponse {
    answer?: string;
    products?: ChatbotProduct[];
}

export async function sendChatMessage(
    payload: ChatbotRequest,
): Promise<ChatbotResponse> {
    const response = await axios.post<ChatbotResponse>(AI_CHAT_URL, payload, {
        headers: { "Content-Type": "application/json" },
    });
    return response.data;
}
