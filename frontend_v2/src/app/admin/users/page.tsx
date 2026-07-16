"use client";

import { useCallback, useEffect, useState } from "react";
import { Edit3, LockKeyhole, Plus, Search, ShieldCheck, Unlock, UserCog, UsersRound } from "lucide-react";
import { toast } from "sonner";
import AccountFormDrawer from "../../../components/admin/AccountFormDrawer";
import AdminFilterBar from "../../../components/admin/AdminFilterBar";
import AdminPagination from "../../../components/admin/AdminPagination";
import ConfirmDialog from "../../../components/admin/ConfirmDialog";
import StatusBadge from "../../../components/admin/StatusBadge";
import StatCard from "../../../components/admin/StatCard";
import UserRoleForm from "../../../components/admin/UserRoleForm";
import {
    ADMIN_DEPARTMENT_LABELS,
    adminUserService,
    type AdminUserQuery,
} from "../../../services/adminUserService";
import type { AdminAssignableRole, AdminDepartment, AdminUser, AdminUserPayload } from "../../../types/admin";
import type { Pagination } from "../../../types/api";

const emptyPagination: Pagination = { page: 1, limit: 10, total: 0, pages: 1 };
const emptyStats = { total: 0, admins: 0, staff: 0, customers: 0, blocked: 0 };
const TOAST_OPTIONS = { duration: 1000 };

