import { apiRequest } from "../lib/apiClient";
import type { StaffOrder, StaffOrderListResult } from "../types/staff";
import { cleanStaffQuery, normalizeStaffPagination } from "./staffShared";

export interface StaffOrderQuery {
    page?: number;
    limit?: number;
    search?: string;
    orderStatus?: string;
    paymentMethod?: "COD" | "PAYOS";
    paymentStatus?: string;
    dateFrom?: string;
    dateTo?: string;
}

export const staffOrderService = {
    async list(query: StaffOrderQuery = {}): Promise<StaffOrderListResult> {
        const data = await apiRequest<StaffOrderListResult>({
            url: "/staff/orders",
            params: cleanStaffQuery(query),
        });
        return {
            ...data,
            items: data.items || [],
            pagination: normalizeStaffPagination(data.pagination),
        };
    },
    async detail(orderId: string): Promise<StaffOrder> {
        const data = await apiRequest<{ order: StaffOrder }>({
            url: `/staff/orders/${orderId}`,
        });
        return data.order;
    },
    async confirm(orderId: string): Promise<StaffOrder> {
        const data = await apiRequest<{ order: StaffOrder }>({
            url: `/staff/orders/${orderId}/confirm`,
            method: "PATCH",
        });
        return data.order;
    },
    async updateStatus(orderId: string, orderStatus: string): Promise<StaffOrder> {
        const data = await apiRequest<{ order: StaffOrder }>({
            url: `/staff/orders/${orderId}/status`,
            method: "PATCH",
            data: { orderStatus },
        });
        return data.order;
    },
    async cancel(orderId: string, reason = ""): Promise<StaffOrder> {
        const data = await apiRequest<{ order: StaffOrder }>({
            url: `/staff/orders/${orderId}/cancel`,
            method: "PATCH",
            data: { reason },
        });
        return data.order;
    },
};
