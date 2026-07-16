"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock3, Edit3, Plus, Search, Ticket, TicketPercent, Trash2, XCircle } from "lucide-react";
import AdminFilterBar from "../../../components/admin/AdminFilterBar";
import AdminPagination from "../../../components/admin/AdminPagination";
import ConfirmDialog from "../../../components/admin/ConfirmDialog";
import StatCard from "../../../components/admin/StatCard";
import StatusBadge from "../../../components/admin/StatusBadge";
import VoucherForm from "../../../components/admin/VoucherForm";
import { adminVoucherService, type AdminVoucherQuery } from "../../../services/adminVoucherService";
import type { AdminVoucher, AdminVoucherPayload } from "../../../types/admin";
import type { Pagination } from "../../../types/api";

const emptyPagination: Pagination = { page: 1, limit: 10, total: 0, pages: 1 };
const emptyStats = { total: 0, active: 0, inactive: 0, expired: 0, lowUsageLeft: 0 };
const money = (value?: number | null) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

type StatusFilter = "all" | "active" | "inactive";
type TypeFilter = "all" | "percent" | "fixed";

export default function AdminVouchersPage() {
    const [vouchers, setVouchers] = useState<AdminVoucher[]>([]);
    const [pagination, setPagination] = useState<Pagination>(emptyPagination);
    const [stats, setStats] = useState(emptyStats);
    const [query, setQuery] = useState<AdminVoucherQuery>({ page: 1, limit: 10, sort: "-createdAt" });
    const [searchText, setSearchText] = useState("");
    const [status, setStatus] = useState<StatusFilter>("all");
    const [type, setType] = useState<TypeFilter>("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [selectedVoucher, setSelectedVoucher] = useState<AdminVoucher | null>(null);
    const [disableTarget, setDisableTarget] = useState<AdminVoucher | null>(null);
    const [saving, setSaving] = useState(false);

    const loadVouchers = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const response = await adminVoucherService.list(query);
            setVouchers(response.items || []);
            setPagination(response.pagination || emptyPagination);
            setStats(response.stats || emptyStats);
        } catch (requestError) {
            setVouchers([]);
            setError(requestError instanceof Error ? requestError.message : "Không tải được khuyến mãi.");
        } finally {
            setLoading(false);
        }
    }, [query]);

    useEffect(() => {
        void loadVouchers();
    }, [loadVouchers]);

    const applyFilters = () => {
        setQuery((prev) => ({
            ...prev,
            page: 1,
            search: searchText.trim() || undefined,
            discountType: type === "all" ? undefined : type,
            isActive: status === "all" ? undefined : status === "active",
        }));
    };

    const resetFilters = () => {
        setSearchText("");
        setStatus("all");
        setType("all");
        setQuery({ page: 1, limit: pagination.limit || 10, sort: "-createdAt" });
    };

    const submitVoucher = async (payload: AdminVoucherPayload) => {
        if (formMode === "create") await adminVoucherService.create(payload);
        else if (selectedVoucher?._id) await adminVoucherService.update(selectedVoucher._id, payload);
        setFormOpen(false);
        await loadVouchers();
    };

    const disableVoucher = async () => {
        if (!disableTarget?._id) return;
        try {
            setSaving(true);
            await adminVoucherService.disable(disableTarget._id);
            setDisableTarget(null);
            await loadVouchers();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-w-0 space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#2B1B24]">Khuyến mãi</h1>
                    <p className="mt-2 text-sm text-[#7A6A70]">Quản lý voucher và chương trình giảm giá</p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setSelectedVoucher(null);
                        setFormMode("create");
                        setFormOpen(true);
                    }}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#F999B7] px-6 font-semibold text-white shadow-[0_12px_24px_rgba(249,153,183,0.24)]">
                    <Plus size={18} />
                    Thêm khuyến mãi
                </button>
            </div>

            {error ? <p className="rounded-2xl border border-[#FFD4E1] bg-white p-4 text-sm text-[#E11D48]">{error}</p> : null}

            <section className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                <StatCard label="Tổng khuyến mãi" value={String(stats.total)} icon={Ticket} />
                <StatCard label="Đang hoạt động" value={String(stats.active)} icon={TicketPercent} />
                <StatCard label="Không hoạt động" value={String(stats.inactive)} icon={XCircle} />
                <StatCard label="Đã hết hạn" value={String(stats.expired)} icon={Clock3} />
                <StatCard label="Gần hết lượt" value={String(stats.lowUsageLeft)} icon={TicketPercent} />
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
                        placeholder="Tìm theo mã, tên hoặc mô tả..."
                    />
                </div>
                <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} className="admin-input">
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                </select>
                <select value={type} onChange={(event) => setType(event.target.value as TypeFilter)} className="admin-input">
                    <option value="all">Tất cả loại</option>
                    <option value="percent">Theo phần trăm</option>
                    <option value="fixed">Theo số tiền</option>
                </select>
                <button type="button" onClick={applyFilters} className="h-12 rounded-xl bg-[#F999B7] px-5 font-semibold text-white">
                    Lọc
                </button>
                <button type="button" onClick={resetFilters} className="h-12 rounded-xl border border-[#F999B7] bg-white px-5 font-semibold text-[#F999B7]">
                    Bỏ lọc
                </button>
            </AdminFilterBar>

            <section className="overflow-hidden rounded-[20px] border border-[#FFE3EC] bg-white shadow-[0_16px_38px_rgba(43,27,36,0.04)]">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1120px] text-left text-sm">
                        <thead className="bg-[#FFF7FA] text-xs uppercase text-[#7A6A70]">
                            <tr>
                                <th className="w-12 px-5 py-4"><input type="checkbox" /></th>
                                <th className="px-5 py-4">Mã</th>
                                <th className="px-5 py-4">Tên khuyến mãi</th>
                                <th className="px-5 py-4">Loại</th>
                                <th className="px-5 py-4">Giá trị</th>
                                <th className="px-5 py-4">Điều kiện</th>
                                <th className="px-5 py-4">Thời gian</th>
                                <th className="px-5 py-4">Trạng thái</th>
                                <th className="px-5 py-4 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F5E5EC]">
                            {loading ? (
                                <tr><td colSpan={9} className="py-12 text-center text-[#7A6A70]">Đang tải khuyến mãi...</td></tr>
                            ) : vouchers.length ? (
                                vouchers.map((voucher) => (
                                    <tr key={voucher._id} className="hover:bg-[#FFF9FB]">
                                        <td className="px-5 py-4"><input type="checkbox" /></td>
                                        <td className="px-5 py-4 whitespace-nowrap"><StatusBadge tone="pink">{voucher.code}</StatusBadge></td>
                                        <td className="px-5 py-4">
                                            <p className="max-w-[280px] truncate font-semibold text-[#2B1B24]" title={voucher.name}>{voucher.name}</p>
                                            <p className="max-w-[280px] truncate text-xs text-[#7A6A70]" title={voucher.description || "--"}>{voucher.description || "--"}</p>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">{voucher.discountType === "percent" ? <StatusBadge tone="pink">Phần trăm</StatusBadge> : <StatusBadge tone="blue">Số tiền</StatusBadge>}</td>
                                        <td className="px-5 py-4 whitespace-nowrap font-bold text-[#2B1B24]">{voucher.discountType === "percent" ? `${voucher.discountValue}%` : money(voucher.discountValue)}</td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <p>Đơn từ {money(voucher.minOrderValue)}</p>
                                            {voucher.maxDiscount ? <p className="text-xs text-[#7A6A70]">Tối đa {money(voucher.maxDiscount)}</p> : null}
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <p>{new Date(voucher.startDate).toLocaleDateString("vi-VN")}</p>
                                            <p>{new Date(voucher.endDate).toLocaleDateString("vi-VN")}</p>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">{voucher.isActive ? <StatusBadge tone="green">Đang hoạt động</StatusBadge> : <StatusBadge tone="gray">Không hoạt động</StatusBadge>}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button type="button" onClick={() => { setSelectedVoucher(voucher); setFormMode("edit"); setFormOpen(true); }} className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-xl border border-[#EADDE2] px-3 font-semibold text-[#2B1B24]">
                                                    <Edit3 size={15} /> Sửa
                                                </button>
                                                <button type="button" disabled={!voucher.isActive} onClick={() => setDisableTarget(voucher)} className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-xl bg-[#FFF0F5] px-3 font-semibold text-[#F999B7] disabled:opacity-45">
                                                    <Trash2 size={15} /> Vô hiệu
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={9} className="py-12 text-center text-[#7A6A70]">Chưa có voucher phù hợp.</td></tr>
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

            <VoucherForm open={formOpen} mode={formMode} initialValue={selectedVoucher} onClose={() => setFormOpen(false)} onSubmit={submitVoucher} />
            <ConfirmDialog
                open={Boolean(disableTarget)}
                title="Vô hiệu hóa voucher"
                description={`Voucher "${disableTarget?.code || ""}" sẽ được chuyển sang trạng thái không hoạt động.`}
                confirmLabel="Vô hiệu hóa"
                danger
                isLoading={saving}
                onClose={() => setDisableTarget(null)}
                onConfirm={() => void disableVoucher()}
            />
        </div>
    );
}
