"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import {
    createPayOSPaymentLink,
    fetchOrderById,
    type OrderItem,
} from "../../../services/orderService";
import { getErrorMessage } from "../../../lib/errors";

export default function CheckoutFailedPage() {
    const [orderId, setOrderId] = useState("");
    const [order, setOrder] = useState<OrderItem | null>(null);
    const [status, setStatus] = useState("");
    const [isRetrying, setIsRetrying] = useState(false);

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
                setStatus(
                    getErrorMessage(error, "Không tải được thông tin đơn hàng."),
                );
            }
        };
        void loadOrder();
        return () => {
            mounted = false;
        };
    }, [orderId]);

    const handleRetryPayment = async () => {
        if (!orderId) return;
        setIsRetrying(true);
        try {
            const response = await createPayOSPaymentLink(orderId);
            if (response.checkoutUrl) {
                window.location.href = response.checkoutUrl;
                return;
            }
            setStatus("Không tạo được liên kết thanh toán mới.");
        } catch (error) {
            setStatus(
                getErrorMessage(error, "Không thể thử thanh toán lại lúc này."),
            );
        } finally {
            setIsRetrying(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FFF7FA] text-[#2B1B24]">
            <Header />
            <main className="mx-auto max-w-5xl px-4 py-8">
                <section className="rounded-[28px] bg-white p-6 shadow-[0_10px_30px_rgba(249,153,183,0.15)] md:p-8">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#ffeff4] text-3xl text-[#d84a79]">
                        ✕
                    </div>
                    <h1 className="mt-4 text-center text-3xl font-bold">
                        Thanh toán thất bại
                    </h1>
                    <p className="mt-2 text-center text-sm text-[#7A6A70]">
                        Đã xảy ra lỗi trong quá trình thanh toán. Bạn có thể thử
                        lại hoặc quay về giỏ hàng.
                    </p>

                    <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-[#FFD4E1] bg-[#FFF7FA] p-4 text-sm">
                        <p>
                            <strong>Mã đơn hàng:</strong>{" "}
                            {order?.orderCode || "--"}
                        </p>
                        {order?.paymentStatus ? (
                            <p className="mt-1">
                                <strong>Trạng thái thanh toán:</strong>{" "}
                                {order.paymentStatus}
                            </p>
                        ) : null}
                    </div>

                    {status ? (
                        <div className="mx-auto mt-4 max-w-xl rounded-2xl border border-[#f0a3b6] bg-[#fff3f7] px-4 py-3 text-sm text-[#b14063]">
                            {status}
                        </div>
                    ) : null}

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={handleRetryPayment}
                            disabled={
                                isRetrying ||
                                !orderId ||
                                (order?.paymentMethod
                                    ? order.paymentMethod !== "PAYOS"
                                    : false)
                            }
                            className="rounded-2xl bg-[#F999B7] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                            {isRetrying
                                ? "Đang tạo link thanh toán..."
                                : "Thử thanh toán lại"}
                        </button>
                        <Link
                            href="/cart"
                            className="rounded-2xl border border-[#FFD4E1] px-5 py-3 text-sm font-semibold text-[#2B1B24]">
                            Quay lại giỏ hàng
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
