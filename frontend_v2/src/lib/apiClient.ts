import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { API_PREFIX } from "./config";
import { ApiError } from "./errors";
import type { ApiResponse } from "../types/api";
import type { AuthTokens } from "../types/auth";
import {
    clearAuthStorage,
    getAccessToken,
    getRefreshToken,
    setStoredTokens,
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

let refreshPromise: Promise<AuthTokens | null> | null = null;

async function refreshAccessToken(): Promise<AuthTokens | null> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    if (!refreshPromise) {
        refreshPromise = refreshClient
            .post<ApiResponse<{ tokens: AuthTokens; user?: unknown }>>(
                "/auth/refresh",
                {
                    refreshToken,
                },
            )
            .then((response) => {
                if (!response.data?.success) {
                    throw new ApiError(
                        response.data?.message || "Token refresh failed",
                        401,
                        response.data,
                    );
                }
                const data = response.data.data;
                if (data?.tokens) {
                    setStoredTokens(data.tokens);
                    useAuthStore.getState().setTokens(data.tokens);
                }
                if (data?.user) {
                    setStoredUser(data.user as never);
                    useAuthStore.getState().setUser(data.user as never);
                }
                return data?.tokens || null;
            })
            .catch(() => {
                clearAuthStorage();
                useAuthStore.getState().clear();
                return null;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
        } as any;
    }
    return config;
});

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
            if (refreshed?.accessToken) {
                original.headers = {
                    ...original.headers,
                    Authorization: `Bearer ${refreshed.accessToken}`,
                } as any;
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
