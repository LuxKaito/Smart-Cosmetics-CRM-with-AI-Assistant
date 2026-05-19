import axios from "axios";
import { API_BASE_URL } from "../lib/config";

interface ReviewPayload {
    productId: string;
    userEmail: string;
    rating: number;
    comment: string;
}

export async function addReview(payload: ReviewPayload): Promise<unknown> {
    const response = await axios.post(`${API_BASE_URL}/api/reviews`, payload, {
        headers: { "Content-Type": "application/json" },
    });
    return response.data;
}

export async function fetchReviews(productId: string): Promise<unknown[]> {
    const response = await axios.get(`${API_BASE_URL}/api/reviews`, {
        params: { productId },
    });
    return response.data;
}
