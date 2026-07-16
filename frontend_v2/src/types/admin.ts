import type { Pagination } from "./api";
import type { User } from "./auth";
import type { Product } from "./product";

export type VoucherDiscountType = "percent" | "fixed";
export type AdminAssignableRole = "admin" | "staff";
export type AdminDepartment = "sales" | "warehouse" | "support" | "marketing";

export interface AdminTopSellingProduct {
    productId: string;
    name: string;
    image?: string;
    unitsSold: number;
    revenue: number;
}

export interface AdminMonthlyRevenue {
    month: number;
    revenue: number;
    orders: number;
}

export interface AdminRevenuePoint {
    date: string;
    revenue: number;
    orders?: number;
}

export interface AdminOverviewStatusStat {
    status?: string;
    method?: string;
    label: string;
    count: number;
    percent: number;
}

export interface AdminOverview {
    totalRevenue: number;
    totalOrders: number;
    newCustomers: number;
    returningCustomers: number;
    soldProducts: number;
    averageOrderValue: number;
    revenueChart: AdminRevenuePoint[];
    orderStatusStats: AdminOverviewStatusStat[];
    paymentMethodStats: AdminOverviewStatusStat[];
    topSellingProducts: AdminTopSellingProduct[];
    lowStockProducts: Array<{
        productId: string;
        name: string;
        image?: string;
        stock: number;
        soldCount: number;
    }>;
    customerStats: {
        totalCustomers: number;
        newCustomers: number;
        returningCustomers: number;
        returningRate: number;
    };
}

export interface AdminStatistics {
    year: number;
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    topSellingProducts: AdminTopSellingProduct[];
    monthlyRevenue: AdminMonthlyRevenue[];
}

export interface AdminProductListResult {
    items: Product[];
    pagination: Pagination;
    stats?: {
        total: number;
        active: number;
        hidden: number;
        lowStock: number;
        outOfStock: number;
        bestseller: number;
    };
    filters?: {
        categories: string[];
        brands: string[];
    };
}

export interface AdminProductPayload {
    name: string;
    slug?: string;
    sku?: string;
    product_name_vn?: string;
    product_name_en?: string;
    brand?: string;
    category_level_1?: string;
    category_level_2?: string;
    benefits?: string;
    product_type?: string;
    sale_price: number;
    original_price?: number | null;
    stock: number;
    image_url?: string;
    images?: string[];
    description?: string;
    shortDescription?: string;
    detailDescription?: string;
    ingredients?: string;
    usage_instructions?: string;
    skin_type?: string;
    volume?: string;
    origin?: string;
    isActive?: boolean;
}

export interface AdminUser extends User {
    isBlocked?: boolean;
    phone?: string;
    department?: AdminDepartment | "";
    createdAt?: string;
    lastLoginAt?: string;
}

export interface AdminUserListResult {
    items: AdminUser[];
    pagination: Pagination;
    stats?: {
        total: number;
        admins: number;
        staff: number;
        customers: number;
        blocked: number;
    };
}

export interface AdminUserPayload {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: AdminAssignableRole;
    department?: AdminDepartment | "";
    isBlocked?: boolean;
}

export interface AdminVoucher {
    _id: string;
    code: string;
    name: string;
    description?: string;
    discountType: VoucherDiscountType;
    discountValue: number;
    minOrderValue: number;
    maxDiscount?: number | null;
    startDate: string;
    endDate: string;
    usageLimit: number;
    usedCount: number;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface AdminVoucherListResult {
    items: AdminVoucher[];
    pagination: Pagination;
    stats?: {
        total: number;
        active: number;
        inactive: number;
        expired: number;
        lowUsageLeft: number;
    };
}

export interface AdminVoucherPayload {
    code: string;
    name: string;
    description?: string;
    discountType: VoucherDiscountType;
    discountValue: number;
    minOrderValue: number;
    maxDiscount?: number | null;
    startDate: string;
    endDate: string;
    usageLimit: number;
    usedCount?: number;
    isActive?: boolean;
}
