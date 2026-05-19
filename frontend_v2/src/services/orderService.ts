import { apiRequest } from "../lib/apiClient";

export type PaymentMethod = "COD" | "PAYOS";

export interface CheckoutSummaryItem {
    productId: string;
    name: string;
    image?: string;
    quantity: number;
    unitPrice: number;
    originalUnitPrice?: number;
    lineTotal: number;
    lineOriginalTotal?: number;
    lineDiscount?: number;
    priceChanged?: boolean;
}

export interface CheckoutShippingInfo {
    method: string;
    zone: "inner_hcm" | "nationwide";
    estimatedDeliveryDate: string;
    estimatedDeliveryText: string;
    fee: number;
    freeShippingApplied: boolean;
    freeShippingThreshold: number;
}

export interface CheckoutSummary {
    cartId: string;
    items: CheckoutSummaryItem[];
    subtotal: number;
    discount: number;
    shippingFee: number;
    total: number;
    shipping?: CheckoutShippingInfo;
    availablePaymentMethods: PaymentMethod[];
}

export interface CreateOrderPayload {
    shippingAddress: {
        fullName: string;
        phone: string;
        province: string;
        district: string;
        ward: string;
        addressLine: string;
    };
    paymentMethod: PaymentMethod;
    note?: string;
    voucherCode?: string;
}

export interface OrderItem {
    _id: string;
    id?: string;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    paymentStatus: string;
    orderStatus: string;
    items: CheckoutSummaryItem[];
    shippingAddress?: {
        fullName: string;
        phone: string;
        province: string;
        district: string;
        ward: string;
        addressLine: string;
    };
    createdAt?: string;
}

export async function fetchCheckoutSummary(
    province?: string,
): Promise<CheckoutSummary> {
    const normalizedProvince = province?.trim() || undefined;
    return apiRequest<CheckoutSummary>({
        url: "/checkout/summary",
        params: normalizedProvince ? { province: normalizedProvince } : undefined,
    });
}

export async function createOrder(
    payload: CreateOrderPayload,
): Promise<{
    order: OrderItem;
    checkoutUrl?: string;
    successUrl?: string;
}> {
    return apiRequest<{
        order: OrderItem;
        checkoutUrl?: string;
        successUrl?: string;
    }>({
        url: "/orders",
        method: "POST",
        data: payload,
    });
}

export async function fetchMyOrders(): Promise<OrderItem[]> {
    const data = await apiRequest<{ orders: OrderItem[] }>({
        url: "/orders/my",
    });
    return data?.orders || [];
}

export async function fetchOrderById(orderId: string): Promise<OrderItem> {
    const data = await apiRequest<{ order: OrderItem }>({
        url: `/orders/${orderId}`,
    });
    return data.order;
}

export async function createPayOSPaymentLink(orderId: string): Promise<{
    order: OrderItem;
    checkoutUrl: string;
}> {
    return apiRequest<{ order: OrderItem; checkoutUrl: string }>({
        url: "/payments/payos/create",
        method: "POST",
        data: { orderId },
    });
}

// Compatibility wrappers for existing pages
export async function fetchOrdersByEmail(email: string): Promise<OrderItem[]> {
    void email;
    return fetchMyOrders();
}

export async function cancelOrder(
    orderId: string,
    reason = "Khách hàng hủy",
): Promise<{ order: OrderItem }> {
    return apiRequest<{ order: OrderItem }>({
        url: `/orders/${orderId}/cancel`,
        method: "PATCH",
        data: { reason },
    });
}
