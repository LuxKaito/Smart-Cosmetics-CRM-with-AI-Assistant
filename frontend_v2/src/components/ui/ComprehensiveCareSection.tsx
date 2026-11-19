"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { fetchProducts } from "../../services/productService";
import type { ProductListResult } from "../../types/product";
import ProductCard from "./ProductCard";

type ProductFilter = {
    id: string;
    label: string;
    category?: string | null;
    subcategory?: string;
    search?: string;
};

type CareGroup = {
    id: string;
    label: string;
    category: string;
    mascot: string;
    mascotSide: "left" | "right";
    tabs: ProductFilter[];
};

const allProductsTab: ProductFilter = {
    id: "all",
    label: "DANH MỤC SẢN PHẨM",
};

const careGroups: CareGroup[] = [
    {
        id: "face-care",
        label: "CHĂM SÓC DA MẶT",
        category: "Chăm Sóc Da Mặt",
        mascot: "/category-mascots/face-care.png",
        mascotSide: "left",
        tabs: [
            allProductsTab,
            { id: "mask", label: "MẶT NẠ", search: "Mặt Nạ" },
            { id: "sunscreen", label: "CHỐNG NẮNG", search: "Chống nắng" },
            { id: "cleanser", label: "TẨY TRANG", subcategory: "Tẩy Trang Mặt" },
            { id: "face-wash", label: "SỮA RỬA MẶT", subcategory: "Sữa Rửa Mặt" },
            { id: "toner", label: "TONER", subcategory: "Toner / Nước Cân Bằng Da" },
            { id: "serum", label: "TINH CHẤT", subcategory: "Serum / Tinh Chất" },
            { id: "moisturizer", label: "KEM DƯỠNG", subcategory: "Kem / Gel / Dầu Dưỡng" },
            { id: "clay-mask", label: "MẶT NẠ ĐẤT SÉT", search: "Mặt Nạ Đất Sét" },
        ],
    },
    {
        id: "makeup",
        label: "TRANG ĐIỂM",
        category: "Trang Điểm",
        mascot: "/category-mascots/makeup.png",
        mascotSide: "right",
        tabs: [
            allProductsTab,
            { id: "lips", label: "SON MÔI", search: "Son" },
            { id: "foundation", label: "KEM NỀN", subcategory: "Kem Nền" },
            { id: "primer", label: "KEM LÓT", subcategory: "Kem Lót" },
            { id: "blush", label: "MÁ HỒNG", subcategory: "Má Hồng" },
            { id: "concealer", label: "CHE KHUYẾT ĐIỂM", subcategory: "Che Khuyết Điểm" },
            { id: "powder", label: "PHẤN PHỦ", subcategory: "Phấn Phủ" },
            { id: "mascara", label: "MASCARA", subcategory: "Mascara" },
            { id: "eyeliner", label: "KẺ MẮT", subcategory: "Kẻ Mắt" },
            { id: "eyeshadow", label: "PHẤN MẮT", subcategory: "Phấn Mắt" },
            { id: "brows", label: "KẺ CHÂN MÀY", subcategory: "Kẻ Mày" },
            { id: "contour", label: "TẠO KHỐI / HIGHLIGHT", subcategory: "Tạo Khối / Highlight" },
        ],
    },
    {
        id: "body-care",
        label: "CHĂM SÓC CƠ THỂ",
        category: "Chăm Sóc Cơ Thể",
        mascot: "/category-mascots/body-care.png",
        mascotSide: "left",
        tabs: [
            allProductsTab,
            { id: "body-wash", label: "SỮA TẮM", search: "Sữa tắm" },
            { id: "body-exfoliator", label: "TẨY TẾ BÀO CHẾT BODY", search: "Tẩy tế bào chết body" },
            { id: "body-mist", label: "XỊT THƠM TOÀN THÂN", search: "Xịt thơm" },
            { id: "body-lotion", label: "DƯỠNG THỂ", search: "Dưỡng thể" },
            { id: "perfume", label: "NƯỚC HOA", category: "Nước Hoa" },
            { id: "deodorant", label: "KHỬ MÙI CƠ THỂ", search: "Khử mùi" },
            { id: "intimate-care", label: "CHĂM SÓC VÙNG KÍN", category: "Chăm Sóc Cá Nhân", subcategory: "Dưỡng Vùng Kín" },
        ],
    },
    {
        id: "hair-care",
        label: "CHĂM SÓC TÓC",
        category: "Chăm Sóc Tóc Và Da Đầu",
        mascot: "/category-mascots/hair-care.png",
        mascotSide: "right",
        tabs: [
            allProductsTab,
            { id: "shampoo-conditioner", label: "DẦU GỘI - DẦU XẢ", search: "Dầu" },
            { id: "scalp-exfoliator", label: "TẨY TẾ BÀO CHẾT DA ĐẦU", search: "Tẩy tế bào chết da đầu" },
            { id: "hair-treatment", label: "DƯỠNG TÓC - Ủ TÓC", search: "Dưỡng tóc" },
            { id: "hair-color", label: "NHUỘM TÓC", search: "Nhuộm tóc" },
            { id: "hair-setting", label: "XỊT CỐ ĐỊNH TÓC", search: "Xịt cố định tóc" },
            { id: "hair-wax", label: "SÁP VUỐT TÓC", search: "Sáp vuốt tóc" },
        ],
    },
    {
        id: "beauty-tools",
        label: "PHỤ KIỆN LÀM ĐẸP",
        category: "Trang Điểm",
        mascot: "/category-mascots/beauty-tools.png",
        mascotSide: "left",
        tabs: [
            allProductsTab,
            { id: "beauty-accessories", label: "PHỤ KIỆN LÀM ĐẸP", category: null, search: "Phụ kiện" },
            { id: "makeup-accessories", label: "PHỤ KIỆN TRANG ĐIỂM", search: "Dụng cụ trang điểm" },
            { id: "hair-accessories", label: "PHỤ KIỆN TÓC", category: "Chăm Sóc Tóc Và Da Đầu", search: "Lược" },
            { id: "beauty-devices", label: "THIẾT BỊ LÀM ĐẸP", category: null, search: "Máy" },
        ],
    },
];

