import { getStoredUser } from "./authStorage";
import type { User } from "../types/auth";

export function getCurrentUser(): User | null {
    return getStoredUser();
}
