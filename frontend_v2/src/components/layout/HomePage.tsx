"use client";

import { useQuery } from "@tanstack/react-query";
import { useHomeData } from "../../hooks/useHomeData";
import { fetchHomeProducts } from "../../services/productService";
import { fetchPublicVouchers } from "../../services/voucherService";
import type { Product } from "../../types/product";
import Header from "./Header";
import Footer from "./Footer";
import HeroBanners from "../ui/HeroBanners";
import CategoryIcons from "../ui/CategoryIcons";
import CouponRow from "../ui/CouponRow";
import FlashDeals from "../ui/FlashDeals";
import BrandStrip from "../ui/BrandStrip";
import SuggestedSection from "../ui/SuggestedSection";
import EditorialSection from "../editorial/EditorialSection";
import {
    beautyReviewArticles,
    luxberryNewsArticles,
} from "../../data/editorialContent";

const serviceItems: Array<{ title: string; text: string }> = [];

const cleanFeatureIcons = [
    {
        label: "Chăm sóc da",
        image: "/category-icons/Ch%C4%83m%20s%C3%B3c%20da.png",
        href: "/products?category=Ch%C4%83m%20S%C3%B3c%20Da%20M%E1%BA%B7t&page=1",
    },
    {
        label: "Trang điểm",
        image: "/category-icons/Trang%20%C4%91i%E1%BB%83m.png",
        href: "/products?category=Trang%20%C4%90i%E1%BB%83m&page=1",
    },
    {
        label: "Dưỡng trắng",
        image: "/category-icons/D%C6%B0%E1%BB%A1ng%20tr%E1%BA%AFng.png",
        href: "/products?category=Ch%C4%83m%20S%C3%B3c%20Da%20M%E1%BA%B7t&subcategory=D%C6%B0%E1%BB%A1ng%20Tr%E1%BA%AFng&page=1",
    },
    {
        label: "Dưỡng ẩm",
        image: "/category-icons/D%C6%B0%E1%BB%A1ng%20%E1%BA%A9m.png",
        href: "/products?category=Ch%C4%83m%20S%C3%B3c%20Da%20M%E1%BA%B7t&subcategory=D%C6%B0%E1%BB%A1ng%20%E1%BA%A8m&page=1",
    },
    {
        label: "Son môi",
        image: "/category-icons/Son%20m%C3%B4i.png",
        href: "/products?category=Trang%20%C4%90i%E1%BB%83m&subcategory=Son%20M%C3%B4i&page=1",
    },
    {
        label: "Chăm sóc tóc",
        image: "/category-icons/Ch%C4%83m%20s%C3%B3c%20t%C3%B3c.png",
        href: "/products?category=Ch%C4%83m%20S%C3%B3c%20T%C3%B3c%20V%C3%A0%20Da%20%C4%90%E1%BA%A7u&page=1",
    },
    {
        label: "Bộ làm đẹp",
        image: "/category-icons/B%E1%BB%99%20l%C3%A0m%20%C4%91%E1%BA%B9p.png",
        highlight: true,
        href: "/products?search=B%E1%BB%99%20l%C3%A0m%20%C4%91%E1%BA%B9p&page=1",
    },
    {
        label: "Tẩy tế bào chết",
        image: "/category-icons/T%E1%BA%A9y%20t%E1%BA%BF%20b%C3%A0o%20ch%E1%BA%BFt.png",
        href: "/products?search=T%E1%BA%A9y%20t%E1%BA%BF%20b%C3%A0o%20ch%E1%BA%BFt&page=1",
    },
];

export default function HomePage() {
    const {
        featureIcons,
        flashDeals,
        brandShowcase,
        bestSellers,
        topSearches,
        homeProducts,
    } = useHomeData();

    const { data: remoteProducts = [] } = useQuery<Product[]>({
        queryKey: ["home-products"],
        queryFn: () => fetchHomeProducts(36),
    });
    const { data: publicVouchers = [] } = useQuery({
        queryKey: ["public-vouchers"],
        queryFn: () => fetchPublicVouchers(12),
    });

    const flashDealsData =
        remoteProducts.length > 0 ? remoteProducts.slice(0, 10) : flashDeals;
    const bestSellerData =
        remoteProducts.length > 0 ? remoteProducts.slice(10, 18) : bestSellers;
    const topSearchData =
        remoteProducts.length > 0 ? remoteProducts.slice(18, 26) : topSearches;

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

                <section className="container">
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

                <section
                    className="container promo-wide"
                    aria-label="Khuyến mãi lớn">
                    <div className="promo-wide-content">
                        <span>Beauty Week</span>
                        <h2>Ưu đãi lớn đến 60%</h2>
                        <p>
                            Flash sale theo khung giờ, cập nhật ưu đãi mới mỗi
                            ngày.
                        </p>
                    </div>
                </section>

                <section className="container">
                    <FlashDeals deals={flashDealsData} />
                </section>

                <section className="container">
                    <BrandStrip brandShowcase={brandShowcase} />
                </section>

                <section className="container">
                    <FlashDeals
                        deals={bestSellerData}
                        title="Bán chạy"
                        showTimer={false}
                        variant="plain"
                    />
                </section>

                <section className="container">
                    <FlashDeals
                        deals={topSearchData}
                        title="Top tìm kiếm"
                        showTimer={false}
                        variant="plain"
                    />
                </section>

                <section className="container">
                    <SuggestedSection
                        title="Gợi ý cho bạn"
                        products={homeProducts}
                    />
                </section>

                <section className="container">
                    <EditorialSection
                        title="Review mỹ phẩm"
                        description="Gợi ý sản phẩm và routine phù hợp để bạn mua sắm dễ dàng hơn."
                        articles={beautyReviewArticles}
                        viewAllHref="/review-my-pham"
                        articleBaseHref="/review-my-pham"
                    />
                </section>

                <section className="container">
                    <EditorialSection
                        title="Tin tức LuxBerry"
                        description="Cập nhật ưu đãi, chính sách và thông tin mới từ LuxBerry Beauty."
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