const PAGE_SIZE = 8;

export default function ComprehensiveCareSection() {
    const [activeGroupId, setActiveGroupId] = useState(careGroups[0].id);
    const [activeTabId, setActiveTabId] = useState("mask");
    const [page, setPage] = useState(1);
    const activeGroup = careGroups.find((group) => group.id === activeGroupId) ?? careGroups[0];
    const activeTab = activeGroup.tabs.find((tab) => tab.id === activeTabId) ?? allProductsTab;
    const productCategory = activeTab.category === null ? undefined : activeTab.category ?? activeGroup.category;
    const productsParams = new URLSearchParams({ page: "1" });
    if (productCategory) productsParams.set("category", productCategory);
    if (activeTab.subcategory) productsParams.set("subcategory", activeTab.subcategory);
    if (activeTab.search) productsParams.set("search", activeTab.search);

    const {
        data,
        isPending,
        isError,
        refetch,
    } = useQuery<ProductListResult>({
        queryKey: ["comprehensive-care-products", activeGroup.id, activeTab.id, page, "in-stock"],
        queryFn: () =>
            fetchProducts({
                page,
                limit: PAGE_SIZE,
                category: productCategory,
                subcategory: activeTab.subcategory,
                search: activeTab.search,
                inStock: true,
            }),
        staleTime: 5 * 60 * 1000,
    });

    const pageCount = Math.max(1, data?.pagination.pages ?? 1);
    const changeGroup = (group: CareGroup) => {
        setActiveGroupId(group.id);
        setActiveTabId(allProductsTab.id);
        setPage(1);
    };
    const changeTab = (tab: ProductFilter) => {
        setActiveTabId(tab.id);
        setPage(1);
    };

    return (
        <section className="comprehensive-care-section" aria-labelledby="comprehensive-care-title">
            <header className="comprehensive-care-heading">
                <h2 id="comprehensive-care-title">CHĂM SÓC TOÀN DIỆN</h2>
                <Link className="comprehensive-care-view-all" href={`/products?${productsParams.toString()}`}>
                    Xem tất cả
                </Link>
            </header>

            <div className="comprehensive-care-layout">
                <nav className="comprehensive-care-groups" aria-label="Danh mục chăm sóc">
                    <h3 className="comprehensive-care-groups-title">DANH MỤC SẢN PHẨM</h3>
                    {careGroups.map((group) => (
                        <button
                            key={group.id}
                            type="button"
                            className={`comprehensive-care-group comprehensive-care-group--${group.id} has-mascot-${group.mascotSide}${group.id === activeGroup.id ? " is-active" : ""}`}
                            aria-pressed={group.id === activeGroup.id}
                            onClick={() => changeGroup(group)}>
                            <Image className="comprehensive-care-group-mascot" src={group.mascot} alt="" width={96} height={96} />
                            <span>{group.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="comprehensive-care-main">
                    <nav className={`comprehensive-care-tabs${activeGroup.id === "makeup" ? " comprehensive-care-tabs--single-row" : ""}`} aria-label={`Lọc ${activeGroup.label}`}>
                        {activeGroup.tabs.filter((tab) => tab.id !== allProductsTab.id).map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                className={`comprehensive-care-tab${tab.id === activeTab.id ? " is-active" : ""}`}
                                aria-pressed={tab.id === activeTab.id}
                                onClick={() => changeTab(tab)}>
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <div className="comprehensive-care-product-stage" aria-busy={isPending}>
                        <button
                            type="button"
                            className="comprehensive-care-arrow home-carousel-arrow home-carousel-arrow--prev is-prev"
                            aria-label="Xem trang sản phẩm trước"
                            disabled={page <= 1 || isPending}
                            onClick={() => setPage((current) => Math.max(1, current - 1))}>
                            ‹
                        </button>

                        {isError ? (
                            <div className="comprehensive-care-message">
                                <p>Không tải được sản phẩm lúc này.</p>
                                <button type="button" onClick={() => void refetch()}>Thử lại</button>
                            </div>
                        ) : isPending ? (
                            <div className="comprehensive-care-products" aria-label="Đang tải sản phẩm">
                                {Array.from({ length: PAGE_SIZE }, (_, index) => (
                                    <div className="comprehensive-care-skeleton" key={index} />
                                ))}
                            </div>
                        ) : data?.items.length ? (
                            <div className="comprehensive-care-products">
                                {data.items.map((product, index) => (
                                    <ProductCard
                                        key={`${product._id || product.id || product.name}-${index}`}
                                        item={product}
                                        realDataOnly
                                        showOfficialBadge
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="comprehensive-care-message">
                                <p>Chưa có sản phẩm trong danh mục này.</p>
                            </div>
                        )}

                        <button
                            type="button"
                            className="comprehensive-care-arrow home-carousel-arrow home-carousel-arrow--next is-next"
                            aria-label="Xem trang sản phẩm tiếp theo"
                            disabled={page >= pageCount || isPending}
                            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>
                            ›
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
