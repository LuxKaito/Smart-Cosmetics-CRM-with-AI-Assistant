import { apiRequest } from "../lib/apiClient";
import type { AdminDashboard, AdminUserList } from "../types/admin";

export async function fetchAdminDashboard(
    year?: number,
): Promise<AdminDashboard> {
    const query = year ? { year } : undefined;
    return apiRequest<AdminDashboard>({
        url: "/admin/dashboard",
        params: query,
    });
}

export async function fetchAdminUsers(
    query: { page?: number; limit?: number; search?: string } = {},
): Promise<AdminUserList> {
    return apiRequest<AdminUserList>({
        url: "/admin/users",
        params: query,
    });
}

export async function setUserBlocked(
    userId: string,
    isBlocked: boolean,
): Promise<{ user: unknown }> {
    return apiRequest<{ user: unknown }>({
        url: `/admin/users/${userId}/block`,
        method: "PATCH",
        data: { isBlocked },
    });
}

export async function assignUserRole(
    userId: string,
    role: string,
): Promise<{ user: unknown }> {
    return apiRequest<{ user: unknown }>({
        url: `/admin/users/${userId}/role`,
        method: "PATCH",
        data: { role },
    });
}
