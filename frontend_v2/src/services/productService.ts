import { apiRequest } from "../lib/apiClient";
import { getOriginalPrice, getSalePrice } from "../lib/pricing";
import type {
    Product,
    ProductListResult,
    ProductQuery,
} from "../types/product";

const normalizeSearchText = (value: unknown) =>
    String(value ?? "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

const extractMetaFromDescription = (
    description: unknown,
    labels: string[],
): string => {
    const normalizedLabels = labels.map((label) => normalizeSearchText(label));
    const lines = String(description ?? "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    for (const line of lines) {
        const separator = line.indexOf(":");
        if (separator < 0) continue;

        const key = normalizeSearchText(line.slice(0, separator));
        const value = line.slice(separator + 1).trim();

        if (value && normalizedLabels.includes(key)) {
            return value;
        }
    }

    return "";
};

const normalizeProduct = (item: Product | null): Product | null => {
    if (!item || typeof item !== "object") return item;
    const source = item as Product & {
        sale_price?: number | null;
        salePrice?: number | null;
        original_price?: number | null;
        image_url?: string;
        product_name_vn?: string;
        product_name_en?: string;
    };
    const salePrice = getSalePrice(source);
    const originalPrice = getOriginalPrice(source, salePrice);
    const normalizedName =
        item.name || source.product_name_vn || source.product_name_en || "";
    const resolvedOrigin =
        String(item.origin || source.origin || "").trim() ||
        extractMetaFromDescription(item.description, ["origin", "xuat xu"]);
    const resolvedVolume =
        String(item.volume || source.volume || "").trim() ||
        extractMetaFromDescription(item.description, ["volume", "dung tich"]);

    return {
        ...item,
        name: normalizedName,
        price: salePrice,
        sale_price: salePrice,
        original_price: originalPrice,
        originalPrice,
        oldPrice: originalPrice,
        imageUrl: item.imageUrl || source.image_url || item.image,
        image_url: source.image_url || item.image_url || item.image || "",
        brand: item.brand || source.brand || "",
        origin: resolvedOrigin,
        volume: resolvedVolume,
        skin_type: item.skin_type || source.skin_type || "",
        category:
            item.category ||
            item.category_level_2 ||
            item.category_level_1 ||
            "",
        subcategory:
            item.subcategory ||
            item.product_type ||
            item.benefits ||
            "",
        usageInstructions:
            item.usageInstructions || item.usage_instructions || "",
        image:
            item.image ||
            source.image_url ||
            (Array.isArray(item.images) ? item.images[0] : "/placeholder.png"),
    };
};

const normalizeList = (
    data: { items?: Product[] } | Product[] | null,
): Product[] => {
    const items = Array.isArray((data as { items?: Product[] })?.items)
        ? (data as { items?: Product[] }).items
        : Array.isArray(data)
          ? data
          : [];
    return (items || []).map((item) => normalizeProduct(item) as Product);
};

export async function fetchHomeProducts(limit = 18): Promise<Product[]> {
    const data = await apiRequest<{ items?: Product[] } | Product[]>({
        url: "/products",
        params: { limit },
    });
    return normalizeList(data);
}

export async function fetchProducts(
    query: ProductQuery = {},
): Promise<ProductListResult> {
    const safeQuery: ProductQuery = {
        page:
            Number.isFinite(query.page) && (query.page as number) > 0
                ? query.page
                : 1,
        limit:
            Number.isFinite(query.limit) && (query.limit as number) > 0
                ? Math.min(query.limit as number, 20)
                : 20,
        sort: query.sort || undefined,
        search: query.search?.trim() || undefined,
        category: query.category?.trim() || undefined,
        subcategory: query.subcategory?.trim() || undefined,
        brand: query.brand?.trim() || undefined,
        skin_type: query.skin_type?.trim() || undefined,
        minPrice:
            Number.isFinite(query.minPrice) && (query.minPrice as number) >= 0
                ? query.minPrice
                : undefined,
        maxPrice:
            Number.isFinite(query.maxPrice) && (query.maxPrice as number) > 0
                ? query.maxPrice
                : undefined,
    };

    if (
        typeof safeQuery.minPrice === "number" &&
        typeof safeQuery.maxPrice === "number" &&
        safeQuery.minPrice > safeQuery.maxPrice
    ) {
        const temp = safeQuery.minPrice;
        safeQuery.minPrice = safeQuery.maxPrice;
        safeQuery.maxPrice = temp;
    }

    const cleanedParams = Object.fromEntries(
        Object.entries(safeQuery).filter(
            ([, value]) =>
                value !== undefined && value !== null && value !== "",
        ),
    );

    const data = await apiRequest<ProductListResult>({
        url: "/products",
        params: cleanedParams,
    });

    return {
        items: normalizeList(data),
        pagination: data.pagination || {
            page: 1,
            limit: safeQuery?.limit || 20,
            total: 0,
            pages: 1,
        },
    };
}

export async function fetchProductById(id: string): Promise<Product> {
    const data = await apiRequest<{ product: Product }>({
        url: `/products/${id}`,
    });
    const product = data?.product || (data as unknown as Product);
    return (normalizeProduct(product) || product) as Product;
}

export async function fetchProductCategories(): Promise<{
    categories: string[];
}> {
    try {
        const data = await apiRequest<{ categories: string[] }>({
            url: "/products/categories",
        });
        return data;
    } catch {
        const { items } = await fetchProducts({ page: 1, limit: 20 });
        const categorySet = new Set<string>();
        items.forEach((item) => {
            if (Array.isArray(item.categories)) {
                item.categories.forEach(
                    (category) => category && categorySet.add(category),
                );
            } else if (item.category) {
                categorySet.add(item.category);
            }
        });
        return { categories: Array.from(categorySet) };
    }
}

export async function createProduct(formData: FormData): Promise<Product> {
    return apiRequest<Product>({
        url: "/products",
        method: "POST",
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
    });
}

export async function updateProduct(
    id: string,
    formData: FormData,
): Promise<Product> {
    return apiRequest<Product>({
        url: `/products/${id}`,
        method: "PATCH",
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
    });
}

export async function deleteProduct(id: string): Promise<{ deleted: boolean }> {
    return apiRequest<{ deleted: boolean }>({
        url: `/products/${id}`,
        method: "DELETE",
    });
}
