import axios from "axios";
import { API_BASE_URL } from "../lib/config";

export async function fetchBlogs(limit = 20): Promise<unknown[]> {
    const response = await axios.get(`${API_BASE_URL}/api/blogs`, {
        params: { limit },
    });
    return response.data;
}
