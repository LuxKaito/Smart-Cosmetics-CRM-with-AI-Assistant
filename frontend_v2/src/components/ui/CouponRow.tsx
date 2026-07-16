"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveVoucher } from "../../services/voucherService";
import { useAuthStore } from "../../stores/authStore";
import type { Voucher } from "../../types/voucher";

const money = (value?: number) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const describeVoucher = (voucher: Voucher) => {
    if (voucher.description) return voucher.description;
    const discount =
        voucher.discountType === "percent"
            ? `Giảm ${voucher.discountValue}%`
            : `Giảm ${money(voucher.discountValue)}`;
    const condition = voucher.minOrderValue
        ? ` cho đơn từ ${money(voucher.minOrderValue)}`
        : "";
    const cap = voucher.maxDiscount ? `, tối đa ${money(voucher.maxDiscount)}` : "";
    return `${discount}${condition}${cap}`;
};

export default function CouponRow({ coupons }: { coupons: Voucher[] }) {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const [savingCode, setSavingCode] = useState("");
    if (!coupons.length) return null;

    const loopingCoupons = [...coupons, ...coupons];
    const handleSave = async (code: string) => {
        if (!user) {
            router.push(`/login?redirect=${encodeURIComponent("/")}`);
            return;
        }

        try {
            setSavingCode(code);
            await saveVoucher(code);
            toast.success(`Đã lưu voucher ${code}.`);
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Không thể lưu voucher lúc này.",
            );
        } finally {
            setSavingCode("");
        }
    };

    return (
        <section className="coupon-section">
            <div className="coupon-marquee">
                <div className="coupon-grid">
                    {loopingCoupons.map((coupon, index) => (
                        <article
                            key={`${coupon.code}-${index}`}
                            className="coupon-card"
                            aria-hidden={index >= coupons.length}>
                            <div className="coupon-tag">
                                <small>Mã giảm</small>
                                <strong>{coupon.code}</strong>
                            </div>
                            <div className="coupon-body">
                                <h3>Nhập mã: {coupon.code}</h3>
                                <p>{describeVoucher(coupon)}</p>
                                <button
                                    type="button"
                                    disabled={savingCode === coupon.code}
                                    onClick={() => void handleSave(coupon.code)}
                                    tabIndex={index >= coupons.length ? -1 : 0}>
                                    {savingCode === coupon.code
                                        ? "Đang lưu"
                                        : "Lưu mã"}
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
