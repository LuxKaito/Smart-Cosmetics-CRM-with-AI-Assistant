import type { OrderItem } from "../../services/orderService";

export type TimelineState = "done" | "current" | "pending" | "failed";

export interface OrderTimelineStep {
    key: string;
    label: string;
    state: TimelineState;
    icon?: "truck";
}

const orderStatusRank: Record<string, number> = {
    PENDING_PAYMENT: 0,
    PENDING_CONFIRMATION: 1,
    CONFIRMED: 2,
    SHIPPING: 3,
    DELIVERED: 4,
};

export const canCancelOrder = (order: OrderItem) =>
    !["CANCELLED", "DELIVERED"].includes(order.orderStatus) &&
    order.paymentStatus !== "PAID";

export const formatOrderStatus = (status?: string) => {
    const labels: Record<string, string> = {
        PENDING_PAYMENT: "Chờ thanh toán",
        PENDING_CONFIRMATION: "Chờ xác nhận",
        CONFIRMED: "Đang chuẩn bị hàng",
        SHIPPING: "Đang giao hàng",
        DELIVERED: "Giao hàng thành công",
        CANCELLED: "Đã hủy",
    };
    return labels[status || ""] || status || "Chưa cập nhật";
};

export const formatPaymentStatus = (status?: string) => {
    const labels: Record<string, string> = {
        UNPAID: "Chưa thanh toán",
        PENDING: "Chờ thanh toán",
        PAID: "Đã thanh toán",
        FAILED: "Thanh toán thất bại",
        CANCELLED: "Đã hủy thanh toán",
    };
    return labels[status || ""] || status || "Chưa cập nhật";
};

export const getOrderTimeline = (order: OrderItem): OrderTimelineStep[] => {
    const placed: OrderTimelineStep = {
        key: "placed",
        label: "Đã đặt hàng",
        state: "done",
    };

    if (order.paymentStatus === "FAILED") {
        return [
            placed,
            {
                key: "payment-failed",
                label: "Thanh toán thất bại",
                state: "failed",
            },
        ];
    }

    if (order.orderStatus === "CANCELLED" || order.paymentStatus === "CANCELLED") {
        return [
            placed,
            {
                key: "cancelled",
                label: "Đã hủy",
                state: "failed",
            },
        ];
    }

    if (order.orderStatus === "PENDING_PAYMENT") {
        return [
            placed,
            {
                key: "payment",
                label: "Chờ thanh toán",
                state: "current",
            },
            {
                key: "confirmation",
                label: "Chờ xác nhận",
                state: "pending",
            },
            {
                key: "preparing",
                label: "Đang chuẩn bị hàng",
                state: "pending",
            },
            {
                key: "shipping",
                label: "Đang giao hàng",
                state: "pending",
                icon: "truck",
            },
            {
                key: "delivered",
                label: "Giao hàng thành công",
                state: "pending",
            },
        ];
    }

    const rank = orderStatusRank[order.orderStatus] ?? 1;
    const steps: OrderTimelineStep[] = [placed];

    if (order.paymentStatus === "PAID") {
        steps.push({
            key: "paid",
            label: "Đã thanh toán",
            state: "done",
        });
    }

    steps.push(
        {
            key: "confirmation",
            label: rank > 1 ? "Đã xác nhận" : "Chờ xác nhận",
            state: rank > 1 ? "done" : "current",
        },
        {
            key: "preparing",
            label: "Đang chuẩn bị hàng",
            state: rank > 2 ? "done" : rank === 2 ? "current" : "pending",
        },
        {
            key: "shipping",
            label: "Đang giao hàng",
            state: rank > 3 ? "done" : rank === 3 ? "current" : "pending",
            icon: "truck",
        },
        {
            key: "delivered",
            label: "Giao hàng thành công",
            state: rank === 4 ? "done" : "pending",
        },
    );

    return steps;
};
