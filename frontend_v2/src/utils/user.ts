import type { User } from "../types/auth";
import { useAuthStore } from "../stores/authStore";
import { getStoredUser } from "./authStorage";

export function getCurrentUser(): User | null {
    return useAuthStore.getState().user || getStoredUser();
}
