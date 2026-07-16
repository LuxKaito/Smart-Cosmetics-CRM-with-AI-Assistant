export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
export const SERVER_API_BASE_URL =
    process.env.API_INTERNAL_URL || API_BASE_URL;
export const API_PREFIX = `${API_BASE_URL}/api/v1`;
export const SERVER_API_PREFIX = `${SERVER_API_BASE_URL}/api/v1`;
export const AI_CHAT_URL =
    process.env.NEXT_PUBLIC_AI_CHAT_URL || "http://localhost:8000/chat";
