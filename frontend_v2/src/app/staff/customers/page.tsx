"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Eye, LockKeyhole, Search, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import AdminFilterBar from "../../../components/admin/AdminFilterBar";
import AdminPagination from "../../../components/admin/AdminPagination";
import StatCard from "../../../components/admin/StatCard";
import StatusBadge from "../../../components/admin/StatusBadge";
import {
    staffCustomerService,
    type StaffCustomerQuery,
} from "../../../services/staffCustomerService";
import type { Pagination } from "../../../types/api";
import type { StaffCustomer } from "../../../types/staff";

const emptyPagination: Pagination = { page: 1, limit: 10, total: 0, pages: 1 };
const emptyStats = { total: 0, active: 0, blocked: 0, verified: 0, unverified: 0 };

type StatusFilter = "all" | "active" | "blocked";
type VerificationFilter = "all" | "verified" | "unverified";

export default function StaffCustomersPage() {
    const [customers, setCustomers] = useState<StaffCustomer[]>([]);
    const [pagination, setPagination] = useState<Pagination>(emptyPagination);
    const [stats, setStats] = useState(emptyStats);
    const [query, setQuery] = useState<StaffCustomerQuery>({ page: 1, limit: 10 });
    const [searchText, setSearchText] = useState("");
    const [status, setStatus] = useState<StatusFilter>("all");
    const [verification, setVerification] = useState<VerificationFilter>("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadCustomers = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const response = await staffCustomerService.list(query);
            setCustomers(response.items || []);
            setPagination(response.pagination || emptyPagination);
            setStats(response.stats || emptyStats);
        } catch (requestError) {
            setCustomers([]);
            setError(requestError instanceof Error ? requestError.message : "Không tải được khách hàng.");
        } finally {
            setLoading(false);
        }
    }, [query]);

    useEffect(() => {
        void loadCustomers();
    }, [loadCustomers]);

    const applyFilters = () => {
        setQuery((prev) => ({
            ...prev,
            page: 1,
            search: searchText.trim() || undefined,
            isBlocked: status === "all" ? undefined : status === "blocked",
            emailVerified: verification === "all" ? undefined : verification === "verified",
        }));
    };

    const resetFilters = () => {
        setSearchText("");
        setStatus("all");
        setVerification("all");
        setQuery({ page: 1, limit: pagination.limit || 10 });
    };

    return (
        <div className="min-w-0 space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#2B1B24]">Khách hàng</h1>
                    <p className="mt-2 text-sm text-[#7A6A70]">Tra cứu thông tin và lịch sử mua hàng của khách</p>
                </div>
            </div>

            {error ? <p className="rounded-2xl border border-[#FFD4E1] bg-white p-4 text-sm text-[#E11D48]">{error}</p> : null}

            <section className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-5">
                <StatCard label="Tổng khách hàng" value={String(stats.total)} icon={UsersRound} />
                <StatCard label="Đang hoạt động" value={String(stats.active)} icon={UserRound} />
                <StatCard label="Đã khóa" value={String(stats.blocked)} icon={LockKeyhole} />
                <StatCard label="Đã xác thực email" value={String(stats.verified)} icon={ShieldCheck} />
                <StatCard label="Chưa xác thực" value={String(stats.unverified)} icon={ShieldCheck} />
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
                        placeholder="Tìm theo tên, email hoặc SĐT..."
                    />
                </div>
                <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} className="admin-input">
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="blocked">Đã khóa</option>
                </select>
                <select value={verification} onChange={(event) => setVerification(event.target.value as VerificationFilter)} className="admin-input">
                    <option value="all">Tất cả xác thực</option>
                    <option value="verified">Đã xác thực email</option>
                    <option value="unverified">Chưa xác thực email</option>
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
                    <table className="w-full min-w-[1080px] table-fixed text-left text-sm">
                        <colgroup>
                            <col style={{ width: "220px" }} />
                            <col style={{ width: "240px" }} />
                            <col style={{ width: "150px" }} />
                            <col style={{ width: "150px" }} />
                            <col style={{ width: "140px" }} />
                            <col style={{ width: "140px" }} />
                            <col style={{ width: "80px" }} />
                        </colgroup>
                        <thead className="bg-[#FFF7FA] text-xs uppercase text-[#7A6A70]">
                            <tr>
                                <th className="px-5 py-4">Khách hàng</th>
                                <th className="px-5 py-4">Email</th>
                                <th className="px-5 py-4">Số điện thoại</th>
                                <th className="px-5 py-4">Xác thực email</th>
                                <th className="px-5 py-4">Trạng thái</th>
                                <th className="px-5 py-4">Ngày tạo</th>
                                <th className="px-1 py-4 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F5E5EC]">
                            {loading ? (
                                <tr><td colSpan={7} className="py-12 text-center text-[#7A6A70]">Đang tải khách hàng...</td></tr>
                            ) : customers.length ? (
                                customers.map((customer) => (
                                    <tr key={String(customer._id || customer.email)} className="hover:bg-[#FFF9FB]">
                                        <td className="px-5 py-4">
                                            <p className="truncate font-semibold text-[#2B1B24]" title={customer.name || "--"}>{customer.name || "--"}</p>
                                        </td>
                                        <td className="truncate px-5 py-4" title={customer.email}>{customer.email}</td>
                                        <td className="truncate px-5 py-4" title={customer.phone || "--"}>{customer.phone || "--"}</td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            {customer.emailVerified ? <StatusBadge tone="green">Đã xác thực</StatusBadge> : <StatusBadge tone="orange">Chưa xác thực</StatusBadge>}
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            {customer.isBlocked ? <StatusBadge tone="red">Đã khóa</StatusBadge> : <StatusBadge tone="green">Hoạt động</StatusBadge>}
                                        </td>
                                        <td className="truncate px-5 py-4" title={customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("vi-VN") : "--"}>
                                            {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("vi-VN") : "--"}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end">
                                                <Link href={`/staff/customers/${customer._id}`} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EADDE2] text-[#2B1B24]" title="Xem chi tiết">
                                                    <Eye size={15} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={7} className="py-12 text-center text-[#7A6A70]">Chưa có khách hàng phù hợp.</td></tr>
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
