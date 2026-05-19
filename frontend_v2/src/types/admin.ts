import type { Pagination } from "./api";
import type { Product } from "./product";
import type { User } from "./auth";

export interface MonthlyRevenue {
    month: number;
    revenue: number;
    orders: number;
}

export interface AdminDashboard {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    revenue: number;
    topSellingProducts: Product[];
    monthlyChart: MonthlyRevenue[];
}

export interface AdminUserList {
    items: User[];
    pagination: Pagination;
}
