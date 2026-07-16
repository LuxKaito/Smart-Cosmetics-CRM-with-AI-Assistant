"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import { fetchOrderById, type OrderItem } from "../../../services/orderService";
import { getErrorMessage } from "../../../lib/errors";

export default function CheckoutSuccessPage() {
    const [orderId, setOrderId] = useState("");
    const [order, setOrder] = useState<OrderItem | null>(null);
    const [statusMessage, setStatusMessage] = useState("");

    useEffect(() => {
        if (typeof window === "undefined") return;
        const id = new URLSearchParams(window.location.search).get("orderId") || "";
        setOrderId(id);
    }, []);

    useEffect(() => {
        if (!orderId) return;
        let mounted = true;
        const loadOrder = async () => {
            try {
                const detail = await fetchOrderById(orderId);
                if (!mounted) return;
                setOrder(detail);
            } catch (error) {
                if (!mounted) return;
                setStatusMessage(
                    getErrorMessage(
                        error,
                        "Không tải được chi tiết đơn hàng.",
                    ),
                );
            }
        };
        void loadOrder();
        return () => {
            mounted = false;
        };
    }, [orderId]);

    return (
        <div className="min-h-screen bg-[#FFF7FA] text-[#2B1B24]">
            <Header />
            <main className="mx-auto max-w-5xl px-4 py-8">
                <section className="rounded-[28px] bg-white p-6 shadow-[0_10px_30px_rgba(249,153,183,0.15)] md:p-8">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#ecf9f0] text-3xl text-[#1f9a57]">
                        ✓
                    </div>
                    <h1 className="mt-4 text-center text-3xl font-bold">
                        Đặt hàng thành công
                    </h1>
                    <p className="mt-2 text-center text-sm text-[#7A6A70]">
                        Cảm ơn bạn đã mua sắm tại LuxBerry Beauty.
                    </p>

                    {statusMessage ? (
                        <div className="mx-auto mt-4 max-w-2xl rounded-2xl border border-[#f0a3b6] bg-[#fff3f7] px-4 py-3 text-sm text-[#b14063]">
                            {statusMessage}
                        </div>
                    ) : null}

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <InfoCard
                            label="Mã đơn hàng"
                            value={order?.orderCode || "--"}
                        />
                        <InfoCard
                            label="Tổng tiền"
                            value={
                                order?.totalAmount !== undefined &&
                                order?.totalAmount !== null
                                    ? `${order.totalAmount.toLocaleString("vi-VN")} đ`
                                    : "--"
                            }
                        />
                        <InfoCard
                            label="Phương thức thanh toán"
                            value={order?.paymentMethod || "--"}
                        />
                        <InfoCard
                            label="Trạng thái thanh toán"
                            value={order?.paymentStatus || "--"}
                        />
                    </div>

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href={orderId ? `/orders` : "/orders"}
                            className="rounded-2xl bg-[#F999B7] px-5 py-3 text-sm font-semibold text-white">
                            Xem chi tiết đơn hàng
                        </Link>
                        <Link
                            href="/products"
                            className="rounded-2xl border border-[#FFD4E1] px-5 py-3 text-sm font-semibold text-[#2B1B24]">
                            Tiếp tục mua sắm
                        </Link>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}

function InfoCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-[#FFD4E1] bg-[#FFF7FA] p-4">
            <p className="text-sm text-[#7A6A70]">{label}</p>
            <p className="mt-1 text-base font-semibold">{value}</p>
        </div>
    );
}
