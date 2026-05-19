"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { productFilterSections } from "../../data/productFilters";
import { getDiscountPercent } from "../../lib/pricing";
import type { Pagination } from "../../types/api";
import type { Product } from "../../types/product";
import ProductCard from "./ProductCard";

const uiSeeds = [
    {
        rating: 4.9,
        reviews: 116,
        monthly: "1.4k/tháng",
        soldPercent: 33,
    },
    {
        rating: 4.8,
        reviews: 89,
        monthly: "1.1k/tháng",
        soldPercent: 58,
    },
    {
        rating: 4.7,
        reviews: 64,
        monthly: "950/tháng",
        soldPercent: 42,
    },
    {
        rating: 4.9,
        reviews: 132,
        monthly: "1.8k/tháng",
        soldPercent: 76,
    },
];

function extractVolume(name: string | undefined) {
    const matched = name?.match(/\d+\s?(ml|g)|spf\s?\d+\+?/i);
    return matched ? matched[0].toUpperCase() : "BEST SELLER";
}

function compactHeadline(name: string) {
    return name.split(" ").slice(0, 7).join(" ").toUpperCase();
}

const resolveDiscountPercent = (product: Product) => {
    const discount = getDiscountPercent(product);
    return discount > 0 ? discount : null;
};

function buildPagination(
    currentPage: number,
    totalPages: number,
): Array<number | "ellipsis"> {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 4) {
        return [1, 2, 3, 4, 5, "ellipsis", totalPages];
    }

    if (currentPage >= totalPages - 3) {
        return [
            1,
            "ellipsis",
            totalPages - 4,
            totalPages - 3,
            totalPages - 2,
            totalPages - 1,
            totalPages,
        ];
    }

    return [
        1,
        "ellipsis",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "ellipsis",
        totalPages,
    ];
}

function EmptyProductCard() {
    return (
        <article className="product-card empty">
            <div className="thumb" />
            <div className="line long" />
            <div className="line" />
            <div className="line short" />
        </article>
    );
}

interface ProductSectionProps {
    title: string;
    products: Product[];
    categories?: Array<
        | string
        | {
              label?: string;
              value?: string;
              name?: string;
              code?: string;
              id?: string;
          }
    >;
    brands?: string[];
    selectedCategory?: string;
    onCategoryChange?: (value: string) => void;
    selectedBrand?: string;
    onBrandChange?: (value: string) => void;
    subcategories?: Array<
        string | { label?: string; value?: string; name?: string }
    >;
    selectedSubcategory?: string;
    onSubcategoryChange?: (value: string) => void;
    skinTypes?: string[];
    selectedSkinType?: string;
    onSkinTypeChange?: (value: string) => void;
    sort?: string;
    onSortChange?: (value: string) => void;
    priceRange?: { min?: number; max?: number };
    onPriceApply?: (min: number, max: number) => void;
    pagination?: Pagination;
    isLoading?: boolean;
    onPageChange?: (page: number) => void;
    onResetFilters?: () => void;
}

type CategoryItem = NonNullable<ProductSectionProps["categories"]>[number];

