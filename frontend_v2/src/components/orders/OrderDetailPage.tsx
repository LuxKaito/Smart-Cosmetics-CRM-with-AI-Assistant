"use client";

import { useEffect, useState } from "react";
import { getErrorMessage } from "../../lib/errors";
import {
    fetchOrderById,
    type OrderItem,
} from "../../services/orderService";
import OrderDetail from "./OrderDetail";
import AccountLayout from "../account/AccountLayout";

export default function OrderDetailPage({ orderId }: { orderId: string }) {
    const [order, setOrder] = useState<OrderItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;
        const loadOrder = async () => {
            setIsLoading(true);
            setError("");
            try {
                const result = await fetchOrderById(orderId);
                if (isMounted) setOrder(result);
            } catch (loadError) {
                if (isMounted) {
                    setError(
                        getErrorMessage(
                            loadError,
                            "Không tải được chi tiết đơn hàng.",
                        ),
                    );
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        void loadOrder();
        return () => {
            isMounted = false;
        };
    }, [orderId]);

    return (
        <AccountLayout
            title="Chi tiết đơn hàng"
            subtitle="Theo dõi sản phẩm, thanh toán và tiến trình giao hàng.">
            {isLoading ? (
                <div className="animate-pulse space-y-5">
                    <div className="h-32 rounded-[24px] bg-[#FFF7FA]" />
                    <div className="h-44 rounded-[24px] bg-[#FFF7FA]" />
                    <div className="h-72 rounded-[24px] bg-[#FFF7FA]" />
                </div>
            ) : error ? (
                <div className="rounded-[24px] border border-rose-200 bg-white p-6 text-rose-700">
                    {error}
                </div>
            ) : order ? (
                <OrderDetail order={order} />
            ) : null}
        </AccountLayout>
    );
}
