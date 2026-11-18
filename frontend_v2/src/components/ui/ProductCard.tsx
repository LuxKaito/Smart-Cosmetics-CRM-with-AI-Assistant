"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import {
    getDiscountPercent,
    getOriginalPrice,
    getSalePrice,
} from "../../lib/pricing";
import type { Product } from "../../types/product";
import { useAuthStore } from "../../stores/authStore";
import { useCartStore } from "../../stores/cartStore";
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

function extractVolume(name = "", fallback = "Nổi bật") {
    const matched = name.match(/\d+\s?(ml|g)|spf\s?\d+\+?/i);
    return matched ? matched[0].toUpperCase() : fallback;
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

export default function ProductCard({
    item,
    realDataOnly = false,
    showOfficialBadge = false,
}: {
    item: Product;
    realDataOnly?: boolean;
    showOfficialBadge?: boolean;
}) {
    const productId = item._id || item.id;
    const user = useAuthStore((state) => state.user);
    const addCartItem = useCartStore((state) => state.addItem);
    const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
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
    const rating = Number(item.rating);
    const reviewCount = Number(item.review_count);
    const soldCount = Number(item.soldCount);
    const hasSoldCount =
        item.soldCount !== undefined &&
        item.soldCount !== null &&
        Number.isFinite(soldCount);
    const hasStockData =
        item.stock !== undefined &&
        item.stock !== null &&
        Number.isFinite(Number(item.stock));
    const isSoldOut = hasStockData && Number(item.stock) <= 0;
    const soldPercent = Number(item.soldPercent);

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

    const handleAddToCart = async () => {
        if (!productId || isSoldOut || isAddingToCart) return;

        setIsAddingToCart(true);
        try {
            await addCartItem({
                productId,
                name: item.name,
                price: salePrice,
                originalPrice: hasDiscount ? originalPrice : undefined,
                image: imageUrl,
                quantity: 1,
                brand: item.brand,
                stock: hasStockData ? Number(item.stock) : undefined,
            });
            toast.success("Đã thêm sản phẩm vào giỏ hàng.");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Không thể thêm sản phẩm vào giỏ hàng.",
            );
        } finally {
            setIsAddingToCart(false);
        }
    };

    return (
        <article
            className={`product-card product-card--catalog${realDataOnly ? " product-card--real-data" : ""}${isSoldOut ? " product-card--sold-out" : ""}`}>
            <div className="product-top-row">
                {!realDataOnly || showOfficialBadge ? (
                    <div className="official-badge">
                        <span className="official-brand">{item.brand || "TK Beauty"}</span>
                        <span className="official-text">Chính hãng</span>
                    </div>
                ) : null}
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
                </div>
            </div>

            <Link
                href={`/products/${productId}`}
                className="product-link"
                aria-label={item.name}>
                <div className={`product-hero${realDataOnly ? " product-hero--real-data" : ""}`}>
                    <div
                        className="thumb"
                        style={
                            imageUrl && !realDataOnly
                                ? { backgroundImage: `url(${imageUrl})` }
                                : undefined
                        }>
                        {realDataOnly && imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt={item.name}
                                fill
                                sizes="(max-width: 480px) 90vw, 194px"
                                className="hot-product-image"
                                unoptimized
                            />
                        ) : null}
                    </div>
                    <div className="hero-copy">
                        <p className="hero-kicker">
                            {item.visualKicker || (realDataOnly ? "SẢN PHẨM NỔI BẬT" : "")}
                        </p>
                        <h4>
                            {item.visualHeadline ||
                                (realDataOnly ? compactHeadline(item.name) : "")}
                        </h4>
                        <p className="hero-volume">
                            {item.visualVolume ||
                                (realDataOnly
                                    ? item.volume || extractVolume(item.name, "")
                                    : "")}
                        </p>
                    </div>
                </div>
            </Link>

            {isSoldOut ? (
                <span className="product-stock-badge">Hết hàng</span>
            ) : null}
            <button
                type="button"
                className="product-buy-button"
                onClick={handleAddToCart}
                disabled={!productId || isSoldOut || isAddingToCart}
                aria-label={
                    isSoldOut ? `${item.name} hết hàng` : `Mua ngay ${item.name}`
                }>
                {isSoldOut
                    ? "Hết hàng"
                    : isAddingToCart
                      ? "Đang thêm…"
                      : "Mua ngay"}
            </button>

            {!realDataOnly || salePrice > 0 ? (
                <div className="price-row">
                    <strong className="main-price">{formatPrice(salePrice)}</strong>
                    {hasDiscount ? (
                        <span className="old-price">{formatPrice(originalPrice)}</span>
                    ) : null}
                    {hasDiscount ? (
                        <span className="discount-badge">-{discountPercent}%</span>
                    ) : null}
                    <span
                        className="free-shipping-badge"
                        aria-label="Ưu đãi miễn phí vận chuyển theo điều kiện đơn hàng"
                        title="Ưu đãi miễn phí vận chuyển theo điều kiện đơn hàng">
                        <svg viewBox="0 0 28 18" aria-hidden="true">
                            <path d="M1.5 3.5h15v10h-15zM16.5 7h5l4 4v2.5h-9z" />
                            <path d="M20 7v4h5M6 13.5a1.75 1.75 0 1 0 0 .1m12-.1a1.75 1.75 0 1 0 0 .1" />
                        </svg>
                    </span>
                </div>
            ) : null}

            {realDataOnly ? (
                item.brand ? <p className="brand">{item.brand}</p> : null
            ) : (
                <p className="brand">{item.brand || "TK Beauty"}</p>
            )}
            <h3>
                <Link href={`/products/${productId}`}>{item.name}</Link>
            </h3>

            <div className="product-card-bottom-info">
                {realDataOnly ? (
                    rating > 0 || reviewCount > 0 || hasSoldCount ? (
                        <div className="product-meta-row">
                            {rating > 0 ? (
                                <span className="rating-pill">{rating} ★</span>
                            ) : null}
                            {reviewCount > 0 ? (
                                <span className="review-count">({reviewCount})</span>
                            ) : null}
                            {hasSoldCount ? (
                                <span className="monthly-pay">
                                    Đã bán {soldCount.toLocaleString("vi-VN")}
                                </span>
                            ) : null}
                        </div>
                    ) : null
                ) : (
                    <div className="product-meta-row">
                        <span className="rating-pill">{item.rating} ★</span>
                        <span className="review-count">({item.reviews})</span>
                        <span className="monthly-pay">Đã bán {item.monthly}</span>
                    </div>
                )}

                {realDataOnly ? (
                    <div className="sold-row">
                        {Number.isFinite(soldPercent) && soldPercent > 0 ? (
                            <>
                                <div className="sold-bar">
                                    <span style={{ width: `${Math.min(soldPercent, 100)}%` }} />
                                </div>
                                <strong>{Math.min(soldPercent, 100)}%</strong>
                            </>
                        ) : (
                            <div className="sold-bar sold-bar--decorative" aria-hidden="true" />
                        )}
                    </div>
                ) : (
                    <div className="sold-row">
                        <div className="sold-bar">
                            <span style={{ width: `${item.soldPercent}%` }} />
                        </div>
                        <strong>{item.soldPercent}%</strong>
                    </div>
                )}
            </div>
        </article>
    );
}
