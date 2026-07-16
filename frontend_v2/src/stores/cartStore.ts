import { create } from "zustand";
import type { CartItem } from "../types/cart";
import {
    addCartItem,
    clearCartApi,
    fetchCart,
    removeCartItemApi,
    updateCartItemApi,
} from "../services/cartService";
import { getCartItems } from "../utils/cart";

let refreshRequestId = 0;

interface CartState {
    items: CartItem[];
    hydrated: boolean;
    isHydrating: boolean;
    hydrate: () => void;
    refresh: () => Promise<void>;
    syncFromCache: () => void;
    setItems: (items: CartItem[]) => void;
    reset: () => void;
    addItem: (item: CartItem) => Promise<void>;
    updateItem: (productId: string, quantity: number) => Promise<void>;
    removeItem: (productId: string) => Promise<void>;
    clear: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    hydrated: false,
    isHydrating: false,
    hydrate: () => {
        if (get().hydrated || get().isHydrating) return;
        void get().refresh();
    },
    refresh: async () => {
        if (get().isHydrating) return;
        const requestId = ++refreshRequestId;
        set({ isHydrating: true });
        try {
            const items = await fetchCart();
            if (requestId !== refreshRequestId) return;
            set({ items, hydrated: true, isHydrating: false });
        } catch {
            if (requestId !== refreshRequestId) return;
            set({
                items: getCartItems(),
                hydrated: true,
                isHydrating: false,
            });
        }
    },
    syncFromCache: () => {
        set({ items: getCartItems(), hydrated: true });
    },
    setItems: (items) => {
        set({ items, hydrated: true });
    },
    reset: () => {
        refreshRequestId += 1;
        set({ items: [], hydrated: true, isHydrating: false });
    },
    addItem: async (item) => {
        const items = await addCartItem(item.productId, item.quantity || 1);
        set({ items });
    },
    updateItem: async (productId, quantity) => {
        const items = await updateCartItemApi(productId, quantity);
        set({ items });
    },
    removeItem: async (productId) => {
        const items = await removeCartItemApi(productId);
        set({ items });
    },
    clear: async () => {
        const items = await clearCartApi();
        set({ items });
    },
}));
