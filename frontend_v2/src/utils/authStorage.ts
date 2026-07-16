import type { User } from "../types/auth";

let userCache: User | null = null;

const emitAuthChange = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event("auth-change"));
};

export function getStoredUser(): User | null {
    return userCache;
}

export function setStoredUser(user: User | null): void {
    userCache = user || null;
    emitAuthChange();
}

export function clearAuthStorage(): void {
    userCache = null;
    emitAuthChange();
}
