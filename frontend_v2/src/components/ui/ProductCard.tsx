"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
    getDiscountPercent,
    getOriginalPrice,
    getSalePrice,
} from "../../lib/pricing";
import type { Product } from "../../types/product";
import { useAuthStore } from "../../stores/authStore";
import {
    removeFavoriteProduct,
    saveFavoriteProduct,
} from "../../services/favoriteService";

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

function extractVolume(name = "") {
    const matched = name.match(/\d+\s?(ml|g)|spf\s?\d+\+?/i);
    return matched ? matched[0].toUpperCase() : "Nổi bật";
}

function compactHeadline(name = "") {
    return name.split(" ").slice(0, 7).join(" ").toUpperCase();
}

function resolvePrice(product: Product) {
    const salePrice = getSalePrice(product);
    const originalPrice = getOriginalPrice(product, salePrice);
    return { salePrice, originalPrice };
}

function resolveDiscountPercent(product: Product) {
    return getDiscountPercent(product);
}

export function enrichProducts(products: Product[], kicker: string): Product[] {
    if (!Array.isArray(products) || products.length === 0) {
        return [];
    }

    return products.map((item, index) => {
        const seed = uiSeeds[index % uiSeeds.length];
        const discount = resolveDiscountPercent(item);

        return {
            ...item,
            discount,
            rating: item.rating ?? seed.rating,
            reviews: item.reviews ?? seed.reviews,
            monthly: item.monthly ?? seed.monthly,
            soldPercent: item.soldPercent ?? seed.soldPercent,
            visualKicker: item.visualKicker ?? kicker,
            visualHeadline: item.visualHeadline ?? compactHeadline(item.name),
            visualVolume: item.visualVolume ?? extractVolume(item.name),
        };
    });
}

function formatPrice(value: string | number | undefined | null) {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return `${String(value)} đ`;
    }

    return `${new Intl.NumberFormat("vi-VN").format(numeric)} đ`;
}

export default function ProductCard({ item }: { item: Product }) {
    const productId = item._id || item.id;
    const user = useAuthStore((state) => state.user);
    const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false);
    const isFavorite = Boolean(
        productId && user?.savedProductIds?.includes(productId),
    );
    const imageUrl =
        item.image ||
        item.image_url ||
        item.imageUrl ||
        item.thumbnail ||
        item.thumb ||
        (Array.isArray(item.images) ? item.images[0] : undefined);

    const { salePrice, originalPrice } = resolvePrice(item);
    const discountPercent = resolveDiscountPercent(item);
    const hasDiscount = discountPercent > 0;

    const handleFavoriteClick = async () => {
        if (!productId) return;
        if (!user) {
            toast.error("Vui lòng đăng nhập để lưu sản phẩm yêu thích.");
            return;
        }

        setIsUpdatingFavorite(true);
        try {
            if (isFavorite) {
                await removeFavoriteProduct(productId);
                toast.success("Đã xóa sản phẩm khỏi danh sách yêu thích.");
            } else {
                await saveFavoriteProduct(productId);
                toast.success("Đã lưu sản phẩm yêu thích.");
            }
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Không thể cập nhật sản phẩm yêu thích.",
            );
        } finally {
            setIsUpdatingFavorite(false);
        }
    };

    return (
        <article className="product-card">
            <div className="product-top-row">
                <div className="official-badge">
                    <span className="official-brand">{item.brand || "TK Beauty"}</span>
                    <span className="official-text">Chính hãng</span>
                </div>
                <div className="product-top-actions">
                    <button
                        type="button"
                        className={`favorite-button${isFavorite ? " is-active" : ""}`}
                        onClick={handleFavoriteClick}
                        disabled={isUpdatingFavorite || !productId}
                        aria-label={
                            isFavorite
                                ? "Xóa khỏi sản phẩm yêu thích"
                                : "Lưu sản phẩm yêu thích"
                        }
                        title={
                            isFavorite
                                ? "Xóa khỏi sản phẩm yêu thích"
                                : "Lưu sản phẩm yêu thích"
                        }>
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 20.6 10.55 19.3C5.4 14.75 2 11.65 2 7.85 2 4.75 4.4 2.4 7.5 2.4c1.75 0 3.45.8 4.5 2.05A5.94 5.94 0 0 1 16.5 2.4c3.1 0 5.5 2.35 5.5 5.45 0 3.8-3.4 6.9-8.55 11.45L12 20.6Z" />
                        </svg>
                    </button>
                    {hasDiscount ? (
                        <span className="discount-badge">-{discountPercent}%</span>
                    ) : null}
                </div>
            </div>

            <Link href={`/products/${productId}`} className="product-link">
                <div className="product-hero">
                    <div
                        className="thumb"
                        style={
                            imageUrl
                                ? { backgroundImage: `url(${imageUrl})` }
                                : undefined
                        }
                    />
                    <div className="hero-copy">
                        <p className="hero-kicker">{item.visualKicker}</p>
                        <h4>{item.visualHeadline}</h4>
                        <p className="hero-volume">{item.visualVolume}</p>
                    </div>
                </div>
            </Link>

            <div className="price-row">
                <strong className="main-price">{formatPrice(salePrice)}</strong>
                {hasDiscount ? (
                    <span className="old-price">{formatPrice(originalPrice)}</span>
                ) : null}
            </div>

            <p className="brand">{item.brand || "TK Beauty"}</p>
            <h3>
                <Link href={`/products/${productId}`}>{item.name}</Link>
            </h3>

            <div className="product-meta-row">
                <span className="rating-pill">{item.rating} ★</span>
                <span className="review-count">({item.reviews})</span>
                <span className="monthly-pay">Đã bán {item.monthly}</span>
            </div>

            <div className="sold-row">
                <div className="sold-bar">
                    <span style={{ width: `${item.soldPercent}%` }} />
                </div>
                <strong>{item.soldPercent}%</strong>
            </div>
        </article>
    );
}
