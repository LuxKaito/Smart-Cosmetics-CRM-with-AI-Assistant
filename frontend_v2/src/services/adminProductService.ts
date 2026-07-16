import { apiRequest } from "../lib/apiClient";
import type { AdminProductListResult, AdminProductPayload } from "../types/admin";
import type { Product } from "../types/product";
import { cleanQuery, normalizePagination } from "./adminShared";

export interface AdminProductQuery {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    brand?: string;
    isActive?: boolean;
    sort?: string;
}

const normalizeProduct = (product: Product): Product => ({
    ...(product || {}),
    _id: product?._id || product?.id,
    image:
        product?.image ||
        product?.image_url ||
        product?.imageUrl ||
        (Array.isArray(product?.images) ? product.images[0] : undefined),
    sale_price: Number(product?.sale_price ?? 0),
    price: Number(product?.sale_price ?? 0),
    stock: Number(product?.stock || 0),
    soldCount: Number(product?.soldCount || 0),
    category: product?.category || product?.category_level_2 || product?.category_level_1 || "",
    subcategory: product?.subcategory || product?.product_type || product?.benefits || "",
    usageInstructions: product?.usageInstructions || product?.usage_instructions || "",
});

export const adminProductService = {
    async list(query: AdminProductQuery = {}): Promise<AdminProductListResult> {
        const data = await apiRequest<AdminProductListResult>({
            url: "/admin/products",
            params: cleanQuery(query),
        });
        return {
            ...data,
            items: (data.items || []).map(normalizeProduct),
            pagination: normalizePagination(data.pagination),
        };
    },
    async create(payload: AdminProductPayload): Promise<Product> {
        const data = await apiRequest<{ product: Product }>({
            url: "/admin/products",
            method: "POST",
            data: payload,
        });
        return normalizeProduct(data.product);
    },
    async update(productId: string, payload: Partial<AdminProductPayload>): Promise<Product> {
        const data = await apiRequest<{ product: Product }>({
            url: `/admin/products/${productId}`,
            method: "PATCH",
            data: payload,
        });
        return normalizeProduct(data.product);
    },
    disable(productId: string) {
        return apiRequest<{ deleted: boolean; disabled?: boolean }>({
            url: `/admin/products/${productId}`,
            method: "DELETE",
        });
    },
    async restore(productId: string): Promise<Product> {
        const data = await apiRequest<{ product: Product }>({
            url: `/admin/products/${productId}`,
            method: "PATCH",
            data: { isActive: true },
        });
        return normalizeProduct(data.product);
    },
};
