import { apiRequest } from "../lib/apiClient";
import type {
    StaffCustomer,
    StaffCustomerListResult,
    StaffOrder,
} from "../types/staff";
import { cleanStaffQuery, normalizeStaffPagination } from "./staffShared";

export interface StaffCustomerQuery {
    page?: number;
    limit?: number;
    search?: string;
    isBlocked?: boolean;
    emailVerified?: boolean;
}

const normalizeCustomer = (customer: StaffCustomer): StaffCustomer => ({
    ...(customer || {}),
    role: "customer",
});

export const staffCustomerService = {
    async list(query: StaffCustomerQuery = {}): Promise<StaffCustomerListResult> {
        const data = await apiRequest<StaffCustomerListResult>({
            url: "/staff/customers",
            params: cleanStaffQuery(query),
        });
        return {
            ...data,
            items: (data.items || []).map(normalizeCustomer),
            pagination: normalizeStaffPagination(data.pagination),
        };
    },
    async detail(customerId: string): Promise<StaffCustomer> {
        const data = await apiRequest<{ customer: StaffCustomer }>({
            url: `/staff/customers/${customerId}`,
        });
        return normalizeCustomer(data.customer);
    },
    async orders(customerId: string): Promise<StaffOrder[]> {
        const data = await apiRequest<{ orders: StaffOrder[] }>({
            url: `/staff/customers/${customerId}/orders`,
        });
        return data.orders || [];
    },
};
