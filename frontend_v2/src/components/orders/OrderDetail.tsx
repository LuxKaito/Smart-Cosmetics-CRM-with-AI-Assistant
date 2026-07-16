import Link from "next/link";
import type { OrderItem } from "../../services/orderService";
import OrderStatusBadge from "./OrderStatusBadge";
import OrderStatusTimeline from "./OrderStatusTimeline";

const formatCurrency = (value?: number) =>
    `${Number(value || 0).toLocaleString("vi-VN")} đ`;

const formatDate = (value?: string) =>
    value
        ? new Intl.DateTimeFormat("vi-VN", {
              dateStyle: "medium",
              timeStyle: "short",
          }).format(new Date(value))
        : "--";

export default function OrderDetail({ order }: { order: OrderItem }) {
    const address = order.shippingAddress;
    const orderId = order.id || order._id;

    return (
        <div className="space-y-5">
            <section className="rounded-[24px] bg-white p-5 shadow-[0_10px_30px_rgba(249,153,183,0.15)] md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <Link
                            href="/account/orders"
                            className="text-sm font-semibold text-[#B14063]">
                            ← Đơn hàng của tôi
                        </Link>
                        <h1 className="mt-3 text-2xl font-bold">
                            Chi tiết đơn {order.orderCode || `#${orderId.slice(-8)}`}
                        </h1>
                        <p className="mt-1 text-sm text-[#7A6A70]">
                            Đặt lúc {formatDate(order.createdAt)}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <OrderStatusBadge status={order.orderStatus} />
                        <OrderStatusBadge
                            status={order.paymentStatus}
                            type="payment"
                        />
                    </div>
                </div>
            </section>

            <section
                id="tracking"
                className="scroll-mt-4 rounded-[24px] bg-white p-5 shadow-[0_10px_30px_rgba(249,153,183,0.15)] md:p-6">
                <OrderStatusTimeline order={order} />
            </section>

            <section className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
                <div className="rounded-[24px] bg-white p-5 shadow-[0_10px_30px_rgba(249,153,183,0.15)] md:p-6">
                    <h2 className="text-lg font-bold">Sản phẩm</h2>
                    <div className="mt-4 divide-y divide-[#FFE5ED]">
                        {order.items.map((item, index) => {
                            const productId =
                                typeof item.productId === "string"
                                    ? item.productId
                                    : item.productId?._id || item.productId?.id;
                            return (
                                <div
                                    key={`${item.productNameSnapshot}-${index}`}
                                    className="flex gap-4 py-4 first:pt-0 last:pb-0">
                                    <div
                                        className="h-16 w-16 shrink-0 rounded-xl bg-[#FFF7FA] bg-contain bg-center bg-no-repeat"
                                        style={{
                                            backgroundImage: item.imageSnapshot
                                                ? `url(${item.imageSnapshot})`
                                                : undefined,
                                        }}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold">
                                            {item.productNameSnapshot}
                                        </h3>
                                        <p className="mt-1 text-sm text-[#7A6A70]">
                                            {item.quantity} ×{" "}
                                            {formatCurrency(item.priceSnapshot)}
                                        </p>
                                        {order.orderStatus === "DELIVERED" && productId ? (
                                            <Link
                                                href={`/products/${productId}#reviews`}
                                                className="mt-2 inline-flex rounded-lg border border-[#FFD4E1] px-3 py-1.5 text-xs font-semibold text-[#B14063] transition hover:bg-[#FFF7FA]">
                                                Đánh giá sản phẩm
                                            </Link>
                                        ) : null}
                                    </div>
                                    <strong className="text-sm">
                                        {formatCurrency(item.lineTotal)}
                                    </strong>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-5">
                    <section className="rounded-[24px] bg-white p-5 shadow-[0_10px_30px_rgba(249,153,183,0.15)]">
                        <h2 className="text-lg font-bold">Giao hàng</h2>
                        {address ? (
                            <div className="mt-3 space-y-1 text-sm text-[#5F5056]">
                                <p className="font-semibold text-[#2B1B24]">
                                    {address.fullName}
                                </p>
                                <p>{address.phone}</p>
                                <p>
                                    {address.addressLine}, {address.ward},{" "}
                                    {address.district}, {address.province}
                                </p>
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-[#7A6A70]">
                                Chưa có địa chỉ giao hàng.
                            </p>
                        )}
                        {order.note ? (
                            <p className="mt-4 text-sm text-[#5F5056]">
                                <strong>Ghi chú:</strong> {order.note}
                            </p>
                        ) : null}
                    </section>

                    <section className="rounded-[24px] bg-white p-5 shadow-[0_10px_30px_rgba(249,153,183,0.15)]">
                        <h2 className="text-lg font-bold">Thanh toán</h2>
                        <dl className="mt-3 space-y-2 text-sm">
                            <div className="flex justify-between gap-3">
                                <dt>Phương thức</dt>
                                <dd className="font-semibold">
                                    {order.paymentMethod === "PAYOS"
                                        ? "PayOS"
                                        : "Thanh toán khi nhận hàng"}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt>Tạm tính</dt>
                                <dd>{formatCurrency(order.subtotal)}</dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt>Giảm giá</dt>
                                <dd>-{formatCurrency(order.discount)}</dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt>Phí giao hàng</dt>
                                <dd>{formatCurrency(order.shippingFee)}</dd>
                            </div>
                            <div className="flex justify-between gap-3 border-t border-[#FFE5ED] pt-3 text-base font-bold">
                                <dt>Tổng cộng</dt>
                                <dd className="text-[#B14063]">
                                    {formatCurrency(order.totalAmount)}
                                </dd>
                            </div>
                        </dl>
                    </section>
                </div>
            </section>
        </div>
    );
}
