import { apiRequest } from "../lib/apiClient";
import type { AdminVoucher, AdminVoucherListResult, AdminVoucherPayload } from "../types/admin";
import { cleanQuery, normalizePagination } from "./adminShared";

export interface AdminVoucherQuery {
    page?: number;
    limit?: number;
    search?: string;
    discountType?: "percent" | "fixed";
    isActive?: boolean;
    sort?: string;
}

const normalizeVoucher = (voucher: AdminVoucher): AdminVoucher => ({
    ...(voucher || {}),
    code: String(voucher?.code || "").toUpperCase(),
    discountValue: Number(voucher?.discountValue || 0),
    minOrderValue: Number(voucher?.minOrderValue || 0),
    usageLimit: Number(voucher?.usageLimit || 0),
    usedCount: Number(voucher?.usedCount || 0),
});

export const adminVoucherService = {
    async list(query: AdminVoucherQuery = {}): Promise<AdminVoucherListResult> {
        const data = await apiRequest<AdminVoucherListResult>({
            url: "/admin/vouchers",
            params: cleanQuery(query),
        });
        return {
            ...data,
            items: (data.items || []).map(normalizeVoucher),
            pagination: normalizePagination(data.pagination),
        };
    },
    async create(payload: AdminVoucherPayload): Promise<AdminVoucher> {
        const data = await apiRequest<{ voucher: AdminVoucher }>({
            url: "/admin/vouchers",
            method: "POST",
            data: payload,
        });
        return normalizeVoucher(data.voucher);
    },
    async update(voucherId: string, payload: Partial<AdminVoucherPayload>): Promise<AdminVoucher> {
        const data = await apiRequest<{ voucher: AdminVoucher }>({
            url: `/admin/vouchers/${voucherId}`,
            method: "PATCH",
            data: payload,
        });
        return normalizeVoucher(data.voucher);
    },
    disable(voucherId: string) {
        return apiRequest<{ deleted: boolean; voucher?: AdminVoucher }>({
            url: `/admin/vouchers/${voucherId}`,
            method: "DELETE",
        });
    },
};
