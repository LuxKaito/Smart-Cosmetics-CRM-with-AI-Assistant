import { apiRequest } from "../lib/apiClient";
import type { Voucher } from "../types/voucher";

const normalizeVoucher = (voucher: Voucher): Voucher => ({
    ...(voucher || {}),
    code: String(voucher?.code || "").toUpperCase(),
    discountValue: Number(voucher?.discountValue || 0),
    minOrderValue: Number(voucher?.minOrderValue || 0),
    maxDiscount:
        voucher?.maxDiscount === null || voucher?.maxDiscount === undefined
            ? null
            : Number(voucher.maxDiscount),
    usageLimit: Number(voucher?.usageLimit || 0),
    usedCount: Number(voucher?.usedCount || 0),
    missingAmount: Number(voucher?.missingAmount || 0),
    discountAmount: Number(voucher?.discountAmount || 0),
});

export async function fetchPublicVouchers(limit = 12): Promise<Voucher[]> {
    const data = await apiRequest<{ items?: Voucher[] }>({
        url: "/vouchers",
        params: { limit },
    });
    return (data.items || []).map(normalizeVoucher);
}

export async function fetchMyVouchers(): Promise<Voucher[]> {
    const data = await apiRequest<{ items?: Voucher[] }>({
        url: "/vouchers/my",
    });
    return (data.items || []).map(normalizeVoucher);
}

export async function saveVoucher(code: string): Promise<Voucher> {
    const data = await apiRequest<{ voucher: Voucher; saved: boolean }>({
        url: `/vouchers/${encodeURIComponent(code)}/save`,
        method: "POST",
    });
    return normalizeVoucher(data.voucher);
}

