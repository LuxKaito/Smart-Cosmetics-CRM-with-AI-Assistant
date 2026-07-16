export type VoucherDiscountType = "percent" | "fixed";

export interface Voucher {
    _id?: string;
    code: string;
    name: string;
    description?: string;
    discountType: VoucherDiscountType;
    discountValue: number;
    minOrderValue: number;
    maxDiscount?: number | null;
    startDate?: string;
    endDate?: string;
    usageLimit?: number;
    usedCount?: number;
    isActive?: boolean;
    eligible?: boolean;
    disabledReason?: string;
    missingAmount?: number;
    discountAmount?: number;
}

