import type { AuthTokens, User } from "../types/auth";

const TOKEN_KEY = "authTokens";
const USER_KEY = "user";

export function getStoredTokens(): AuthTokens | null {
    if (typeof window === "undefined") return null;
    try {
        return JSON.parse(
            window.localStorage.getItem(TOKEN_KEY) || "null",
        ) as AuthTokens | null;
    } catch {
        return null;
    }
}

export function setStoredTokens(tokens: AuthTokens | null): void {
    if (typeof window === "undefined") return;
    if (!tokens) {
        window.localStorage.removeItem(TOKEN_KEY);
    } else {
        window.localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    }
    window.dispatchEvent(new Event("auth-change"));
}

export function getStoredUser(): User | null {
    if (typeof window === "undefined") return null;
    try {
        return JSON.parse(
            window.localStorage.getItem(USER_KEY) || "null",
        ) as User | null;
    } catch {
        return null;
    }
}

export function setStoredUser(user: User | null): void {
    if (typeof window === "undefined") return;
    if (!user) {
        window.localStorage.removeItem(USER_KEY);
    } else {
        window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    window.dispatchEvent(new Event("auth-change"));
}

export function clearAuthStorage(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new Event("auth-change"));
}

export function getAccessToken(): string | undefined {
    return getStoredTokens()?.accessToken;
}

export function getRefreshToken(): string | undefined {
    return getStoredTokens()?.refreshToken;
}
