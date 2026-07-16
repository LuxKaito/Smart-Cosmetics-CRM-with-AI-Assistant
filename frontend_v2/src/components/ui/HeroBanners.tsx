"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

const mainBanners = [
    { image: "/banner/banner1.png", label: "LuxBerry chi nhánh mới", href: "/he-thong-cua-hang" },
    { image: "/banner/banner2.png", label: "Ưu đãi mỹ phẩm LuxBerry", href: "/products" },
    { image: "/banner/banner3.png", label: "Giải pháp chăm da MD Care", href: "/products?search=MD%20Care" },
    { image: "/banner/banner4.png", label: "Mỹ phẩm nổi bật LuxBerry", href: "/products" },
];

const sideBanners = [
    { image: "/banner/banner_sm1.png", label: "Voucher giảm đến 8%", href: "/account/vouchers" },
    { image: "/banner/banner_sm2.png", label: "Khắc tên miễn phí tại LuxBerry", href: "/products" },
];

export default function HeroBanners() {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setActiveIndex((current) => (current + 1) % mainBanners.length);
        }, 5000);
        return () => window.clearInterval(interval);
    }, []);

    const showPrevious = () => {
        setActiveIndex((current) => (current - 1 + mainBanners.length) % mainBanners.length);
    };

    const showNext = () => {
        setActiveIndex((current) => (current + 1) % mainBanners.length);
    };

    return (
        <div className="hero-banners">
            <section className="hero-carousel" aria-label="Khuyến mãi nổi bật">
                <div
                    className="hero-carousel-track"
                    style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
                    {mainBanners.map((banner, index) => (
                        <Link
                            key={banner.image}
                            href={banner.href}
                            className="hero-carousel-slide"
                            aria-hidden={activeIndex !== index}
                            tabIndex={activeIndex === index ? 0 : -1}>
                            <Image
                                src={banner.image}
                                alt={banner.label}
                                fill
                                priority={index === 0}
                                sizes="(max-width: 960px) 100vw, 76vw"
                            />
                        </Link>
                    ))}
                </div>

                <button
                    type="button"
                    className="hero-carousel-arrow is-left"
                    onClick={showPrevious}
                    aria-label="Banner trước">
                    <ChevronLeft size={20} />
                </button>
                <button
                    type="button"
                    className="hero-carousel-arrow is-right"
                    onClick={showNext}
                    aria-label="Banner tiếp theo">
                    <ChevronRight size={20} />
                </button>

                <div className="hero-carousel-dots" aria-label="Chọn banner">
                    {mainBanners.map((banner, index) => (
                        <button
                            key={banner.image}
                            type="button"
                            className={index === activeIndex ? "is-active" : ""}
                            onClick={() => setActiveIndex(index)}
                            aria-label={`Hiển thị banner ${index + 1}`}
                            aria-current={index === activeIndex}
                        />
                    ))}
                </div>
            </section>

            <aside className="hero-side-banners" aria-label="Ưu đãi nhanh">
                {sideBanners.map((banner) => (
                    <Link key={banner.image} href={banner.href} className="hero-side-banner">
                        <Image src={banner.image} alt={banner.label} fill sizes="(max-width: 960px) 50vw, 24vw" />
                    </Link>
                ))}
            </aside>
        </div>
    );
}
