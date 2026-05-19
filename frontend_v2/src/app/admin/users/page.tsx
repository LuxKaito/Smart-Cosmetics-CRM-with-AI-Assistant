"use client";

import { useCallback, useEffect, useState } from "react";
import AdminToast from "../../../components/admin/AdminToast";
import {
    assignUserRole,
    fetchAdminUsers,
    setUserBlocked,
} from "../../../services/adminService";
import { getErrorMessage } from "../../../lib/errors";
import type { Pagination } from "../../../types/api";
import type { User } from "../../../types/auth";

type ToastType = "info" | "success" | "error";

interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
}

const roles = ["user", "admin"];

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        pages: 1,
        total: 0,
        limit: 20,
    });
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const pushToast = (message: string, type: ToastType = "info") => {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 3200);
    };

    const loadUsers = useCallback(async (page = 1, searchValue = "") => {
        setIsLoading(true);
        try {
            const data = await fetchAdminUsers({
                page,
                limit: 20,
                search: searchValue || undefined,
            });
            setUsers(data.items || []);
            setPagination(
                data.pagination || { page: 1, pages: 1, total: 0, limit: 20 },
            );
        } catch (error) {
            pushToast(
                getErrorMessage(error, "Khong tai duoc nguoi dung."),
                "error",
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadUsers(1, "");
    }, [loadUsers]);

    const handleToggleBlock = async (user: User) => {
        try {
            if (!user._id) {
                pushToast("Khong tim thay ma nguoi dung.", "error");
                return;
            }
            await setUserBlocked(user._id, !user.isBlocked);
            pushToast(
                user.isBlocked ? "Da mo khoa tai khoan." : "Da khoa tai khoan.",
                "success",
            );
            void loadUsers(pagination.page || 1, search);
        } catch (error) {
            pushToast(
                getErrorMessage(error, "Khong the cap nhat trang thai."),
                "error",
            );
        }
    };

    const handleRoleChange = async (userId: string, role: string) => {
        try {
            await assignUserRole(userId, role);
            pushToast("Da cap nhat vai tro.", "success");
            void loadUsers(pagination.page || 1, search);
        } catch (error) {
            pushToast(
                getErrorMessage(error, "Khong the cap nhat vai tro."),
                "error",
            );
        }
    };

    return (
        <div className="admin-section">
            <div className="admin-section-head">
                <div>
                    <h2>Quan ly nguoi dung</h2>
                    <p>Theo doi va cap nhat trang thai tai khoan</p>
                </div>
            </div>

            <div className="admin-toolbar">
                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Tim theo email"
                />
                <button
                    type="button"
                    onClick={() => void loadUsers(1, search)}
                    className="admin-btn ghost">
                    Tim kiem
                </button>
            </div>

            <div className="admin-table-card">
                {isLoading ? (
                    <div className="table-skeleton" />
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Ten</th>
                                <th>Vai tro</th>
                                <th>Trang thai</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user._id}>
                                    <td>{user.email}</td>
                                    <td>{user.name || "--"}</td>
                                    <td>
                                        <select
                                            value={user.role}
                                            onChange={(event) => {
                                                if (!user._id) return;
                                                handleRoleChange(
                                                    user._id,
                                                    event.target.value,
                                                );
                                            }}>
                                            {roles.map((role) => (
                                                <option key={role} value={role}>
                                                    {role}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <span
                                            className={`status-badge${user.isBlocked ? " is-blocked" : ""}`}>
                                            {user.isBlocked
                                                ? "Blocked"
                                                : "Active"}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className="admin-btn ghost"
                                            onClick={() =>
                                                handleToggleBlock(user)
                                            }>
                                            {user.isBlocked
                                                ? "Mo khoa"
                                                : "Khoa"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {pagination.pages > 1 ? (
                <div className="admin-pagination">
                    {Array.from({ length: pagination.pages }).map(
                        (_, index) => {
                            const page = index + 1;
                            return (
                                <button
                                    key={page}
                                    type="button"
                                    className={`page-number${pagination.page === page ? " is-active" : ""}`}
                                    onClick={() => void loadUsers(page, search)}>
                                    {page}
                                </button>
                            );
                        },
                    )}
                </div>
            ) : null}

            {toasts.length > 0 ? (
                <div className="admin-toast-stack">
                    {toasts.map((toast) => (
                        <AdminToast
                            key={toast.id}
                            toast={toast}
                            onClose={() =>
                                setToasts((prev) =>
                                    prev.filter((item) => item.id !== toast.id),
                                )
                            }
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}
