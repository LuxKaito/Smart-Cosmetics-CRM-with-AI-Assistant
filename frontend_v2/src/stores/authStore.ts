import { create } from "zustand";
import type { User } from "../types/auth";
import {
    clearAuthStorage,
    getStoredUser,
    setStoredUser,
} from "../utils/authStorage";

interface AuthState {
    user: User | null;
    hydrated: boolean;
    hydrate: () => void;
    setUser: (user: User | null) => void;
    clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    hydrated: false,
    hydrate: () => {
        const user = getStoredUser();
        set({ user, hydrated: true });
    },
    setUser: (user) => {
        setStoredUser(user);
        set({ user });
    },
    clear: () => {
        clearAuthStorage();
        set({ user: null });
    },
}));
