import { apiRequest } from "../lib/apiClient";
import { useAuthStore } from "../stores/authStore";
import type { Product } from "../types/product";

interface FavoriteResult {
    savedProductIds: string[];
}

interface FavoriteListResult extends FavoriteResult {
    items: Product[];
}

function syncSavedProductIds(savedProductIds: string[]) {
    const { user, setUser } = useAuthStore.getState();
    if (!user) return;
    setUser({ ...user, savedProductIds });
}

export async function fetchFavoriteProducts(): Promise<FavoriteListResult> {
    const data = await apiRequest<FavoriteListResult>({ url: "/auth/favorites" });
    syncSavedProductIds(data.savedProductIds || []);
    return data;
}

export async function saveFavoriteProduct(productId: string): Promise<string[]> {
    const data = await apiRequest<FavoriteResult>({
        url: `/auth/favorites/${productId}`,
        method: "POST",
    });
    syncSavedProductIds(data.savedProductIds || []);
    return data.savedProductIds || [];
}

export async function removeFavoriteProduct(productId: string): Promise<string[]> {
    const data = await apiRequest<FavoriteResult>({
        url: `/auth/favorites/${productId}`,
        method: "DELETE",
    });
    syncSavedProductIds(data.savedProductIds || []);
    return data.savedProductIds || [];
}
