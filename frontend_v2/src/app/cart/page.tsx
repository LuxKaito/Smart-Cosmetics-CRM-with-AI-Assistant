"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import {
    clearCartApi,
    fetchCart,
    removeCartItemApi,
    updateCartItemApi,
} from "../../services/cartService";
import { getErrorMessage } from "../../lib/errors";
import { getCurrentUser } from "../../utils/user";
import type { CartItem } from "../../types/cart";

const formatCurrency = (value: number) => `${value.toLocaleString("vi-VN")} đ`;

export default function CartPage() {
    const router = useRouter();
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState<{
        type: "error" | "success" | "";
        message: string;
    }>({ type: "", message: "" });

    useEffect(() => {
        let mounted = true;
        const loadCart = async () => {
            try {
                const cart = await fetchCart();
                if (!mounted) return;
                setItems(cart);
            } catch (error) {
                if (!mounted) return;
                setStatus({
                    type: "error",
                    message: getErrorMessage(error, "Không tải được giỏ hàng."),
                });
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        void loadCart();
        return () => {
            mounted = false;
        };
    }, []);

    const pricing = useMemo(() => {
        const originalSubtotal = items.reduce((sum, item) => {
            const basePrice = Number(item.originalPrice ?? item.price ?? 0);
            return sum + basePrice * item.quantity;
        }, 0);

        const finalSubtotal = items.reduce(
            (sum, item) => sum + Number(item.price || 0) * item.quantity,
            0,
        );

        const discount = Math.max(0, originalSubtotal - finalSubtotal);

        return {
            originalSubtotal,
            discount,
            finalSubtotal,
        };
    }, [items]);

    const handleQuantity = async (productId: string, quantity: number) => {
        const next = Math.max(1, quantity);
        try {
            const updated = await updateCartItemApi(productId, next);
            setItems(updated);
            setStatus({ type: "", message: "" });
        } catch (error) {
            setStatus({
                type: "error",
                message: getErrorMessage(error, "Cập nhật số lượng thất bại."),
            });
        }
    };

    const handleRemove = async (productId: string) => {
        try {
            const updated = await removeCartItemApi(productId);
            setItems(updated);
            setStatus({ type: "", message: "" });
        } catch (error) {
            setStatus({
                type: "error",
                message: getErrorMessage(error, "Xóa sản phẩm thất bại."),
            });
        }
    };

    const handleClear = async () => {
        try {
            const updated = await clearCartApi();
            setItems(updated);
            setStatus({ type: "success", message: "Đã xóa toàn bộ giỏ hàng." });
        } catch (error) {
            setStatus({
                type: "error",
                message: getErrorMessage(error, "Không thể xóa giỏ hàng."),
            });
        }
    };

    const handleCheckout = () => {
        const user = getCurrentUser();
        if (!user?._id && !user?.email) {
            router.push("/login?redirect=/checkout");
            return;
        }

        router.push("/checkout");
    };

    return (
        <div className="min-h-screen bg-[#FFF7FA] text-[#2B1B24]">
            <Header />
            <main className="mx-auto max-w-[1240px] px-4 py-8">
                <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="rounded-[24px] bg-white p-5 shadow-[0_10px_30px_rgba(249,153,183,0.15)] md:p-6">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold md:text-[2rem]">Giỏ hàng của bạn</h1>
                            <span className="rounded-full border border-[#FFD4E1] px-3 py-1 text-sm text-[#7A6A70]">
                                {items.length} sản phẩm
                            </span>
                        </div>

                        {status.message ? (
                            <div
                                className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                                    status.type === "error"
                                        ? "border-[#f0a3b6] bg-[#fff3f7] text-[#b14063]"
                                        : "border-[#FFD4E1] bg-[#FFF7FA] text-[#2B1B24]"
                                }`}>
                                {status.message}
                            </div>
                        ) : null}

                        {isLoading ? (
                            <div className="mt-6 rounded-2xl border border-dashed border-[#FFD4E1] bg-[#FFF7FA] p-8 text-center text-[#7A6A70]">
                                Đang tải giỏ hàng...
                            </div>
                        ) : null}

                        {!isLoading && items.length === 0 ? (
                            <div className="mt-6 rounded-2xl border border-[#FFD4E1] bg-[#FFF7FA] p-8 text-center">
                                <p className="text-lg font-semibold">Giỏ hàng đang trống</p>
                                <p className="mt-2 text-sm text-[#7A6A70]">
                                    Hãy thêm sản phẩm để bắt đầu thanh toán.
                                </p>
                                <Link
                                    href="/products"
                                    className="mt-4 inline-block rounded-2xl bg-[#F999B7] px-5 py-3 text-sm font-semibold text-white">
                                    Tiếp tục mua sắm
                                </Link>
                            </div>
                        ) : null}

                        {!isLoading && items.length > 0 ? (
                            <div className="mt-6 space-y-4">
                                {items.map((item) => {
                                    const salePrice = Number(item.price || 0);
                                    const originalPrice = Number(item.originalPrice ?? salePrice);
                                    const hasDiscount = originalPrice > salePrice;

                                    return (
                                        <article
                                            key={item.productId}
                                            className="rounded-2xl border border-[#FFD4E1] p-4">
                                            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                                            <div className="flex min-w-0 flex-1 items-center gap-4">
                                                <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-[#FFF7FA]">
                                                    {item.image ? (
                                                        <Image
                                                            src={item.image}
                                                            alt={item.name}
                                                            fill
                                                            sizes="80px"
                                                            className="object-cover"
                                                        />
                                                    ) : null}
                                                </div>
                                                <div className="min-w-0">
                                                    <h2 className="break-words text-base font-semibold leading-6">
                                                        {item.name}
                                                    </h2>
                                                    <p className="mt-1 flex items-center gap-2 text-sm">
                                                        <span className="whitespace-nowrap font-semibold text-[#F999B7]">
                                                            {formatCurrency(salePrice)}
                                                        </span>
                                                        {hasDiscount ? (
                                                            <span className="whitespace-nowrap text-[#7A6A70] line-through">
                                                                {formatCurrency(originalPrice)}
                                                            </span>
                                                        ) : null}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-end gap-3">
                                                <div className="flex items-center rounded-full border border-[#FFD4E1] bg-white">
                                                    <button
                                                        type="button"
                                                        className="h-9 w-9 text-lg"
                                                        onClick={() =>
                                                            handleQuantity(
                                                                item.productId,
                                                                item.quantity - 1,
                                                            )
                                                        }>
                                                        -
                                                    </button>
                                                    <span className="w-10 text-center text-sm font-semibold">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="h-9 w-9 text-lg"
                                                        onClick={() =>
                                                            handleQuantity(
                                                                item.productId,
                                                                item.quantity + 1,
                                                            )
                                                        }>
                                                        +
                                                    </button>
                                                </div>

                                                <strong className="min-w-[120px] whitespace-nowrap text-right text-lg font-bold text-[#F999B7]">
                                                    {formatCurrency(item.quantity * salePrice)}
                                                </strong>

                                                <button
                                                    type="button"
                                                    className="rounded-full border border-[#FFD4E1] px-3 py-2 text-sm"
                                                    onClick={() => handleRemove(item.productId)}>
                                                    Xóa
                                                </button>
                                            </div>
                                            </div>
                                        </article>
                                    );
                                })}

                                <div className="flex flex-wrap gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleClear}
                                        className="rounded-2xl border border-[#FFD4E1] px-4 py-2 text-sm font-semibold text-[#2B1B24]">
                                        Xóa toàn bộ giỏ hàng
                                    </button>
                                    <Link
                                        href="/products"
                                        className="rounded-2xl border border-[#FFD4E1] px-4 py-2 text-sm font-semibold text-[#2B1B24]">
                                        Tiếp tục mua sắm
                                    </Link>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <aside className="h-fit rounded-[24px] bg-white p-5 shadow-[0_10px_30px_rgba(249,153,183,0.15)] md:p-6">
                        <h2 className="text-3xl font-extrabold leading-tight text-[#101828] md:text-[2rem]">
                            Thông tin đơn hàng
                        </h2>

                        <div className="mt-4 space-y-4 border-b border-[#f3c8d7] pb-4">
                            <div className="flex items-center justify-between gap-3 text-base">
                                <span className="font-semibold text-[#101828]">Tạm tính:</span>
                                <strong className="whitespace-nowrap text-2xl font-extrabold text-[#ee2a67]">
                                    {formatCurrency(pricing.originalSubtotal)}
                                </strong>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-base">
                                <span className="font-semibold text-[#101828]">Giá giảm:</span>
                                <strong className="whitespace-nowrap text-2xl font-extrabold text-[#ee2a67]">
                                    {formatCurrency(pricing.discount)}
                                </strong>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-base">
                                <span className="font-bold text-[#101828]">Tổng cộng:</span>
                                <strong className="whitespace-nowrap text-2xl font-extrabold text-[#ee2a67]">
                                    {formatCurrency(pricing.finalSubtotal)}
                                </strong>
                            </div>
                        </div>

                        <div className="mt-4 rounded-sm bg-[#fff1f6] px-3 py-3">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#f26696] text-sm font-bold text-white">
                                ✓
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleCheckout}
                            disabled={items.length === 0}
                            className="mt-5 h-12 w-full rounded-md bg-[#ef6697] px-3 text-base font-extrabold uppercase text-white disabled:cursor-not-allowed disabled:opacity-60">
                            Thanh toán ngay
                        </button>

                        <Link
                            href="/products"
                            className="mt-4 block text-center text-sm font-semibold text-[#111827]">
                            ↶ Tiếp tục mua hàng
                        </Link>
                    </aside>
                </section>
            </main>
            <Footer />
        </div>
    );
}
