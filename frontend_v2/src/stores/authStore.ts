import { create } from "zustand";
import type { AuthTokens, User } from "../types/auth";
import {
    clearAuthStorage,
    getStoredTokens,
    getStoredUser,
    setStoredTokens,
    setStoredUser,
} from "../utils/authStorage";

interface AuthState {
    user: User | null;
    tokens: AuthTokens | null;
    hydrated: boolean;
    hydrate: () => void;
    setUser: (user: User | null) => void;
    setTokens: (tokens: AuthTokens | null) => void;
    clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    tokens: null,
    hydrated: false,
    hydrate: () => {
        const user = getStoredUser();
        const tokens = getStoredTokens();
        set({ user, tokens, hydrated: true });
    },
    setUser: (user) => {
        setStoredUser(user);
        set({ user });
    },
    setTokens: (tokens) => {
        setStoredTokens(tokens);
        set({ tokens });
    },
    clear: () => {
        clearAuthStorage();
        set({ user: null, tokens: null });
    },
}));
