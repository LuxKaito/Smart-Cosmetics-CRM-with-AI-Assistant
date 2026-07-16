"use client";

import Link from "next/link";
import { ArrowLeft, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import StaffOrderStatusBadge from "../../../../components/staff/StaffOrderStatusBadge";
import { staffCustomerService } from "../../../../services/staffCustomerService";
import type { StaffCustomer, StaffOrder } from "../../../../types/staff";

const money = (value?: number) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

export default function StaffCustomerDetailPage() {
    const params = useParams<{ id: string }>();
    const customerId = String(params.id || "");
    const [customer, setCustomer] = useState<StaffCustomer | null>(null);
    const [orders, setOrders] = useState<StaffOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadCustomer = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const [customerData, orderData] = await Promise.all([
                staffCustomerService.detail(customerId),
                staffCustomerService.orders(customerId),
            ]);
            setCustomer(customerData);
            setOrders(orderData);
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Không tải được thông tin khách hàng.");
        } finally {
            setLoading(false);
        }
    }, [customerId]);

    useEffect(() => {
        void loadCustomer();
    }, [loadCustomer]);

    if (loading) return <p className="text-sm text-[#7A6A70]">Đang tải khách hàng...</p>;
    if (!customer) return <p className="rounded-2xl border border-[#FFD4E1] bg-white p-4 text-sm text-[#E11D48]">{error || "Không tìm thấy khách hàng."}</p>;

    const defaultAddress =
        customer.shippingAddresses?.find((address) => address.isDefault) ||
        customer.shippingAddresses?.[0];

    return (
        <div className="space-y-6">
            <Link href="/staff/customers" className="inline-flex items-center gap-2 text-sm font-semibold text-[#F999B7]">
                <ArrowLeft size={16} />
                Quay lại danh sách khách hàng
            </Link>
            <div>
                <h1 className="text-3xl font-bold">Chi tiết khách hàng</h1>
                <p className="mt-2 text-sm text-[#7A6A70]">Thông tin liên hệ và lịch sử mua hàng.</p>
            </div>
            {error ? <p className="rounded-2xl border border-[#FFD4E1] bg-white p-4 text-sm text-[#E11D48]">{error}</p> : null}
            <section className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
                <div className="rounded-[20px] border border-[#FFE3EC] bg-white p-5">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF0F5] text-[#F999B7]">
                        <UserRound size={26} />
                    </span>
                    <h2 className="mt-4 text-xl font-bold">{customer.name || "--"}</h2>
                    <div className="mt-5 space-y-3 text-sm text-[#7A6A70]">
                        <p className="flex gap-2"><Mail size={17} className="shrink-0" /> {customer.email}</p>
                        <p className="flex gap-2"><Phone size={17} className="shrink-0" /> {customer.phone || "--"}</p>
                        <p className="flex gap-2"><MapPin size={17} className="shrink-0" /> {[defaultAddress?.addressLine, defaultAddress?.ward, defaultAddress?.district, defaultAddress?.province].filter(Boolean).join(", ") || "Chưa có địa chỉ"}</p>
                    </div>
                    <div className="mt-5 border-t border-[#F5E5EC] pt-4 text-sm">
                        <p>Trạng thái: <strong>{customer.isBlocked ? "Đã khóa" : "Hoạt động"}</strong></p>
                        <p className="mt-2">Email: <strong>{customer.emailVerified ? "Đã xác thực" : "Chưa xác thực"}</strong></p>
                    </div>
                </div>
                <div className="overflow-hidden rounded-[20px] border border-[#FFE3EC] bg-white">
                    <h2 className="px-5 py-4 text-lg font-bold">Lịch sử đơn hàng</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[650px] text-left text-sm">
                            <thead className="bg-[#FFF7FA] text-xs uppercase text-[#7A6A70]">
                                <tr>
                                    <th className="px-4 py-3">Mã đơn</th>
                                    <th className="px-4 py-3">Ngày đặt</th>
                                    <th className="px-4 py-3">Tổng tiền</th>
                                    <th className="px-4 py-3">Trạng thái</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F5E5EC]">
                                {orders.length ? (
                                    orders.map((order) => (
                                        <tr key={order._id}>
                                            <td className="px-4 py-4 font-semibold text-[#F999B7]">{order.orderCode || "--"}</td>
                                            <td className="px-4 py-4">{order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : "--"}</td>
                                            <td className="px-4 py-4 font-semibold">{money(order.totalAmount)}</td>
                                            <td className="px-4 py-4"><StaffOrderStatusBadge status={order.orderStatus} /></td>
                                            <td className="px-4 py-4"><Link href={`/staff/orders/${order._id}`} className="font-semibold text-[#F999B7]">Xem</Link></td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={5} className="py-10 text-center text-[#7A6A70]">Khách hàng chưa có đơn hàng.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}
