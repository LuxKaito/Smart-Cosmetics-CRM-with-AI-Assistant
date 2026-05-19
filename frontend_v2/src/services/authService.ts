import { apiRequest } from "../lib/apiClient";
import type {
    AuthPayload,
    AuthResult,
    RegisterPayload,
    User,
} from "../types/auth";
import {
    setStoredTokens,
    setStoredUser,
    clearAuthStorage,
} from "../utils/authStorage";
import { useAuthStore } from "../stores/authStore";

export async function registerUser(
    payload: RegisterPayload,
): Promise<AuthResult> {
    const data = await apiRequest<AuthResult>({
        url: "/auth/register",
        method: "POST",
        data: payload,
    });

    return data;
}

export async function resendVerificationEmail(payload: {
    email: string;
}): Promise<{ message?: string }> {
    return apiRequest<{ message?: string }>({
        url: "/auth/resend-verification-email",
        method: "POST",
        data: payload,
    });
}

export async function verifyEmailToken(payload: {
    token: string;
}): Promise<{ verified: boolean }> {
    return apiRequest<{ verified: boolean }>({
        url: "/auth/verify-email",
        method: "GET",
        params: { token: payload.token },
    });
}

export async function loginUser(payload: AuthPayload): Promise<AuthResult> {
    const data = await apiRequest<AuthResult>({
        url: "/auth/login",
        method: "POST",
        data: payload,
    });

    if (data?.tokens) {
        setStoredTokens(data.tokens);
        useAuthStore.getState().setTokens(data.tokens);
    }
    if (data?.user) {
        setStoredUser(data.user);
        useAuthStore.getState().setUser(data.user);
    }

    return data;
}

export async function loginWithGoogle(payload: {
    idToken: string;
}): Promise<AuthResult> {
    const data = await apiRequest<AuthResult>({
        url: "/auth/google",
        method: "POST",
        data: payload,
    });

    if (data?.tokens) {
        setStoredTokens(data.tokens);
        useAuthStore.getState().setTokens(data.tokens);
    }
    if (data?.user) {
        setStoredUser(data.user);
        useAuthStore.getState().setUser(data.user);
    }

    return data;
}

export async function fetchMe(): Promise<{ user: User }> {
    const data = await apiRequest<{ user: User }>({ url: "/auth/me" });
    if (data?.user) {
        setStoredUser(data.user);
        useAuthStore.getState().setUser(data.user);
    }
    return data;
}

export async function logoutUser(): Promise<void> {
    try {
        await apiRequest<void>({ url: "/auth/logout", method: "POST" });
    } finally {
        clearAuthStorage();
        useAuthStore.getState().clear();
    }
}

export async function changePassword(payload: {
    currentPassword: string;
    newPassword: string;
}): Promise<void> {
    await apiRequest<void>({
        url: "/auth/change-password",
        method: "POST",
        data: payload,
    });
}
