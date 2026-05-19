export interface CartItem {
    productId: string;
    name: string;
    price: number;
    originalPrice?: number | null;
    image?: string;
    quantity: number;
    brand?: string;
    lineTotal?: number;
    lineOriginalTotal?: number;
    lineDiscount?: number;
    stock?: number;
}

export interface CartResponse {
    items: CartItem[];
}
