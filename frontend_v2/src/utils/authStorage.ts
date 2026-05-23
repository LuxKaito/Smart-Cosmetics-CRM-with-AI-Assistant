import type { AuthTokens, User } from "../types/auth";

let tokenCache: AuthTokens | null = null;
let userCache: User | null = null;
const USER_KEY = "user";
const LEGACY_TOKEN_KEY = "authTokens";

const emitAuthChange = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event("auth-change"));
};

export function getStoredTokens(): AuthTokens | null {
    if (typeof window !== "undefined") {
        window.localStorage.removeItem(LEGACY_TOKEN_KEY);
    }
    return tokenCache;
}

export function setStoredTokens(tokens: AuthTokens | null): void {
    tokenCache = tokens || null;
    emitAuthChange();
}

export function getStoredUser(): User | null {
    if (userCache) return userCache;
    if (typeof window === "undefined") return null;
    try {
        userCache = JSON.parse(
            window.localStorage.getItem(USER_KEY) || "null",
        ) as User | null;
    } catch {
        userCache = null;
    }
    return userCache;
}

export function setStoredUser(user: User | null): void {
    userCache = user || null;
    if (typeof window !== "undefined") {
        window.localStorage.removeItem(LEGACY_TOKEN_KEY);
        if (!userCache) {
            window.localStorage.removeItem(USER_KEY);
        } else {
            window.localStorage.setItem(USER_KEY, JSON.stringify(userCache));
        }
    }
    emitAuthChange();
}

export function clearAuthStorage(): void {
    tokenCache = null;
    userCache = null;
    if (typeof window !== "undefined") {
        window.localStorage.removeItem(LEGACY_TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
    }
    emitAuthChange();
}

export function getAccessToken(): string | undefined {
    return getStoredTokens()?.accessToken;
}

export function getRefreshToken(): string | undefined {
    return getStoredTokens()?.refreshToken;
}