type RoleFilter = "all" | "admin" | "staff";
type StatusFilter = "all" | "active" | "blocked";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [pagination, setPagination] = useState<Pagination>(emptyPagination);
    const [stats, setStats] = useState(emptyStats);
    const [query, setQuery] = useState<AdminUserQuery>({ page: 1, limit: 10 });
    const [searchText, setSearchText] = useState("");
    const [role, setRole] = useState<RoleFilter>("all");
    const [status, setStatus] = useState<StatusFilter>("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingRoleUser, setEditingRoleUser] = useState<AdminUser | null>(null);
    const [blockTarget, setBlockTarget] = useState<AdminUser | null>(null);
    const [savingBlock, setSavingBlock] = useState(false);

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const response = await adminUserService.list(query);
            setUsers(response.items || []);
            setPagination(response.pagination || emptyPagination);
            setStats(response.stats || emptyStats);
        } catch (requestError) {
            setUsers([]);
            setError(requestError instanceof Error ? requestError.message : "Không tải được tài khoản.");
        } finally {
            setLoading(false);
        }
    }, [query]);

    useEffect(() => {
        void loadUsers();
    }, [loadUsers]);

    const applyFilters = () => {
        setQuery((prev) => ({
            ...prev,
            page: 1,
            search: searchText.trim() || undefined,
            role: role === "all" ? undefined : role,
            isBlocked: status === "all" ? undefined : status === "blocked",
        }));
    };

    const resetFilters = () => {
        setSearchText("");
        setRole("all");
        setStatus("all");
        setQuery({ page: 1, limit: pagination.limit || 10 });
    };

    const createAccount = async (payload: AdminUserPayload) => {
        try {
            await adminUserService.create(payload);
            toast.success("Đã thêm tài khoản.", TOAST_OPTIONS);
            await loadUsers();
        } catch (requestError) {
            toast.error(
                requestError instanceof Error ? requestError.message : "Không tạo được tài khoản.",
                TOAST_OPTIONS,
            );
            throw requestError;
        }
    };

    const toggleBlock = async () => {
        if (!blockTarget?._id || blockTarget.role === "admin") return;
        try {
            setSavingBlock(true);
            await adminUserService.setBlocked(blockTarget._id, !blockTarget.isBlocked);
            toast.success(
                blockTarget.isBlocked ? "Đã mở khóa tài khoản." : "Đã khóa tài khoản.",
                TOAST_OPTIONS,
            );
            setBlockTarget(null);
            await loadUsers();
        } catch (requestError) {
            toast.error(
                requestError instanceof Error ? requestError.message : "Không cập nhật được trạng thái tài khoản.",
                TOAST_OPTIONS,
            );
        } finally {
            setSavingBlock(false);
        }
    };

    const saveRole = async ({ role, department }: { role: AdminAssignableRole; department: AdminDepartment | "" }) => {
        if (!editingRoleUser?._id) return;
        try {
            await adminUserService.assignRole(editingRoleUser._id, role);
            await adminUserService.update(editingRoleUser._id, { department });
            toast.success("Đã cập nhật phân quyền.", TOAST_OPTIONS);
            setEditingRoleUser(null);
            await loadUsers();
        } catch (requestError) {
            toast.error(
                requestError instanceof Error ? requestError.message : "Không cập nhật được phân quyền.",
                TOAST_OPTIONS,
            );
            throw requestError;
        }
    };

    return (
        <div className="min-w-0 space-y-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#2B1B24]">Tài khoản & phân quyền</h1>
                    <p className="mt-2 text-sm text-[#7A6A70]">Quản lý người dùng và phân quyền truy cập hệ thống</p>
                </div>
                <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#F999B7] px-6 font-semibold text-white shadow-[0_12px_24px_rgba(249,153,183,0.24)]">
                    <Plus size={18} />
                    Thêm tài khoản
                </button>
            </div>

            {error ? <p className="rounded-2xl border border-[#FFD4E1] bg-white p-4 text-sm text-[#E11D48]">{error}</p> : null}

            <section className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Tổng số tài khoản" value={String(stats.total)} icon={UsersRound} />
                <StatCard label="Quản trị viên" value={String(stats.admins)} icon={ShieldCheck} />
                <StatCard label="Nhân viên" value={String(stats.staff)} icon={UserCog} />
                <StatCard label="Đã khóa" value={String(stats.blocked)} icon={LockKeyhole} />
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
                <select value={role} onChange={(event) => setRole(event.target.value as RoleFilter)} className="admin-input">
                    <option value="all">Tất cả vai trò</option>
                    <option value="admin">Quản trị viên</option>
                    <option value="staff">Nhân viên</option>
                </select>
                <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} className="admin-input">
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Hoạt động</option>
                    <option value="blocked">Đã khóa</option>
                </select>
                <button type="button" onClick={applyFilters} className="h-12 rounded-xl bg-[#F999B7] px-3 font-semibold text-white">
                    Lọc
                </button>
                <button type="button" onClick={resetFilters} className="h-12 rounded-xl border border-[#F999B7] bg-white px-3 font-semibold text-[#F999B7]">
                    Bỏ lọc
                </button>
            </AdminFilterBar>

            <section className="overflow-hidden rounded-[20px] border border-[#FFE3EC] bg-white shadow-[0_16px_38px_rgba(43,27,36,0.04)]">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1180px] table-fixed text-left text-sm">
                        <colgroup>
                            <col style={{ width: "220px" }} />
                            <col style={{ width: "110px" }} />
                            <col style={{ width: "120px" }} />
                            <col style={{ width: "220px" }} />
                            <col style={{ width: "120px" }} />
                            <col style={{ width: "110px" }} />
                            <col style={{ width: "110px" }} />
                            <col style={{ width: "170px" }} />
                        </colgroup>
                        <thead className="bg-[#FFF7FA] text-xs uppercase text-[#7A6A70]">
                            <tr>
                                <th className="px-3 py-4">Người dùng</th>
                                <th className="px-3 py-4">Vai trò</th>
                                <th className="px-3 py-4">Phòng ban</th>
                                <th className="px-3 py-4">Email</th>
                                <th className="px-3 py-4">Số điện thoại</th>
                                <th className="px-3 py-4">Trạng thái</th>
                                <th className="px-3 py-4">Ngày tạo</th>
                                <th className="px-3 py-4 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F5E5EC]">
                            {loading ? (
                                <tr><td colSpan={8} className="py-12 text-center text-[#7A6A70]">Đang tải tài khoản...</td></tr>
                            ) : users.length ? (
                                users.map((user) => (
                                    <tr key={String(user._id || user.email)} className="hover:bg-[#FFF9FB]">
                                        <td className="px-3 py-4">
                                            <div className="min-w-0">
                                                <p className="max-w-[240px] truncate font-semibold text-[#2B1B24]" title={user.name || "--"}>{user.name || "--"}</p>
                                                <p className="max-w-[240px] truncate text-xs text-[#7A6A70]" title={user.email}>{user.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap">{renderRole(user.role)}</td>
                                        <td className="px-3 py-4 whitespace-nowrap">{renderDepartment(user.department)}</td>
                                        <td className="px-3 py-4"><span className="block max-w-[240px] truncate" title={user.email}>{user.email}</span></td>
                                        <td className="px-3 py-4 whitespace-nowrap">{user.phone || "--"}</td>
                                        <td className="px-3 py-4 whitespace-nowrap">{user.isBlocked ? <StatusBadge tone="red">Đã khóa</StatusBadge> : <StatusBadge tone="green">Hoạt động</StatusBadge>}</td>
                                        <td className="px-3 py-4 whitespace-nowrap">{user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "--"}</td>
                                        <td className="px-3 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button type="button" disabled={user.role === "admin"} onClick={() => setEditingRoleUser(user)} className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-xl border border-[#EADDE2] px-3 font-semibold text-[#2B1B24] disabled:opacity-45">
                                                    <Edit3 size={15} /> Sửa
                                                </button>
                                                <button type="button" disabled={user.role === "admin"} onClick={() => setBlockTarget(user)} className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-xl bg-[#FFF0F5] px-3 font-semibold text-[#F999B7] disabled:opacity-45">
                                                    {user.isBlocked ? <Unlock size={15} /> : <LockKeyhole size={15} />}
                                                    {user.isBlocked ? "Mở khóa" : "Khóa"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={8} className="py-12 text-center text-[#7A6A70]">Chưa có tài khoản phù hợp.</td></tr>
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

            <AccountFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onSubmit={createAccount} />
            <UserRoleForm
                open={Boolean(editingRoleUser)}
                user={editingRoleUser}
                onClose={() => setEditingRoleUser(null)}
                onSubmit={saveRole}
            />
            <ConfirmDialog
                open={Boolean(blockTarget)}
                title={blockTarget?.isBlocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                description={`Bạn có chắc chắn muốn ${blockTarget?.isBlocked ? "mở khóa" : "khóa"} tài khoản "${blockTarget?.email || ""}"?`}
                confirmLabel={blockTarget?.isBlocked ? "Mở khóa" : "Khóa tài khoản"}
                danger={!blockTarget?.isBlocked}
                isLoading={savingBlock}
                onClose={() => setBlockTarget(null)}
                onConfirm={() => void toggleBlock()}
            />
        </div>
    );
}

function renderRole(role?: string) {
    if (role === "admin") return <StatusBadge tone="pink">Quản trị viên</StatusBadge>;
    if (role === "staff") return <StatusBadge tone="orange">Nhân viên</StatusBadge>;
    return <StatusBadge tone="gray">--</StatusBadge>;
}

function renderDepartment(department?: AdminDepartment | "") {
    if (!department) return "--";
    return ADMIN_DEPARTMENT_LABELS[department] || department;
}
