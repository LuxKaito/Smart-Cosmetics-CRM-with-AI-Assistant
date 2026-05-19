import { apiRequest } from "../lib/apiClient";
import { getOriginalPrice, getSalePrice } from "../lib/pricing";
import type { CartItem } from "../types/cart";
import { setCartItems } from "../utils/cart";

type CartApiItem = {
    productId?:
        | string
        | {
              _id?: string;
              name?: string;
              brand?: string;
              price?: number;
              sale_price?: number;
              original_price?: number;
              images?: string[];
              image_url?: string;
              stock?: number;
          };
    quantity?: number;
    priceSnapshot?: number;
    productNameSnapshot?: string;
    imageSnapshot?: string;
};

interface CartResponse {
    cart?: {
        items?: CartApiItem[];
    };
}

const normalizeCart = (response: CartResponse | null): CartItem[] => {
    const items = response?.cart?.items || [];
    const normalized = items.map((item) => {
        const product =
            typeof item.productId === "string" ? null : item.productId || null;
        const productId =
            typeof item.productId === "string"
                ? item.productId
                : product?._id || "";
        const salePrice = getSalePrice(
            {
                sale_price:
                    item.priceSnapshot ?? product?.sale_price ?? product?.price,
                price: product?.price,
            },
            0,
        );
        const originalPrice = getOriginalPrice(
            {
                original_price: product?.original_price,
                price: product?.price,
                sale_price: product?.sale_price ?? item.priceSnapshot,
            },
            salePrice,
        );
        const quantity = Math.max(1, Number(item.quantity || 1));
        const lineTotal = salePrice * quantity;
        const lineOriginalTotal = (originalPrice ?? salePrice) * quantity;
        const lineDiscount = Math.max(0, lineOriginalTotal - lineTotal);
        return {
            productId,
            name: item.productNameSnapshot || product?.name || "",
            image:
                item.imageSnapshot ||
                (Array.isArray(product?.images)
                    ? product?.images?.[0]
                    : undefined) ||
                product?.image_url ||
                "",
            price: salePrice,
            originalPrice,
            quantity,
            brand: product?.brand || "",
            lineTotal,
            lineOriginalTotal,
            lineDiscount,
            stock: Number(product?.stock || 0),
        };
    });

    setCartItems(normalized);
    return normalized;
};

export async function fetchCart(): Promise<CartItem[]> {
    const data = await apiRequest<CartResponse>({ url: "/cart" });
    return normalizeCart(data);
}

export async function addCartItem(
    productId: string,
    quantity = 1,
): Promise<CartItem[]> {
    const data = await apiRequest<CartResponse>({
        url: "/cart/items",
        method: "POST",
        data: { productId, quantity },
    });
    return normalizeCart(data);
}

export async function updateCartItemApi(
    productId: string,
    quantity: number,
): Promise<CartItem[]> {
    const data = await apiRequest<CartResponse>({
        url: `/cart/items/${productId}`,
        method: "PATCH",
        data: { quantity },
    });
    return normalizeCart(data);
}

export async function removeCartItemApi(productId: string): Promise<CartItem[]> {
    const data = await apiRequest<CartResponse>({
        url: `/cart/items/${productId}`,
        method: "DELETE",
    });
    return normalizeCart(data);
}

export async function clearCartApi(): Promise<CartItem[]> {
    const data = await apiRequest<CartResponse>({
        url: "/cart/clear",
        method: "DELETE",
    });
    return normalizeCart(data);
}

export async function mergeGuestCartApi(): Promise<CartItem[]> {
    const data = await apiRequest<CartResponse>({
        url: "/cart/merge",
        method: "POST",
        data: {},
    });
    return normalizeCart(data);
}
