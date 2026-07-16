import type { Pagination } from "./api";
import type { User } from "./auth";

export interface StaffOrder {
    _id: string;
    orderCode?: string;
    user?: {
        _id?: string;
        name?: string;
        email?: string;
    };
    items: Array<{
        productId?: string | { _id?: string };
        productNameSnapshot: string;
        imageSnapshot?: string;
        quantity: number;
        priceSnapshot: number;
        lineTotal: number;
    }>;
    shippingAddress?: {
        fullName: string;
        phone: string;
        province: string;
        district: string;
        ward: string;
        addressLine: string;
    };
    subtotal: number;
    discount: number;
    shippingFee: number;
    totalAmount: number;
    paymentMethod: "COD" | "PAYOS";
    paymentStatus: string;
    orderStatus: string;
    voucherCode?: string;
    note?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface StaffOrderListResult {
    items: StaffOrder[];
    pagination: Pagination;
    stats?: StaffOrderStats;
}

export interface StaffOrderStats {
    total: number;
    pending: number;
    processing: number;
    shipping: number;
    completed: number;
    cancelled: number;
}

export interface StaffCustomer extends User {
    isBlocked?: boolean;
    phone?: string;
    createdAt?: string;
    lastLoginAt?: string;
}

export interface StaffCustomerListResult {
    items: StaffCustomer[];
    pagination: Pagination;
    stats?: StaffCustomerStats;
}

export interface StaffCustomerStats {
    total: number;
    active: number;
    blocked: number;
    verified: number;
    unverified: number;
}

export interface StaffOverview {
    orders: StaffOrderStats;
    customers: StaffCustomerStats;
}
