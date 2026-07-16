"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Ban, ClipboardList, Clock, Eye, PackageCheck, Search, Settings, Truck } from "lucide-react";
import AdminFilterBar from "../../../components/admin/AdminFilterBar";
import AdminPagination from "../../../components/admin/AdminPagination";
import OrderStatusSelect from "../../../components/admin/OrderStatusSelect";
import StatCard from "../../../components/admin/StatCard";
import {
    staffOrderService,
    type StaffOrderQuery,
} from "../../../services/staffOrderService";
import type { Pagination } from "../../../types/api";
import type { StaffOrder } from "../../../types/staff";

const emptyPagination: Pagination = { page: 1, limit: 10, total: 0, pages: 1 };
const emptyStats = { total: 0, pending: 0, processing: 0, shipping: 0, completed: 0, cancelled: 0 };
const money = (value?: number) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const tabs = [
    { value: "", label: "Tất cả" },
    { value: "PENDING_CONFIRMATION", label: "Chờ xác nhận" },
    { value: "CONFIRMED", label: "Đang xử lý" },
    { value: "SHIPPING", label: "Đang giao" },
    { value: "DELIVERED", label: "Hoàn thành" },
    { value: "CANCELLED", label: "Đã hủy" },
];

export default function StaffOrdersPage() {
    const [orders, setOrders] = useState<StaffOrder[]>([]);
    const [pagination, setPagination] = useState<Pagination>(emptyPagination);
    const [stats, setStats] = useState(emptyStats);
    const [query, setQuery] = useState<StaffOrderQuery>({ page: 1, limit: 10 });
    const [searchText, setSearchText] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const loadOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const response = await staffOrderService.list(query);
            setOrders(response.items || []);
            setPagination(response.pagination || emptyPagination);
            setStats(response.stats || emptyStats);
        } catch (requestError) {
            setOrders([]);
            setError(requestError instanceof Error ? requestError.message : "Không tải được đơn hàng.");
        } finally {
            setLoading(false);
        }
    }, [query]);

    useEffect(() => {
        void loadOrders();
    }, [loadOrders]);

    const applyFilters = () => {
        setQuery((prev) => ({
            ...prev,
            page: 1,
            search: searchText.trim() || undefined,
            paymentMethod: paymentMethod ? (paymentMethod as "COD" | "PAYOS") : undefined,
            orderStatus: status || undefined,
        }));
    };

    const resetFilters = () => {
        setSearchText("");
        setPaymentMethod("");
        setStatus("");
        setQuery({ page: 1, limit: pagination.limit || 10 });
    };

    const changeStatus = async (order: StaffOrder, nextStatus: string) => {
        if (!nextStatus || nextStatus === order.orderStatus) return;
        if (order.orderStatus === "PENDING_PAYMENT" && nextStatus === "PENDING_CONFIRMATION") return;
        try {
            setSaving(true);
            setError("");
            if (nextStatus === "CANCELLED") {
                await staffOrderService.cancel(order._id, "STAFF_CANCELLED");
            } else if (nextStatus === "CONFIRMED") {
                await staffOrderService.confirm(order._id);
            } else {
                await staffOrderService.updateStatus(order._id, nextStatus);
            }
            await loadOrders();
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Không thể cập nhật trạng thái đơn hàng.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-w-0 space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#2B1B24]">Đơn hàng</h1>
                    <p className="mt-2 text-sm text-[#7A6A70]">Quản lý và theo dõi tất cả đơn hàng trong hệ thống</p>
                </div>
            </div>

            {error ? <p className="rounded-2xl border border-[#FFD4E1] bg-white p-4 text-sm text-[#E11D48]">{error}</p> : null}

            <section className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                <StatCard label="Tất cả đơn hàng" value={String(stats.total)} icon={ClipboardList} />
                <StatCard label="Chờ xác nhận" value={String(stats.pending)} icon={Clock} />
                <StatCard label="Đang xử lý" value={String(stats.processing)} icon={Settings} />
                <StatCard label="Đang giao" value={String(stats.shipping)} icon={Truck} />
                <StatCard label="Hoàn thành" value={String(stats.completed)} icon={PackageCheck} />
                <StatCard label="Đã hủy" value={String(stats.cancelled)} icon={Ban} />
            </section>

            <AdminFilterBar>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A6A70]" size={17} />
                    <input
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") applyFilters();
                        }}
                        className="admin-input has-left-icon"
                        placeholder="Tìm theo mã đơn, tên hoặc SĐT..."
                    />
                </div>
                <select value={status} onChange={(event) => setStatus(event.target.value)} className="admin-input">
                    <option value="">Tất cả trạng thái</option>
                    {tabs.filter((tab) => tab.value).map((tab) => (
                        <option key={tab.value} value={tab.value}>
                            {tab.label}
                        </option>
                    ))}
                </select>
                <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="admin-input">
                    <option value="">Tất cả phương thức</option>
                    <option value="COD">COD</option>
                    <option value="PAYOS">Thanh toán online</option>
                </select>
                <button type="button" onClick={applyFilters} className="h-12 rounded-xl bg-[#F999B7] px-5 font-semibold text-white">
                    Lọc
                </button>
                <button type="button" onClick={resetFilters} className="h-12 rounded-xl border border-[#F999B7] bg-white px-5 font-semibold text-[#F999B7]">
                    Bỏ lọc
                </button>
            </AdminFilterBar>

            <section className="overflow-hidden rounded-[20px] border border-[#FFE3EC] bg-white shadow-[0_16px_38px_rgba(43,27,36,0.04)]">
                <div className="flex gap-8 overflow-x-auto border-b border-[#FFE3EC] px-5 text-sm font-semibold">
                    {tabs.map((tab) => (
                        <button
                            key={tab.label}
                            type="button"
                            onClick={() => {
                                setStatus(tab.value);
                                setQuery((prev) => ({ ...prev, page: 1, orderStatus: tab.value || undefined }));
                            }}
                            className={`whitespace-nowrap py-4 ${
                                (query.orderStatus || "") === tab.value ? "border-b-2 border-[#F999B7] text-[#F999B7]" : "text-[#2B1B24]"
                            }`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1160px] table-fixed text-left text-sm">
                        <colgroup>
                            <col style={{ width: "140px" }} />
                            <col style={{ width: "180px" }} />
                            <col style={{ width: "120px" }} />
                            <col style={{ width: "180px" }} />
                            <col style={{ width: "120px" }} />
                            <col style={{ width: "180px" }} />
                            <col style={{ width: "160px" }} />
                            <col style={{ width: "80px" }} />
                        </colgroup>
                        <thead className="bg-[#FFF7FA] text-xs uppercase text-[#7A6A70]">
                            <tr>
                                <th className="px-5 py-4">Mã đơn</th>
                                <th className="px-5 py-4">Khách hàng</th>
                                <th className="px-5 py-4">SĐT</th>
                                <th className="px-5 py-4">Thanh toán</th>
                                <th className="px-5 py-4">Tổng tiền</th>
                                <th className="px-5 py-4">Trạng thái</th>
                                <th className="px-5 py-4">Ngày đặt</th>
                                <th className="px-1 py-4 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F5E5EC]">
                            {loading ? (
                                <tr><td colSpan={8} className="py-12 text-center text-[#7A6A70]">Đang tải đơn hàng...</td></tr>
                            ) : orders.length ? (
                                orders.map((order) => (
                                    <tr key={order._id} className="hover:bg-[#FFF9FB]">
                                        <td className="truncate px-5 py-4 font-bold text-[#FF4F8B]" title={order.orderCode || "--"}>{order.orderCode || "--"}</td>
                                        <td className="px-5 py-4"><span className="block max-w-[220px] truncate" title={order.user?.name || order.shippingAddress?.fullName || "--"}>{order.user?.name || order.shippingAddress?.fullName || "--"}</span></td>
                                        <td className="truncate px-5 py-4" title={order.shippingAddress?.phone || "--"}>{order.shippingAddress?.phone || "--"}</td>
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-[#2B1B24]">{order.paymentMethod === "COD" ? "COD" : "Thanh toán online"}</p>
                                            <p className="max-w-[220px] truncate text-xs text-[#7A6A70]">{order.paymentMethod === "COD" ? "Thanh toán khi nhận hàng" : "Thanh toán qua cổng PayOS"}</p>
                                        </td>
                                        <td className="truncate px-5 py-4 font-bold text-[#FF4F8B]" title={money(order.totalAmount)}>{money(order.totalAmount)}</td>
                                        <td className="px-5 py-4"><OrderStatusSelect status={order.orderStatus} disabled={saving} onChange={(next) => void changeStatus(order, next)} /></td>
                                        <td className="truncate px-5 py-4" title={order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "--"}>{order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "--"}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end">
                                                <Link href={`/staff/orders/${order._id}`} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EADDE2] text-[#2B1B24]" title="Xem chi tiết">
                                                    <Eye size={15} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={8} className="py-12 text-center text-[#7A6A70]">Chưa có đơn hàng phù hợp.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <AdminPagination
                    pagination={pagination}
                    onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))}
                    onLimitChange={(limit) => setQuery((prev) => ({ ...prev, page: 1, limit }))}
                />
            </section>
        </div>
    );
}
