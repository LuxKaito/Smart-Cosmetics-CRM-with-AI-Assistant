"use client";

import { useQuery } from "@tanstack/react-query";
import { useHomeData } from "../../hooks/useHomeData";
import { fetchHomeProducts } from "../../services/productService";
import type { Product } from "../../types/product";
import Header from "./Header";
import Footer from "./Footer";
import CategorySidebar from "../ui/CategorySidebar";
import HeroBanners from "../ui/HeroBanners";
import CategoryIcons from "../ui/CategoryIcons";
import CouponRow from "../ui/CouponRow";
import FlashDeals from "../ui/FlashDeals";
import BrandStrip from "../ui/BrandStrip";
import NewsSection from "../ui/NewsSection";
import FloatingActions from "../ui/FloatingActions";
import SuggestedSection from "../ui/SuggestedSection";

const serviceItems: Array<{ title: string; text: string }> = [];

const cleanFeatureIcons = [
    {
        label: "Chăm sóc da",
        image: "/category-icons/Ch%C4%83m%20s%C3%B3c%20da.png",
    },
    {
        label: "Trang điểm",
        image: "/category-icons/Trang%20%C4%91i%E1%BB%83m.png",
    },
    {
        label: "Dưỡng trắng",
        image: "/category-icons/D%C6%B0%E1%BB%A1ng%20tr%E1%BA%AFng.png",
    },
    {
        label: "Dưỡng ẩm",
        image: "/category-icons/D%C6%B0%E1%BB%A1ng%20%E1%BA%A9m.png",
    },
    { label: "Son môi", image: "/category-icons/Son%20m%C3%B4i.png" },
    {
        label: "Chăm sóc tóc",
        image: "/category-icons/Ch%C4%83m%20s%C3%B3c%20t%C3%B3c.png",
    },
    {
        label: "Bộ làm đẹp",
        image: "/category-icons/B%E1%BB%99%20l%C3%A0m%20%C4%91%E1%BA%B9p.png",
        highlight: true,
    },
    {
        label: "Tẩy tế bào chết",
        image: "/category-icons/T%E1%BA%A9y%20t%E1%BA%BF%20b%C3%A0o%20ch%E1%BA%BFt.png",
    },
];

const cleanCoupons = [
    { code: "BEAUTY10", text: "Giảm 10% cho đơn từ 500k" },
    { code: "SKIN15", text: "Giảm 15% cho routine chăm sóc da" },
    { code: "FREESHIP", text: "Miễn phí vận chuyển cho đơn từ 500k" },
    { code: "NEW99K", text: "Giảm 99k cho khách hàng mới" },
];

const cleanNewsList = [
    {
        title: "Cách xây routine phục hồi da trong 7 ngày",
        summary:
            "Gợi ý các bước làm sạch, cấp ẩm và chống nắng cho làn da yếu.",
    },
    {
        title: "Chọn kem chống nắng theo loại da",
        summary: "Da dầu, da khô hay da nhạy cảm đều cần công thức khác nhau.",
    },
    {
        title: "Makeup tự nhiên cho ngày bận rộn",
        summary: "Những món cơ bản giúp lớp nền mỏng nhẹ và bền màu.",
    },
    {
        title: "Dấu hiệu da cần đổi sản phẩm",
        summary: "Nhận biết kích ứng, bí da và cách chuyển routine an toàn.",
    },
];

export default function HomePage() {
    const {
        featureIcons,
        coupons,
        flashDeals,
        brandShowcase,
        newsList,
        bestSellers,
        topSearches,
        homeProducts,
    } = useHomeData();

    const { data: remoteProducts = [] } = useQuery<Product[]>({
        queryKey: ["home-products"],
        queryFn: () => fetchHomeProducts(36),
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
                <section className="hero-layout container">
                    <CategorySidebar />
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
                    <CouponRow
                        coupons={cleanCoupons.length ? cleanCoupons : coupons}
                    />
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
                    <NewsSection
                        news={cleanNewsList.length ? cleanNewsList : newsList}
                    />
                </section>
            </main>

            <Footer />
            <FloatingActions />
        </div>
    );
}
