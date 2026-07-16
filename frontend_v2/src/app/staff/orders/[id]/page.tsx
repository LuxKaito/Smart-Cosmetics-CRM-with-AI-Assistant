"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Truck, XCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import StaffOrderStatusBadge from "../../../../components/staff/StaffOrderStatusBadge";
import { staffOrderService } from "../../../../services/staffOrderService";
import type { StaffOrder } from "../../../../types/staff";

const money = (value?: number) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

export default function StaffOrderDetailPage() {
    const params = useParams<{ id: string }>();
    const orderId = String(params.id || "");
    const [order, setOrder] = useState<StaffOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const loadOrder = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            setOrder(await staffOrderService.detail(orderId));
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Không tải được chi tiết đơn hàng.");
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        void loadOrder();
    }, [loadOrder]);

    const runAction = async (action: () => Promise<StaffOrder>) => {
        try {
            setSaving(true);
            setError("");
            setOrder(await action());
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Không cập nhật được đơn hàng.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <p className="text-sm text-[#7A6A70]">Đang tải chi tiết đơn hàng...</p>;
    if (!order) return <p className="rounded-2xl border border-[#FFD4E1] bg-white p-4 text-sm text-[#E11D48]">{error || "Không tìm thấy đơn hàng."}</p>;

    const pending = ["PENDING_PAYMENT", "PENDING_CONFIRMATION"].includes(order.orderStatus);
    const final = ["DELIVERED", "CANCELLED"].includes(order.orderStatus);

    return (
        <div className="space-y-6">
            <Link href="/staff/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-[#F999B7]">
                <ArrowLeft size={16} />
                Quay lại danh sách đơn
            </Link>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Đơn hàng {order.orderCode || order._id}</h1>
                    <p className="mt-2 text-sm text-[#7A6A70]">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "--"}
                    </p>
                </div>
                <StaffOrderStatusBadge status={order.orderStatus} />
            </div>
            {error ? <p className="rounded-2xl border border-[#FFD4E1] bg-white p-4 text-sm text-[#E11D48]">{error}</p> : null}
            {!final ? (
                <section className="flex flex-wrap gap-3 rounded-[20px] border border-[#FFE3EC] bg-white p-4">
                    {pending ? (
                        <button type="button" disabled={saving} onClick={() => void runAction(() => staffOrderService.confirm(order._id))} className="inline-flex items-center gap-2 rounded-xl bg-[#E8F9EE] px-4 py-3 text-sm font-semibold text-[#168A42] disabled:opacity-60">
                            <CheckCircle2 size={17} /> Xác nhận đơn
                        </button>
                    ) : null}
                    {order.orderStatus === "CONFIRMED" ? (
                        <button type="button" disabled={saving} onClick={() => void runAction(() => staffOrderService.updateStatus(order._id, "SHIPPING"))} className="inline-flex items-center gap-2 rounded-xl bg-[#EFF6FF] px-4 py-3 text-sm font-semibold text-[#1D4ED8] disabled:opacity-60">
                            <Truck size={17} /> Chuyển sang giao hàng
                        </button>
                    ) : null}
                    {order.orderStatus === "SHIPPING" ? (
                        <button type="button" disabled={saving} onClick={() => void runAction(() => staffOrderService.updateStatus(order._id, "DELIVERED"))} className="inline-flex items-center gap-2 rounded-xl bg-[#FAF5FF] px-4 py-3 text-sm font-semibold text-[#7E22CE] disabled:opacity-60">
                            <CheckCircle2 size={17} /> Hoàn thành
                        </button>
                    ) : null}
                    <button
                        type="button"
                        disabled={saving}
                        onClick={() => {
                            const reason = window.prompt("Nhập lý do hủy đơn:", "STAFF_CANCELLED");
                            if (reason !== null) void runAction(() => staffOrderService.cancel(order._id, reason));
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#FFF1F2] px-4 py-3 text-sm font-semibold text-[#BE123C] disabled:opacity-60">
                        <XCircle size={17} /> Hủy đơn
                    </button>
                </section>
            ) : null}
            <div className="grid gap-5 lg:grid-cols-[1.45fr_0.8fr]">
                <section className="rounded-[20px] border border-[#FFE3EC] bg-white p-5">
                    <h2 className="text-lg font-bold">Sản phẩm</h2>
                    <div className="mt-4 divide-y divide-[#F5E5EC]">
                        {order.items.map((item, index) => (
                            <div key={`${item.productNameSnapshot}-${index}`} className="flex justify-between gap-4 py-4 text-sm">
                                <span>
                                    <strong className="block">{item.productNameSnapshot}</strong>
                                    <span className="text-[#7A6A70]">Số lượng: {item.quantity}</span>
                                </span>
                                <strong>{money(item.lineTotal)}</strong>
                            </div>
                        ))}
                    </div>
                </section>
                <section className="space-y-5">
                    <div className="rounded-[20px] border border-[#FFE3EC] bg-white p-5 text-sm">
                        <h2 className="text-lg font-bold">Giao hàng</h2>
                        <p className="mt-4 font-semibold">{order.shippingAddress?.fullName || "--"}</p>
                        <p className="mt-1 text-[#7A6A70]">{order.shippingAddress?.phone || "--"}</p>
                        <p className="mt-2 leading-6 text-[#7A6A70]">
                            {[order.shippingAddress?.addressLine, order.shippingAddress?.ward, order.shippingAddress?.district, order.shippingAddress?.province].filter(Boolean).join(", ")}
                        </p>
                    </div>
                    <div className="rounded-[20px] border border-[#FFE3EC] bg-white p-5 text-sm">
                        <h2 className="text-lg font-bold">Thanh toán</h2>
                        <p className="mt-4 flex justify-between"><span>Tạm tính</span><strong>{money(order.subtotal)}</strong></p>
                        <p className="mt-2 flex justify-between"><span>Giảm giá</span><strong>-{money(order.discount)}</strong></p>
                        <p className="mt-2 flex justify-between"><span>Vận chuyển</span><strong>{money(order.shippingFee)}</strong></p>
                        <p className="mt-4 flex justify-between border-t border-[#F5E5EC] pt-4 text-base"><span>Tổng tiền</span><strong className="text-[#F999B7]">{money(order.totalAmount)}</strong></p>
                    </div>
                </section>
            </div>
        </div>
    );
}
