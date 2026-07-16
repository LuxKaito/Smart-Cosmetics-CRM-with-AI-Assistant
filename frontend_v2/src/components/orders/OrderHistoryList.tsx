import Link from "next/link";
import type { OrderItem } from "../../services/orderService";
import OrderStatusBadge from "./OrderStatusBadge";
import { canCancelOrder } from "./orderStatus";

const formatCurrency = (value?: number) =>
    `${Number(value || 0).toLocaleString("vi-VN")} đ`;

const formatDate = (value?: string) =>
    value
        ? new Intl.DateTimeFormat("vi-VN", {
              dateStyle: "medium",
              timeStyle: "short",
          }).format(new Date(value))
        : "--";

export function OrderHistorySkeleton() {
    return (
        <div className="mt-6 space-y-4" aria-label="Đang tải đơn hàng">
            {[0, 1, 2].map((item) => (
                <div
                    key={item}
                    className="animate-pulse rounded-2xl border border-[#FFE5ED] p-5">
                    <div className="h-4 w-40 rounded bg-[#FFE5ED]" />
                    <div className="mt-4 h-3 w-64 rounded bg-[#FFF0F5]" />
                    <div className="mt-3 h-3 w-52 rounded bg-[#FFF0F5]" />
                    <div className="mt-5 h-9 w-36 rounded-xl bg-[#FFE5ED]" />
                </div>
            ))}
        </div>
    );
}

export default function OrderHistoryList({
    orders,
    cancellingOrderId,
    onCancel,
}: {
    orders: OrderItem[];
    cancellingOrderId?: string;
    onCancel: (orderId: string) => void;
}) {
    if (!orders.length) {
        return (
            <div className="mt-8 rounded-2xl border border-dashed border-[#FFD4E1] bg-[#FFF7FA] px-5 py-10 text-center">
                <p className="font-semibold text-[#2B1B24]">
                    Bạn chưa có đơn hàng nào.
                </p>
                <Link
                    href="/products"
                    className="mt-4 inline-flex rounded-xl bg-[#F999B7] px-4 py-2 text-sm font-semibold text-white">
                    Khám phá sản phẩm
                </Link>
            </div>
        );
    }

    return (
        <div className="mt-6 space-y-4">
            {orders.map((order) => {
                const orderId = order.id || order._id;
                return (
                    <article
                        key={orderId}
                        className="rounded-2xl border border-[#FFD4E1] bg-white p-5 shadow-[0_8px_22px_rgba(249,153,183,0.08)]">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-[#A66B7D]">
                                    Mã đơn hàng
                                </p>
                                <h2 className="mt-1 font-bold">
                                    {order.orderCode || `#${orderId.slice(-8)}`}
                                </h2>
                                <p className="mt-1 text-sm text-[#7A6A70]">
                                    Đặt lúc {formatDate(order.createdAt)}
                                </p>
                            </div>
                            <strong className="text-lg text-[#B14063]">
                                {formatCurrency(order.totalAmount)}
                            </strong>
                        </div>

                        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                            <div>
                                <dt className="text-[#7A6A70]">
                                    Phương thức thanh toán
                                </dt>
                                <dd className="mt-1 font-semibold">
                                    {order.paymentMethod === "PAYOS"
                                        ? "PayOS"
                                        : "Thanh toán khi nhận hàng"}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[#7A6A70]">
                                    Thanh toán
                                </dt>
                                <dd className="mt-1">
                                    <OrderStatusBadge
                                        status={order.paymentStatus}
                                        type="payment"
                                    />
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[#7A6A70]">
                                    Trạng thái đơn hàng
                                </dt>
                                <dd className="mt-1">
                                    <OrderStatusBadge status={order.orderStatus} />
                                </dd>
                            </div>
                        </dl>

                        <div className="mt-5 flex flex-wrap gap-2">
                            <Link
                                href={`/account/orders/${orderId}`}
                                className="rounded-xl bg-[#F999B7] px-4 py-2 text-sm font-semibold text-white">
                                Xem chi tiết
                            </Link>
                            {canCancelOrder(order) ? (
                                <button
                                    type="button"
                                    disabled={cancellingOrderId === orderId}
                                    onClick={() => onCancel(orderId)}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-60">
                                    {cancellingOrderId === orderId
                                        ? "Đang hủy..."
                                        : "Hủy đơn"}
                                </button>
                            ) : null}
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
