import type { Pagination } from "./api";

export interface Product {
    _id?: string;
    id?: string;
    name: string;
    product_name_vn?: string;
    product_name_en?: string;
    brand?: string;
    price?: number;
    sale_price?: number;
    original_price?: number | null;
    discount_percent?: number;
    image?: string;
    image_url?: string;
    imageUrl?: string;
    thumbnail?: string;
    thumb?: string;
    images?: string[];
    category?: string;
    categories?: string[];
    subcategory?: string;
    description?: string;
    specs?: string;
    ingredients?: string;
    directions?: string;
    skin_type?: string;
    volume?: string;
    origin?: string;
    rating?: number;
    review_count?: number;
    qa_count?: number;
    stock?: number;
    soldCount?: number;
    isActive?: boolean;
    discount?: number;
    reviews?: number;
    monthly?: string;
    soldPercent?: number;
    originalPrice?: number | null;
    oldPrice?: number | null;
    visualKicker?: string;
    visualHeadline?: string;
    visualVolume?: string;
}

export interface ProductListResult {
    items: Product[];
    pagination: Pagination;
}

export interface ProductQuery {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    brand?: string;
    skin_type?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    includeInactive?: boolean;
}
