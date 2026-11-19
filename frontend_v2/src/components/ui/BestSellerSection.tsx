"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import type { Product } from "../../types/product";

type BestSellerCategory = {
    id: string;
    label: string;
    keywords: string[];
};

const categories: BestSellerCategory[] = [
    { id: "masks", label: "MẶT NẠ", keywords: ["mat na", "mask"] },
    { id: "lips", label: "SON MÔI", keywords: ["son moi", "son kem", "son tint", "son duong", "lipstick", "lip tint"] },
    { id: "makeup", label: "TRANG ĐIỂM", keywords: ["trang diem", "makeup", "phan mat", "phan ma", "mascara", "eyeliner", "kem nen"] },
    { id: "cleansing", label: "TẨY TRANG", keywords: ["tay trang", "micellar", "cleansing water"] },
    { id: "sunscreen", label: "CHỐNG NẮNG", keywords: ["chong nang", "sunscreen", "spf"] },
    { id: "face-care", label: "CHĂM SÓC DA MẶT", keywords: ["cham soc da mat", "serum", "sua rua mat", "duong am", "duong trang", "kem duong", "toner"] },
    { id: "body-care", label: "CHĂM SÓC CƠ THỂ", keywords: ["cham soc co the", "body"] },
    { id: "hair-care", label: "CHĂM SÓC TÓC", keywords: ["cham soc toc", "dau goi", "duong toc", "hair"] },
];

function normalizeText(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("vi")
        .trim();
}

function productSearchText(product: Product) {
    return [
        product.name,
        product.brand,
        product.category,
        product.category_level_1,
        product.category_level_2,
        product.subcategory,
        product.product_type,
        ...(Array.isArray(product.categories) ? product.categories : []),
    ]
        .filter((value): value is string => typeof value === "string" && value.length > 0)
        .map(normalizeText)
        .join(" ");
}

function matchesCategory(product: Product, category: BestSellerCategory) {
    const searchText = productSearchText(product);
    return category.keywords.some((keyword) => searchText.includes(normalizeText(keyword)));
}

export default function BestSellerSection({ products }: { products: Product[] }) {
    const [activeCategory, setActiveCategory] = useState("all");
    const [activePage, setActivePage] = useState(0);
    const sortedProducts = useMemo(
        () =>
            products
                .map((product, index) => ({ product, index }))
                .sort((left, right) => {
                    const soldDifference = Number(right.product.soldCount ?? 0) - Number(left.product.soldCount ?? 0);
                    return soldDifference || left.index - right.index;
                })
                .map(({ product }) => product),
        [products],
    );
    const filteredProducts = useMemo(() => {
        const selectedCategory = categories.find((category) => category.id === activeCategory);
        return selectedCategory
            ? sortedProducts.filter((product) => matchesCategory(product, selectedCategory))
            : sortedProducts;
    }, [activeCategory, sortedProducts]);
    const pageCount = Math.ceil(filteredProducts.length / 6);
    const pageIndex = pageCount > 0 ? Math.min(activePage, pageCount - 1) : 0;
    const displayedProducts = filteredProducts.slice(pageIndex * 6, pageIndex * 6 + 6);

    const changePage = (direction: number) => {
        if (pageCount < 2) return;
        setActivePage((current) => (current + direction + pageCount) % pageCount);
    };

    return (
        <section className="top-selling-section" aria-labelledby="top-selling-title">
            <h2 className="top-selling-title" id="top-selling-title">
                TOP SẢN PHẨM BÁN CHẠY
            </h2>

            <nav className="top-selling-tabs" aria-label="Lọc sản phẩm bán chạy" role="tablist">
                {categories.map((category) => (
                    <button
                        key={category.id}
                        type="button"
                        role="tab"
                        aria-selected={activeCategory === category.id}
                        className={`top-selling-tab${activeCategory === category.id ? " is-active" : ""}`}
                        onClick={() => {
                            setActiveCategory(category.id);
                            setActivePage(0);
                        }}>
                        {category.label}
                    </button>
                ))}
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeCategory === "all"}
                    className={`top-selling-tab${activeCategory === "all" ? " is-active" : ""}`}
                    onClick={() => {
                        setActiveCategory("all");
                        setActivePage(0);
                    }}>
                    TOÀN BỘ
                </button>
            </nav>

            <div className="top-selling-content">
                <Link
                    className="top-selling-banner"
                    href="/products?search=mat%20na&page=1"
                    aria-label="Khám phá sản phẩm mặt nạ bán chạy">
                    <Image
                        src="/banner/top-selling-masks.png"
                        alt="Banner sản phẩm mặt nạ chăm da"
                        fill
                        sizes="(max-width: 800px) 100vw, (max-width: 1200px) 30vw, 390px"
                        className="top-selling-banner-image"
                        priority={false}
                    />
                </Link>

                {displayedProducts.length > 0 ? (
                    <div className="top-selling-carousel">
                        <button
                            type="button"
                            className="top-selling-arrow home-carousel-arrow home-carousel-arrow--prev is-left"
                            onClick={() => changePage(-1)}
                            disabled={pageCount < 2}
                            aria-label="Xem sản phẩm bán chạy trước"
                        >
                            <span aria-hidden="true">‹</span>
                        </button>

                        <div className="top-selling-products" role="tabpanel" aria-live="polite">
                            {displayedProducts.map((product, index) => (
                                <ProductCard
                                    key={`${product._id || product.id || product.name}-${index}`}
                                    item={product}
                                    realDataOnly
                                    showOfficialBadge
                                />
                            ))}
                        </div>

                        <button
                            type="button"
                            className="top-selling-arrow home-carousel-arrow home-carousel-arrow--next is-right"
                            onClick={() => changePage(1)}
                            disabled={pageCount < 2}
                            aria-label="Xem sản phẩm bán chạy tiếp theo"
                        >
                            <span aria-hidden="true">›</span>
                        </button>
                    </div>
                ) : (
                    <p className="top-selling-empty" role="tabpanel" aria-live="polite">
                        Chưa có sản phẩm trong danh mục này.
                    </p>
                )}
            </div>
        </section>
    );
}
