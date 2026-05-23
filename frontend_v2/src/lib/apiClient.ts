import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { API_PREFIX } from "./config";
import { ApiError } from "./errors";
import type { ApiResponse } from "../types/api";
import {
    clearAuthStorage,
    setStoredUser,
} from "../utils/authStorage";
import { useAuthStore } from "../stores/authStore";

const apiClient: AxiosInstance = axios.create({
    baseURL: API_PREFIX,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

const refreshClient: AxiosInstance = axios.create({
    baseURL: API_PREFIX,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
    if (!refreshPromise) {
        refreshPromise = refreshClient
            .post<ApiResponse<{ user?: unknown }>>("/auth/refresh", {})
            .then((response) => {
                if (!response.data?.success) {
                    throw new ApiError(
                        response.data?.message || "Token refresh failed",
                        401,
                        response.data,
                    );
                }
                const data = response.data.data;
                if (data?.user) {
                    setStoredUser(data.user as never);
                    useAuthStore.getState().setUser(data.user as never);
                }
                return true;
            })
            .catch(() => {
                clearAuthStorage();
                useAuthStore.getState().clear();
                return false;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
}

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiResponse<unknown>>) => {
        const status = error.response?.status;
        const original = error.config as
            | (AxiosRequestConfig & { _retry?: boolean })
            | undefined;

        if (status === 401 && original && !original._retry) {
            original._retry = true;
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                return apiClient(original);
            }
        }

        const message =
            error.response?.data?.message || error.message || "Request failed";
        return Promise.reject(
            new ApiError(message, status, error.response?.data),
        );
    },
);

function normalizeResponse<T>(response: ApiResponse<T>): T {
    if (!response.success) {
        throw new ApiError(response.message || "Request failed", 400, response);
    }
    return response.data;
}

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.request<ApiResponse<T>>(config);
    return normalizeResponse(response.data);
}
