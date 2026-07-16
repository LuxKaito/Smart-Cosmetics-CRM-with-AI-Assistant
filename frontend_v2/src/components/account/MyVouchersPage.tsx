"use client";

import { useEffect, useState } from "react";
import { TicketPercent } from "lucide-react";
import AccountLayout from "./AccountLayout";
import { fetchMyVouchers } from "../../services/voucherService";
import type { Voucher } from "../../types/voucher";

const money = (value?: number) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const discountText = (voucher: Voucher) =>
    voucher.discountType === "percent"
        ? `Giảm ${voucher.discountValue}%${voucher.maxDiscount ? ` tối đa ${money(voucher.maxDiscount)}` : ""}`
        : `Giảm ${money(voucher.discountValue)}`;

export default function MyVouchersPage() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;
        void fetchMyVouchers()
            .then((items) => {
                if (mounted) setVouchers(items);
            })
            .catch((requestError) => {
                if (mounted) {
                    setError(
                        requestError instanceof Error
                            ? requestError.message
                            : "Không tải được voucher.",
                    );
                }
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, []);

    return (
        <AccountLayout
            title="Voucher của tôi"
            subtitle="Những mã bạn đã lưu và điều kiện sử dụng khi thanh toán.">
            {error ? (
                <p className="rounded-2xl border border-[#FFD4E1] bg-[#FFF7FA] p-4 text-sm text-[#B14063]">
                    {error}
                </p>
            ) : null}

            {loading ? (
                <div className="rounded-2xl border border-dashed border-[#FFD4E1] bg-[#FFF7FA] p-6 text-sm text-[#7A6A70]">
                    Đang tải voucher...
                </div>
            ) : null}

            {!loading && !vouchers.length ? (
                <div className="rounded-2xl border border-dashed border-[#FFD4E1] bg-[#FFF7FA] p-6 text-sm text-[#7A6A70]">
                    Bạn chưa lưu voucher nào.
                </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
                {vouchers.map((voucher) => (
                    <article
                        key={voucher.code}
                        className="overflow-hidden rounded-2xl border border-[#FFD4E1] bg-white shadow-[0_12px_26px_rgba(249,153,183,0.12)]">
                        <div className="grid grid-cols-[112px_1fr]">
                            <div className="flex flex-col items-center justify-center bg-[#F999B7] p-4 text-center text-white">
                                <TicketPercent className="mb-2 h-7 w-7" />
                                <span className="text-xs font-bold uppercase tracking-[0.12em]">
                                    Mã giảm
                                </span>
                                <strong className="mt-1 break-all text-lg">
                                    {voucher.code}
                                </strong>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-[#2B1B24]">
                                    {voucher.name}
                                </h3>
                                <p className="mt-1 text-sm font-semibold text-[#F999B7]">
                                    {discountText(voucher)}
                                </p>
                                <p className="mt-2 text-sm text-[#7A6A70]">
                                    {voucher.description ||
                                        `Áp dụng cho đơn từ ${money(voucher.minOrderValue)}.`}
                                </p>
                                <div className="mt-3 grid gap-1 text-xs text-[#7A6A70]">
                                    <span>Đơn tối thiểu: {money(voucher.minOrderValue)}</span>
                                    <span>
                                        Hiệu lực:{" "}
                                        {voucher.startDate
                                            ? new Date(voucher.startDate).toLocaleDateString("vi-VN")
                                            : "--"}{" "}
                                        -{" "}
                                        {voucher.endDate
                                            ? new Date(voucher.endDate).toLocaleDateString("vi-VN")
                                            : "--"}
                                    </span>
                                    <span>
                                        Lượt dùng:{" "}
                                        {voucher.usageLimit
                                            ? `${voucher.usedCount || 0}/${voucher.usageLimit}`
                                            : "Không giới hạn"}
                                    </span>
                                </div>
                                {voucher.disabledReason ? (
                                    <p className="mt-3 rounded-xl bg-[#FFF0F5] px-3 py-2 text-xs text-[#B14063]">
                                        {voucher.disabledReason}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </AccountLayout>
    );
}

