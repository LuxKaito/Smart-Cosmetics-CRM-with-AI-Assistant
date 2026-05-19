import type { CartItem } from "../types/cart";

let cartCache: CartItem[] = [];

const emitChange = () => {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cart-change"));
    }
};

export function getCartItems(): CartItem[] {
    return cartCache;
}

export function setCartItems(items: CartItem[]): void {
    cartCache = Array.isArray(items) ? items : [];
    emitChange();
}

export function addToCart(item: CartItem): CartItem[] {
    const found = cartCache.find((entry) => entry.productId === item.productId);
    if (found) {
        found.quantity += Math.max(1, item.quantity || 1);
    } else {
        cartCache = [...cartCache, { ...item, quantity: Math.max(1, item.quantity || 1) }];
    }
    emitChange();
    return cartCache;
}

export function updateCartItem(productId: string, quantity: number): CartItem[] {
    cartCache = cartCache.map((item) =>
        item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item,
    );
    emitChange();
    return cartCache;
}

export function removeCartItem(productId: string): CartItem[] {
    cartCache = cartCache.filter((item) => item.productId !== productId);
    emitChange();
    return cartCache;
}

export function clearCart(): void {
    cartCache = [];
    emitChange();
}
