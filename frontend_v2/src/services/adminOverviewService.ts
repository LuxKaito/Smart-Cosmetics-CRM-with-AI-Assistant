import { apiRequest } from "../lib/apiClient";
import type { AdminOverview } from "../types/admin";
import { cleanQuery } from "./adminShared";

export interface AdminOverviewQuery {
    preset?: "7d" | "30d" | "month" | "custom";
    dateFrom?: string;
    dateTo?: string;
}

export const adminOverviewService = {
    getOverview(query: AdminOverviewQuery = {}) {
        return apiRequest<AdminOverview>({
            url: "/admin/overview",
            params: cleanQuery(query),
        });
    },
};
