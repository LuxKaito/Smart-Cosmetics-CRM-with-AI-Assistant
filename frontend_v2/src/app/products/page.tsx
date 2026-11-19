"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import ProductSection from "../../components/ui/ProductSection";
import {
    fetchProductCategories,
    fetchProducts,
} from "../../services/productService";
import { productFilterSections } from "../../data/productFilters";
import type { Product } from "../../types/product";

export default function ProductsPage() {
    return (
        <Suspense fallback={<ProductsPageFallback />}>
            <ProductsPageContent />
        </Suspense>
    );
}

function ProductsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // --- 1. KHAI BÁO STATE ---
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [subcategoriesByCategory, setSubcategoriesByCategory] = useState<
        Record<string, string[]>
    >({});
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState({ type: "", message: "" });
    const [pagination, setPagination] = useState({
        page: 1,
        pages: 1,
        total: 0,
        limit: 20,
    });

    // Lấy giá trị search từ URL để khởi tạo ô input
    // --- 2. LẤY GIÁ TRỊ TỪ URL QUERIES ---
    const selectedCategory = searchParams.get("category") || "";
    const selectedSubcategory = searchParams.get("subcategory") || "";
    const selectedBrand = searchParams.get("brand") || "";
    const selectedSkinType = searchParams.get("skin_type") || "";
    const searchQuery =
        searchParams.get("search") || searchParams.get("q") || "";
    const sort = searchParams.get("sort") || "-soldCount";
    const currentPage = Number(searchParams.get("page") || 1);
    const requestedPageSize = Number(searchParams.get("limit"));
    const pageSize = [20, 30, 40].includes(requestedPageSize)
        ? requestedPageSize
        : 20;
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const minPrice = minPriceParam ? Number(minPriceParam) : undefined;
    const maxPrice = maxPriceParam ? Number(maxPriceParam) : undefined;

    // Đồng bộ ô Input khi URL thay đổi (Ví dụ bấm nút Xóa lọc)
    // Lấy danh sách danh mục khi mount
    useEffect(() => {
        fetchProductCategories().then((data) => {
            setCategories(data?.categories || []);
            setSubcategoriesByCategory(data?.subcategoriesByCategory || {});
        });
    }, []);

    // --- 3. LOGIC CALL API ---
    useEffect(() => {
        let isMounted = true;
        const loadProducts = async () => {
            setIsLoading(true);
            setStatus({ type: "", message: "" });
            try {
                const data = await fetchProducts({
                    page: currentPage,
                    limit: pageSize,
                    search: searchQuery,
                    category: selectedCategory,
                    subcategory: selectedSubcategory,
                    brand: selectedBrand,
                    skin_type: selectedSkinType,
                    minPrice: minPrice || undefined,
                    maxPrice: maxPrice || undefined,
                    sort,
                });
                if (isMounted) {
                    setProducts(data.items || []);
                    setPagination(
                        data.pagination || {
                            page: 1,
                            pages: 1,
                            total: 0,
                            limit: pageSize,
                        },
                    );
                }
            } catch (error: any) {
                if (isMounted) {
                    setStatus({
                        type: "error",
                        message: error.message || "Không tải được sản phẩm.",
                    });
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadProducts();
        return () => {
            isMounted = false;
        };
    }, [
        currentPage,
        pageSize,
        searchQuery,
        selectedCategory,
        selectedSubcategory,
        selectedBrand,
        selectedSkinType,
        minPrice,
        maxPrice,
        sort,
    ]);

    // --- 4. XỬ LÝ LỌC THƯƠNG HIỆU ---
    const brandOptions = useMemo(() => {
        const fromProducts = new Set<string>();
        products.forEach((item) => {
            if (item?.brand) fromProducts.add(item.brand);
        });

        if (fromProducts.size > 0) return Array.from(fromProducts);

        const brandGroup = productFilterSections.find(
            (group) => group.title === "THƯƠNG HIỆU",
        );
        return brandGroup?.items
            ? brandGroup.items.map((item) =>
                  item.replace(/\(\d+\)$/, "").trim(),
              )
            : [];
    }, [products]);

    const skinTypeOptions = useMemo(() => {
        const skinTypeGroup = productFilterSections.find(
            (group) => group.title === "LOẠI DA",
        );
        return skinTypeGroup?.items
            ? skinTypeGroup.items.map((item) =>
                  item.replace(/\(\d+\)$/, "").trim(),
              )
            : [];
    }, []);

    // --- 5. CÁC HÀM ĐIỀU HƯỚNG (FILTERS) ---
    const updateFilters = (updates: Record<string, any>) => {
        const nextParams = new URLSearchParams(searchParams.toString());

        Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === null || value === "") {
                nextParams.delete(key);
            } else {
                nextParams.set(key, String(value));
            }
        });

        const queryString = nextParams.toString();
        router.replace(queryString ? `/products?${queryString}` : "/products");
    };

    const handleResetFilters = () => {
        updateFilters({
            search: "",
            category: "",
            subcategory: "",
            brand: "",
            skin_type: "",
            minPrice: "",
            maxPrice: "",
            sort: "",
            page: "",
        });
    };

    return (
        <div className="page-shell">
            <Header />
            <main className="main-content container catalog-page">
                <div className="catalog-page-toolbar">
                    <nav className="catalog-breadcrumbs" aria-label="Đường dẫn">
                        <Link href="/">Trang chủ</Link>
                        <span aria-hidden="true">›</span>
                        <Link href="/products">Sản phẩm</Link>
                        {selectedCategory ? (
                            <>
                                <span aria-hidden="true">›</span>
                                <strong>{selectedCategory}</strong>
                            </>
                        ) : null}
                    </nav>
                </div>

                {status.message && (
                    <div
                        className={`auth-message ${status.type === "error" ? "is-error" : "is-success"}`}>
                        {status.message}
                    </div>
                )}

                <ProductSection
                    title={selectedCategory || "Tất cả sản phẩm"}
                    products={products}
                    categories={categories}
                    subcategoriesByCategory={subcategoriesByCategory}
                    brands={brandOptions}
                    skinTypes={skinTypeOptions}
                    selectedCategory={selectedCategory}
                    onCategoryChange={(value) =>
                        updateFilters({ category: value, subcategory: "", page: 1 })
                    }
                    onCategorySelectionChange={(category, subcategory) =>
                        updateFilters({ category, subcategory, page: 1 })
                    }
                    selectedSubcategory={selectedSubcategory}
                    selectedBrand={selectedBrand}
                    onBrandChange={(value) =>
                        updateFilters({ brand: value, page: 1 })
                    }
                    selectedSkinType={selectedSkinType}
                    onSkinTypeChange={(value) =>
                        updateFilters({ skin_type: value, page: 1 })
                    }
                    sort={sort}
                    onSortChange={(value) =>
                        updateFilters({ sort: value, page: 1 })
                    }
                    pageSize={pageSize}
                    onPageSizeChange={(value) =>
                        updateFilters({ limit: value, page: 1 })
                    }
                    priceRange={{
                        min: minPrice,
                        max: maxPrice,
                    }}
                    onPriceApply={(min, max) =>
                        updateFilters({ minPrice: min, maxPrice: max, page: 1 })
                    }
                    pagination={pagination}
                    isLoading={isLoading}
                    onPageChange={(page) => updateFilters({ page })}
                    onResetFilters={handleResetFilters}
                />
            </main>
            <Footer />
        </div>
    );
}

function ProductsPageFallback() {
    return (
        <div className="page-shell">
            <Header />
            <main className="main-content container catalog-page">
                <section className="catalog-hero">
                    <p className="section-kicker">Cửa hàng</p>
                    <h1>Đang tải danh sách sản phẩm...</h1>
                </section>
            </main>
            <Footer />
        </div>
    );
}