export default function ProductSection({
    title,
    products,
    categories = [],
    brands = [],
    selectedCategory = "",
    onCategoryChange,
    selectedBrand = "",
    onBrandChange,
    subcategories = [],
    selectedSubcategory = "",
    onSubcategoryChange,
    skinTypes = [],
    selectedSkinType = "",
    onSkinTypeChange,
    sort = "-soldCount",
    onSortChange,
    priceRange = { min: 0, max: 2000000 },
    onPriceApply,
    pagination = { page: 1, pages: 1, total: 0, limit: 20 },
    isLoading = false,
    onPageChange,
    onResetFilters,
}: ProductSectionProps) {
    const normalizeOption = (item: CategoryItem) => {
        if (typeof item === "string") {
            return { label: item, value: item };
        }
        const label =
            item.name ||
            item.label ||
            String(item.code || item.value || item.id || "");
        const value = String(
            item.code || item.value || item.id || item.name || "",
        );
        return { label, value };
    };
    const filterTabs = [
        "Mới nhất",
        "Bán chạy",
        "Giá thấp đến cao",
        "Giá cao đến thấp",
    ];
    const tabToSort: Record<string, string> = {
        "Mới nhất": "-createdAt",
        "Bán chạy": "-soldCount",
        "Giá thấp đến cao": "price",
        "Giá cao đến thấp": "-price",
    };
    const sortToTab = Object.fromEntries(
        Object.entries(tabToSort).map(([key, value]) => [value, key]),
    );
    const activeTab = sortToTab[sort] || "Bán chạy";
    const minPrice = Number.isFinite(priceRange?.min)
        ? Number(priceRange?.min)
        : 0;
    const maxPrice = Number.isFinite(priceRange?.max)
        ? Number(priceRange?.max)
        : 2000000;
    const priceStep = 50000;
    const [draftMinPrice, setDraftMinPrice] = useState(minPrice);
    const [draftMaxPrice, setDraftMaxPrice] = useState(maxPrice);
    const hasBaseProducts = Array.isArray(products) && products.length > 0;
    const denominator = Math.max(1, maxPrice - minPrice);
    const minRatio = ((draftMinPrice - minPrice) / denominator) * 100;
    const maxRatio = ((draftMaxPrice - minPrice) / denominator) * 100;

    const formatCurrency = (value?: number) =>
        `${Number.isFinite(value) ? Number(value).toLocaleString("vi-VN") : "0"}đ`;

    useEffect(() => {
        setDraftMinPrice(minPrice);
        setDraftMaxPrice(maxPrice);
    }, [minPrice, maxPrice]);

    const enrichedProducts = hasBaseProducts
        ? products.map((item, index) => {
              const seed = uiSeeds[index % uiSeeds.length];
              const volume = extractVolume(item.name);
              const actualDiscount = resolveDiscountPercent(item);

              return {
                  ...item,
                  discount: actualDiscount ?? undefined,
                  rating: item.rating ?? seed.rating,
                  reviews: item.reviews ?? seed.reviews,
                  monthly: item.monthly ?? seed.monthly,
                  soldPercent: item.soldPercent ?? seed.soldPercent,
                  visualKicker: item.visualKicker ?? "SẢN PHẨM BÁN CHẠY",
                  visualHeadline:
                      item.visualHeadline ?? compactHeadline(item.name),
                  visualVolume: item.visualVolume ?? volume,
              };
          })
        : [];

    const totalPages = Math.max(1, pagination?.pages || 1);
    const safeCurrentPage = Math.min(pagination?.page || 1, totalPages);
    const paginationItems = useMemo(
        () => buildPagination(safeCurrentPage, totalPages),
        [safeCurrentPage, totalPages],
    );

    const brandSection = productFilterSections.find(
        (group) => group.title === "THƯƠNG HIỆU",
    );
    const fallbackBrands =
        brandSection?.items?.map((item) => item.split("(")[0].trim()) || [];
    const brandOptions = brands.length > 0 ? brands : fallbackBrands;
    const skinTypeSection = productFilterSections.find(
        (group) => group.title === "LOẠI DA",
    );
    const fallbackSkinTypes =
        skinTypeSection?.items?.map((item) => item.split("(")[0].trim()) || [];
    const skinTypeOptions = skinTypes.length > 0 ? skinTypes : fallbackSkinTypes;

    const displayedProducts = enrichedProducts;

    const hasVisibleProducts = displayedProducts.length > 0;
    const totalCount = pagination?.total || enrichedProducts.length;

    const handleTabChange = (tab: string) => {
        const nextSort = tabToSort[tab];
        onSortChange?.(nextSort || "-soldCount");
    };

    const handleMinPriceChange = (event: ChangeEvent<HTMLInputElement>) => {
        const nextMin = Number(event.target.value);
        setDraftMinPrice(Math.min(nextMin, draftMaxPrice - priceStep));
    };

    const handleMaxPriceChange = (event: ChangeEvent<HTMLInputElement>) => {
        const nextMax = Number(event.target.value);
        setDraftMaxPrice(Math.max(nextMax, draftMinPrice + priceStep));
    };

    const applyPriceRange = () => {
        onPriceApply?.(draftMinPrice, draftMaxPrice);
    };

    const handleResetFilters = () => {
        onCategoryChange?.("");
        onBrandChange?.("");
        onSubcategoryChange?.("");
        onSkinTypeChange?.("");
        onResetFilters?.();
    };

    const goToPage = (page: number) => {
        const nextPage = Math.min(Math.max(1, page), totalPages);
        onPageChange?.(nextPage);
    };

    return (
        <section className="product-section">
            <div className="product-layout">
                <aside
                    className="product-filter-panel"
                    aria-label="Bộ lọc sản phẩm">
                    <div className="filter-actions">
                        <button
                            type="button"
                            className="reset-filter-btn"
                            onClick={handleResetFilters}>
                            Dat lai bo loc
                        </button>
                    </div>
                    {categories.length > 0 ? (
                        <section className="filter-block">
                            <h3>DANH MỤC</h3>
                            <ul
                                className={`filter-list${categories.length > 7 ? " is-scrollable" : ""}`}>
                                <li>
                                    <label htmlFor="category-all">
                                        <input
                                            id="category-all"
                                            type="radio"
                                            name="category"
                                            checked={!selectedCategory}
                                            onChange={() =>
                                                onCategoryChange?.("")
                                            }
                                        />
                                        <span>Tất cả</span>
                                    </label>
                                </li>
                                {categories.map((item) => {
                                    const option = normalizeOption(item);
                                    const id = `category-${option.value}`
                                        .replace(/\s+/g, "-")
                                        .toLowerCase();
                                    return (
                                        <li key={id}>
                                            <label htmlFor={id}>
                                                <input
                                                    id={id}
                                                    type="radio"
                                                    name="category"
                                                    checked={
                                                        selectedCategory ===
                                                        option.value
                                                    }
                                                    onChange={() =>
                                                        onCategoryChange?.(
                                                            option.value,
                                                        )
                                                    }
                                                />
                                                <span>{option.label}</span>
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    ) : (
                        <section className="filter-block">
                            <h3>DANH MỤC</h3>
                            <p className="filter-empty">
                                Chưa có dữ liệu danh mục từ CSDL.
                            </p>
                        </section>
                    )}

                    {brandOptions.length > 0 ? (
                        <section className="filter-block">
                            <h3>THƯƠNG HIỆU</h3>
                            <ul
                                className={`filter-list${brandOptions.length > 7 ? " is-scrollable" : ""}`}>
                                <li>
                                    <label htmlFor="brand-all">
                                        <input
                                            id="brand-all"
                                            type="radio"
                                            name="brand"
                                            checked={!selectedBrand}
                                            onChange={() => onBrandChange?.("")}
                                        />
                                        <span>Tất cả</span>
                                    </label>
                                </li>
                                {brandOptions.map((brand) => {
                                    const id = `brand-${brand}`
                                        .replace(/\s+/g, "-")
                                        .toLowerCase();
                                    return (
                                        <li key={id}>
                                            <label htmlFor={id}>
                                                <input
                                                    id={id}
                                                    type="radio"
                                                    name="brand"
                                                    checked={
                                                        selectedBrand === brand
                                                    }
                                                    onChange={() =>
                                                        onBrandChange?.(brand)
                                                    }
                                                />
                                                <span>{brand}</span>
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    ) : null}

                    {subcategories.length > 0 ? (
                        <section className="filter-block">
                            <h3>DANH MỤC CON</h3>
                            <ul
                                className={`filter-list${subcategories.length > 7 ? " is-scrollable" : ""}`}>
                                <li>
                                    <label htmlFor="subcategory-all">
                                        <input
                                            id="subcategory-all"
                                            type="radio"
                                            name="subcategory"
                                            checked={!selectedSubcategory}
                                            onChange={() =>
                                                onSubcategoryChange?.("")
                                            }
                                        />
                                        <span>Tất cả</span>
                                    </label>
                                </li>
                                {subcategories.map((item) => {
                                    const option = normalizeOption(item);
                                    const id = `subcategory-${option.value}`
                                        .replace(/\s+/g, "-")
                                        .toLowerCase();
                                    return (
                                        <li key={id}>
                                            <label htmlFor={id}>
                                                <input
                                                    id={id}
                                                    type="radio"
                                                    name="subcategory"
                                                    checked={
                                                        selectedSubcategory ===
                                                        option.value
                                                    }
                                                    onChange={() =>
                                                        onSubcategoryChange?.(
                                                            option.value,
                                                        )
                                                    }
                                                />
                                                <span>{option.label}</span>
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    ) : null}

                    <section className="filter-block">
                        <h3>KHOẢNG GIÁ</h3>
                        <div className="price-slider-wrap">
                            <div
                                className="price-slider-values"
                                aria-live="polite">
                                <span>{formatCurrency(draftMinPrice)}</span>
                                <strong>{formatCurrency(draftMaxPrice)}</strong>
                            </div>
                            <div
                                className="range-slider"
                                style={{
                                    background: `linear-gradient(90deg, #d7dce7 ${minRatio}%, #2f7c53 ${minRatio}%, #2f7c53 ${maxRatio}%, #d7dce7 ${maxRatio}%)`,
                                }}>
                                <input
                                    type="range"
                                    min={minPrice}
                                    max={maxPrice}
                                    step={priceStep}
                                    value={draftMinPrice}
                                    aria-label="Giá thấp nhất"
                                    onChange={handleMinPriceChange}
                                />
                                <input
                                    type="range"
                                    min={minPrice}
                                    max={maxPrice}
                                    step={priceStep}
                                    value={draftMaxPrice}
                                    aria-label="Giá cao nhất"
                                    onChange={handleMaxPriceChange}
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            className="apply-price-btn"
                            onClick={applyPriceRange}>
                            Áp dụng
                        </button>
                    </section>

                    {skinTypeOptions.length > 0 ? (
                        <section className="filter-block">
                            <h3>LOẠI DA</h3>
                            <ul
                                className={`filter-list${skinTypeOptions.length > 7 ? " is-scrollable" : ""}`}>
                                <li>
                                    <label htmlFor="skin-type-all">
                                        <input
                                            id="skin-type-all"
                                            type="radio"
                                            name="skin-type"
                                            checked={!selectedSkinType}
                                            onChange={() =>
                                                onSkinTypeChange?.("")
                                            }
                                        />
                                        <span>Tất cả</span>
                                    </label>
                                </li>
                                {skinTypeOptions.map((skinType) => {
                                    const id = `skin-type-${skinType}`
                                        .replace(/\s+/g, "-")
                                        .toLowerCase();
                                    return (
                                        <li key={id}>
                                            <label htmlFor={id}>
                                                <input
                                                    id={id}
                                                    type="radio"
                                                    name="skin-type"
                                                    checked={
                                                        selectedSkinType ===
                                                        skinType
                                                    }
                                                    onChange={() =>
                                                        onSkinTypeChange?.(
                                                            skinType,
                                                        )
                                                    }
                                                />
                                                <span>{skinType}</span>
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    ) : null}
                </aside>

                <div className="product-content">
                    <div className="section-head">
                        <h2>
                            {title}{" "}
                            <span className="product-count">
                                ({totalCount} sản phẩm)
                            </span>
                        </h2>
                        <div
                            className="pill-tabs"
                            role="tablist"
                            aria-label="Bộ lọc sản phẩm">
                            {filterTabs.map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    role="tab"
                                    aria-selected={activeTab === tab}
                                    className={`pill-tab-btn${activeTab === tab ? " is-active" : ""}`}
                                    onClick={() => handleTabChange(tab)}>
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="product-grid">
                            {Array.from({ length: 8 }).map((_, index) => (
                                <EmptyProductCard key={`loading-${index}`} />
                            ))}
                        </div>
                    ) : !hasBaseProducts ? (
                        <>
                            <div className="empty-note">
                                Sản phẩm đang để trống, bạn có thể kết nối
                                CSDL/API sau.
                            </div>
                            <div className="product-grid">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <EmptyProductCard key={index} />
                                ))}
                            </div>
                        </>
                    ) : !hasVisibleProducts ? (
                        <div className="empty-note">
                            Khong tim thay san pham phu hop voi bo loc da chon.
                        </div>
                    ) : (
                        <div className="product-grid">
                            {displayedProducts.map((item, index) => (
                                <ProductCard
                                    key={`${item._id || item.id}-${index}`}
                                    item={item}
                                />
                            ))}
                        </div>
                    )}

                    {hasBaseProducts && totalPages > 1 ? (
                        <nav
                            className="pagination-wrap"
                            aria-label="Phân trang sản phẩm">
                            <button
                                type="button"
                                className="page-arrow"
                                aria-label="Trang trước"
                                disabled={safeCurrentPage === 1}
                                onClick={() => goToPage(safeCurrentPage - 1)}>
                                ‹
                            </button>

                            {paginationItems.map((item, index) =>
                                item === "ellipsis" ? (
                                    <span
                                        key={`ellipsis-${index}`}
                                        className="page-ellipsis"
                                        aria-hidden="true">
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        key={`page-${item}`}
                                        type="button"
                                        className={`page-number${safeCurrentPage === item ? " is-active" : ""}`}
                                        aria-current={
                                            safeCurrentPage === item
                                                ? "page"
                                                : undefined
                                        }
                                        onClick={() => goToPage(item)}>
                                        {item}
                                    </button>
                                ),
                            )}

                            <button
                                type="button"
                                className="page-arrow"
                                aria-label="Trang sau"
                                disabled={safeCurrentPage === totalPages}
                                onClick={() => goToPage(safeCurrentPage + 1)}>
                                ›
                            </button>
                        </nav>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
