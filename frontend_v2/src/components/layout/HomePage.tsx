"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useHomeData } from "../../hooks/useHomeData";
import { fetchHomeProducts, fetchProducts } from "../../services/productService";
import { fetchPublicVouchers } from "../../services/voucherService";
import type { Product } from "../../types/product";
import Header from "./Header";
import Footer from "./Footer";
import HeroBanners from "../ui/HeroBanners";
import CategoryIcons from "../ui/CategoryIcons";
import CouponRow from "../ui/CouponRow";
import FlashDeals from "../ui/FlashDeals";
import HotProductsSection from "../ui/HotProductsSection";
import BestSellerSection from "../ui/BestSellerSection";
import BrandStrip from "../ui/BrandStrip";
import ComprehensiveCareSection from "../ui/ComprehensiveCareSection";
import EditorialSection from "../editorial/EditorialSection";
import {
    beautyReviewArticles,
    luxberryNewsArticles,
} from "../../data/editorialContent";

const serviceItems: Array<{ title: string; text: string }> = [];

function productsHref(filters: {
    category?: string;
    subcategory?: string;
    search?: string;
}) {
    const params = new URLSearchParams({ page: "1" });
    Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
    });
    return `/products?${params.toString()}`;
}

const cleanFeatureIcons = [
    {
        label: "Chăm sóc da",
        image: "/category-icons/Ch%C4%83m%20s%C3%B3c%20da.png",
        href: productsHref({ category: "Chăm Sóc Da Mặt" }),
    },
    {
        label: "Trang điểm",
        image: "/category-icons/Trang%20%C4%91i%E1%BB%83m.png",
        href: productsHref({ category: "Trang Điểm" }),
    },
    {
        label: "Dưỡng trắng",
        image: "/category-icons/D%C6%B0%E1%BB%A1ng%20tr%E1%BA%AFng.png",
        href: productsHref({
            category: "Chăm Sóc Da Mặt",
            search: "Dưỡng trắng",
        }),
    },
    {
        label: "Dưỡng ẩm",
        image: "/category-icons/D%C6%B0%E1%BB%A1ng%20%E1%BA%A9m.png",
        href: productsHref({
            category: "Chăm Sóc Da Mặt",
            search: "Dưỡng ẩm",
        }),
    },
    {
        label: "Son môi",
        image: "/category-icons/Son%20m%C3%B4i.png",
        href: productsHref({ category: "Trang Điểm", search: "Son" }),
    },
    {
        label: "Chăm sóc tóc",
        image: "/category-icons/Ch%C4%83m%20s%C3%B3c%20t%C3%B3c.png",
        href: productsHref({ category: "Chăm Sóc Tóc Và Da Đầu" }),
    },
    {
        label: "Bộ làm đẹp",
        image: "/category-icons/B%E1%BB%99%20l%C3%A0m%20%C4%91%E1%BA%B9p.png",
        highlight: true,
        href: productsHref({ category: "Trang Điểm", search: "Bộ" }),
    },
    {
        label: "Tẩy tế bào chết",
        image: "/category-icons/T%E1%BA%A9y%20t%E1%BA%BF%20b%C3%A0o%20ch%E1%BA%BFt.png",
        href: productsHref({
            category: "Chăm Sóc Da Mặt",
            subcategory: "Tẩy Tế Bào Chết Da Mặt",
        }),
    },
];

export default function HomePage() {
    const {
        featureIcons,
        flashDeals,
        brandShowcase,
        bestSellers,
    } = useHomeData();

    const { data: remoteProducts = [] } = useQuery<Product[]>({
        queryKey: ["home-products"],
        queryFn: () => fetchHomeProducts(36),
    });
    const { data: hotProducts = [] } = useQuery<Product[]>({
        queryKey: ["home-hot-products"],
        queryFn: () => fetchHomeProducts(100),
    });
    const { data: newArrivalResult } = useQuery({
        queryKey: ["home-new-arrivals"],
        queryFn: () => fetchProducts({ page: 1, limit: 10, sort: "-createdAt" }),
    });
    const { data: publicVouchers = [] } = useQuery({
        queryKey: ["public-vouchers"],
        queryFn: () => fetchPublicVouchers(12),
    });

    const flashDealsData =
        remoteProducts.length > 0 ? remoteProducts.slice(0, 10) : flashDeals;
    const bestSellerData =
        remoteProducts.length > 0 ? remoteProducts.slice(10, 18) : bestSellers;
    return (
        <div className="page-shell beauty-storefront">
            <Header />

            <main className="main-content">
                <section className="hero-layout hero-layout--full container">
                    <HeroBanners />
                </section>

                <section
                    className="container service-strip"
                    aria-label="Cam kết dịch vụ">
                    {serviceItems.map((item) => (
                        <article key={item.title}>
                            <strong>{item.title}</strong>
                            <span>{item.text}</span>
                        </article>
                    ))}
                </section>

                <section className="container category-icons-container">
                    <CategoryIcons
                        items={
                            cleanFeatureIcons.length
                                ? cleanFeatureIcons
                                : featureIcons
                        }
                    />
                </section>

                <section className="container">
                    <CouponRow coupons={publicVouchers} />
                </section>

                <section className="container flash-sale-cat-section" aria-hidden="true">
                    <div className="flash-sale-cat-stage">
                        <span className="flash-sale-sparkle flash-sale-sparkle--one">✦</span>
                        <span className="flash-sale-sparkle flash-sale-sparkle--two">✧</span>
                        <span className="flash-sale-sparkle flash-sale-sparkle--three">✦</span>
                        <span className="flash-sale-sparkle flash-sale-sparkle--four">✧</span>
                        <Image
                            src="/mascots/flash-sale-cat.png"
                            alt=""
                            width={1312}
                            height={1199}
                            sizes="(max-width: 480px) 160px, (max-width: 980px) 200px, 230px"
                            className="flash-sale-cat-image"
                        />
                    </div>
                </section>

                <section className="container">
                    <FlashDeals deals={flashDealsData} title="FLASH SALE" />
                </section>

                <section className="container hot-products-container">
                    <HotProductsSection products={hotProducts} />
                </section>

                <section className="container">
                    <FlashDeals
                        deals={newArrivalResult?.items ?? []}
                        title="Sản phẩm mới về"
                        showTimer={false}
                        variant="plain"
                    />
                </section>

                <section className="container">
                    <BestSellerSection products={bestSellerData} />
                </section>

                <section className="container">
                    <BrandStrip brandShowcase={brandShowcase} />
                </section>

                <section className="container">
                    <ComprehensiveCareSection />
                </section>

                <section className="container">
                    <EditorialSection
                        title="Review mỹ phẩm"
                        articles={beautyReviewArticles}
                        viewAllHref="/review-my-pham"
                        articleBaseHref="/review-my-pham"
                    />
                </section>

                <section className="container">
                    <EditorialSection
                        title="Tin tức LuxBerry"
                        articles={luxberryNewsArticles}
                        viewAllHref="/tin-tuc-luxberry"
                        articleBaseHref="/tin-tuc-luxberry"
                    />
                </section>
            </main>

            <Footer />
        </div>
    );
}
