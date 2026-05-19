"use client";

import { useEffect, useState } from "react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import { cancelOrder, fetchMyOrders, type OrderItem } from "../../services/orderService";
import { getErrorMessage } from "../../lib/errors";

export default function OrdersPage() {
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [status, setStatus] = useState<{
        type: "error" | "success" | "";
        message: string;
    }>({ type: "", message: "" });

    const loadOrders = async () => {
        try {
            const data = await fetchMyOrders();
            setOrders(data);
        } catch (error) {
            setStatus({
                type: "error",
                message: getErrorMessage(error, "Không tải được đơn hàng."),
            });
        }
    };

    useEffect(() => {
        void loadOrders();
    }, []);

    const handleCancel = async (orderId: string) => {
        try {
            await cancelOrder(orderId, "Khách hàng hủy");
            setStatus({ type: "success", message: "Đã hủy đơn hàng." });
            await loadOrders();
        } catch (error) {
            setStatus({
                type: "error",
                message: getErrorMessage(error, "Không thể hủy đơn hàng."),
            });
        }
    };

    return (
        <div className="min-h-screen bg-[#FFF7FA] text-[#2B1B24]">
            <Header />
            <main className="mx-auto max-w-5xl px-4 py-8">
                <section className="rounded-[24px] bg-white p-5 shadow-[0_10px_30px_rgba(249,153,183,0.15)] md:p-6">
                    <h1 className="text-2xl font-bold">Đơn hàng của tôi</h1>

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

                    {orders.length === 0 ? (
                        <p className="mt-6 text-sm text-[#7A6A70]">
                            Chưa có đơn hàng nào.
                        </p>
                    ) : (
                        <div className="mt-6 space-y-4">
                            {orders.map((order) => {
                                const orderId = order.id || order._id;
                                const canCancel =
                                    order.orderStatus !== "CANCELLED" &&
                                    order.orderStatus !== "DELIVERED" &&
                                    order.paymentStatus !== "PAID";
                                return (
                                    <article
                                        key={orderId}
                                        className="rounded-2xl border border-[#FFD4E1] p-4">
                                        <p className="text-sm">
                                            <strong>Mã đơn:</strong> {orderId}
                                        </p>
                                        <p className="mt-1 text-sm">
                                            <strong>Trạng thái đơn:</strong>{" "}
                                            {order.orderStatus}
                                        </p>
                                        <p className="mt-1 text-sm">
                                            <strong>Thanh toán:</strong>{" "}
                                            {order.paymentStatus}
                                        </p>
                                        <p className="mt-1 text-sm">
                                            <strong>Tổng tiền:</strong>{" "}
                                            {Number(
                                                order.totalAmount || 0,
                                            ).toLocaleString("vi-VN")}{" "}
                                            đ
                                        </p>
                                        {canCancel ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleCancel(orderId)
                                                }
                                                className="mt-3 rounded-xl border border-[#FFD4E1] px-4 py-2 text-sm font-semibold">
                                                Hủy đơn
                                            </button>
                                        ) : null}
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
            <Footer />
        </div>
    );
}
