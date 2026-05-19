import axios from "axios";
import { API_BASE_URL } from "../lib/config";

export interface ComplaintPayload {
    userEmail: string;
    orderId: string;
    message: string;
}

export async function createComplaint(
    payload: ComplaintPayload,
): Promise<unknown> {
    const response = await axios.post(
        `${API_BASE_URL}/api/complaints`,
        payload,
        {
            headers: { "Content-Type": "application/json" },
        },
    );
    return response.data;
}

export async function fetchComplaints(email: string): Promise<unknown> {
    const response = await axios.get(`${API_BASE_URL}/api/complaints`, {
        params: { email },
    });
    return response.data;
}
