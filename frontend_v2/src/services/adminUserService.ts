import { apiRequest } from "../lib/apiClient";
import type {
    AdminAssignableRole,
    AdminDepartment,
    AdminUser,
    AdminUserListResult,
    AdminUserPayload,
} from "../types/admin";
import { cleanQuery, normalizePagination } from "./adminShared";

export const ADMIN_DEPARTMENT_LABELS: Record<AdminDepartment, string> = {
    sales: "Sales",
    warehouse: "Warehouse",
    support: "Support",
    marketing: "Marketing",
};

export interface AdminUserQuery {
    page?: number;
    limit?: number;
    search?: string;
    role?: "admin" | "staff";
    isBlocked?: boolean;
    dateFrom?: string;
    dateTo?: string;
}

const normalizeUser = (user: AdminUser): AdminUser => ({
    ...(user || {}),
});

export const adminUserService = {
    async list(query: AdminUserQuery = {}): Promise<AdminUserListResult> {
        const data = await apiRequest<AdminUserListResult>({
            url: "/admin/users",
            params: cleanQuery(query),
        });
        return {
            ...data,
            items: (data.items || []).map(normalizeUser),
            pagination: normalizePagination(data.pagination),
        };
    },
    async create(payload: AdminUserPayload): Promise<AdminUser> {
        const data = await apiRequest<{ user: AdminUser }>({
            url: "/admin/users",
            method: "POST",
            data: payload,
        });
        return normalizeUser(data.user);
    },
    async update(userId: string, payload: Partial<AdminUserPayload>): Promise<AdminUser> {
        const data = await apiRequest<{ user: AdminUser }>({
            url: `/admin/users/${userId}`,
            method: "PATCH",
            data: payload,
        });
        return normalizeUser(data.user);
    },
    async setBlocked(userId: string, isBlocked: boolean): Promise<AdminUser> {
        const data = await apiRequest<{ user: AdminUser }>({
            url: `/admin/users/${userId}/block`,
            method: "PATCH",
            data: { isBlocked },
        });
        return normalizeUser(data.user);
    },
    async assignRole(userId: string, role: AdminAssignableRole): Promise<AdminUser> {
        const data = await apiRequest<{ user: AdminUser }>({
            url: `/admin/users/${userId}/role`,
            method: "PATCH",
            data: { role },
        });
        return normalizeUser(data.user);
    },
};
