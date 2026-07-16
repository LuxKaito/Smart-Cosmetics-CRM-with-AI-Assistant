"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../../lib/errors";
import {
    cancelOrder,
    fetchMyOrders,
    type OrderItem,
} from "../../services/orderService";
import OrderHistoryList, { OrderHistorySkeleton } from "./OrderHistoryList";
import AccountLayout from "../account/AccountLayout";

export default function OrderHistoryPage() {
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [cancellingOrderId, setCancellingOrderId] = useState("");
    const [status, setStatus] = useState<{
        type: "error" | "success" | "";
        message: string;
    }>({ type: "", message: "" });

    const loadOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            setOrders(await fetchMyOrders());
        } catch (error) {
            setStatus({
                type: "error",
                message: getErrorMessage(error, "Không tải được đơn hàng."),
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadOrders();
    }, [loadOrders]);

    const handleCancel = async (orderId: string) => {
        setCancellingOrderId(orderId);
        try {
            await cancelOrder(orderId, "Khách hàng hủy");
            setStatus({ type: "success", message: "Đã hủy đơn hàng." });
            await loadOrders();
        } catch (error) {
            setStatus({
                type: "error",
                message: getErrorMessage(error, "Không thể hủy đơn hàng."),
            });
        } finally {
            setCancellingOrderId("");
        }
    };

    return (
        <AccountLayout
            title="Đơn hàng của tôi"
            subtitle="Lịch sử mua sắm và trạng thái xử lý đơn hàng của bạn.">
            {status.message ? (
                <div
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                        status.type === "error"
                            ? "border-rose-200 bg-rose-50 text-rose-700"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}>
                    {status.message}
                </div>
            ) : null}

            {isLoading ? (
                <OrderHistorySkeleton />
            ) : (
                <OrderHistoryList
                    orders={orders}
                    cancellingOrderId={cancellingOrderId}
                    onCancel={(orderId) => void handleCancel(orderId)}
                />
            )}
        </AccountLayout>
    );
}
