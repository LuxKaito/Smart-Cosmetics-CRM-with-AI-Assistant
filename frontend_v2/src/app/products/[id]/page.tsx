"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import {
    getDiscountPercent,
    getOriginalPrice,
    getSalePrice,
} from "../../../lib/pricing";
import { fetchProductById } from "../../../services/productService";
import { addReview, fetchReviews } from "../../../services/reviewService";
import { addCartItem } from "../../../services/cartService";
import { getCurrentUser } from "../../../utils/user";
import { getErrorMessage } from "../../../lib/errors";
import type { Product } from "../../../types/product";

interface ReviewItem {
    _id: string;
    userEmail: string;
    rating: number;
    comment?: string;
}

const formatCurrency = (value: number) => `${value.toLocaleString("vi-VN")} đ`;

const normalizeSearchText = (value: unknown) =>
    String(value ?? "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

const extractMetaFromDescription = (
    description: unknown,
    labels: string[],
): string => {
    const normalizedLabels = labels.map((label) => normalizeSearchText(label));
    const lines = String(description ?? "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    for (const line of lines) {
        const separator = line.indexOf(":");
        if (separator < 0) continue;

        const label = normalizeSearchText(line.slice(0, separator));
        const value = line.slice(separator + 1).trim();
        if (value && normalizedLabels.includes(label)) {
            return value;
        }
    }

    return "";
};

export default function ProductDetailPage() {
    const router = useRouter();
    const params = useParams<{ id?: string | string[] }>();
    const routeId = params?.id;
    const id = Array.isArray(routeId) ? routeId[0] : routeId || "";

    const [product, setProduct] = useState<Product | null>(null);
    const [reviews, setReviews] = useState<ReviewItem[]>([]);
    const [reviewForm, setReviewForm] = useState({ rating: "5", comment: "" });
    const [status, setStatus] = useState({ type: "", message: "" });
    const [isLoading, setIsLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState("");
    const [activeTab, setActiveTab] = useState("description");

    const images = useMemo(() => {
        if (!product) return [];
        if (Array.isArray(product.images) && product.images.length > 0) return product.images;
        if (product.image) return [product.image];
        return [];
    }, [product]);

    const salePrice = useMemo(
        () => getSalePrice(product || {}),
        [product],
    );

    const originalPrice = useMemo(() => {
        return getOriginalPrice(product || {}, salePrice);
    }, [product, salePrice]);

    const discountPercent = useMemo(() => {
        return getDiscountPercent(product || {}, salePrice, originalPrice);
    }, [product, originalPrice, salePrice]);

    const resolvedOrigin = useMemo(
        () =>
            String(product?.origin || "").trim() ||
            extractMetaFromDescription(product?.description, ["origin", "xuat xu"]) ||
            "Đang cập nhật",
        [product],
    );

    const resolvedVolume = useMemo(
        () =>
            String(product?.volume || "").trim() ||
            extractMetaFromDescription(product?.description, ["volume", "dung tich"]) ||
            "Đang cập nhật",
        [product],
    );

    useEffect(() => {
        if (!id) {
            setProduct(null);
            setReviews([]);
            setIsLoading(false);
            return;
        }

        let isMounted = true;
        const loadProduct = async () => {
            try {
                const data = await fetchProductById(id);
                if (!isMounted) return;

                setProduct(data);
                setActiveImage(
                    Array.isArray(data?.images) && data.images.length > 0
                        ? data.images[0]
                        : data?.image || "",
                );
            } catch {
                if (isMounted) setProduct(null);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        void loadProduct();
        void fetchReviews(id)
            .then((data) => {
                if (isMounted) setReviews(data as ReviewItem[]);
            })
            .catch(() => {
                if (isMounted) setReviews([]);
            });

        return () => {
            isMounted = false;
        };
    }, [id]);

    const handleAddToCart = async () => {
        if (!product || !product._id) return;

        try {
            await addCartItem(product._id, quantity);
            setStatus({
                type: "success",
                message: "Đã thêm sản phẩm vào giỏ hàng.",
            });
        } catch (error) {
            setStatus({
                type: "error",
                message: getErrorMessage(error, "Không thể thêm vào giỏ hàng."),
            });
        }
    };

    const handleBuyNow = async () => {
        if (!product || !product._id) return;

        const user = getCurrentUser();
        if (!user?._id && !user?.email) {
            router.push("/login?redirect=/checkout");
            return;
        }

        try {
            await addCartItem(product._id, quantity);
            router.push("/checkout");
        } catch (error) {
            setStatus({
                type: "error",
                message: getErrorMessage(error, "Không thể mua ngay lúc này."),
            });
        }
    };

    const handleReview = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!id) {
            setStatus({ type: "error", message: "Không tìm thấy mã sản phẩm." });
            return;
        }

        const user = getCurrentUser();
        if (!user?.email) {
            setStatus({
                type: "error",
                message: "Vui lòng đăng nhập để đánh giá.",
            });
            return;
        }

        try {
            await addReview({
                productId: id,
                userEmail: user.email,
                rating: Number(reviewForm.rating),
                comment: reviewForm.comment,
            });
            setStatus({ type: "success", message: "Đánh giá thành công." });
            setReviews((await fetchReviews(id)) as ReviewItem[]);
            setReviewForm({ rating: "5", comment: "" });
        } catch (error) {
            setStatus({
                type: "error",
                message: getErrorMessage(error, "Đánh giá thất bại."),
            });
        }
    };

    if (!product && !isLoading) {
        return (
            <div className="page-shell">
                <Header />
                <main className="auth-page">
                    <p>Không tìm thấy sản phẩm.</p>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="page-shell">
            <Header />
            <main className="main-content container product-detail-page">
                <section className="product-detail">
                    <div className="product-detail-media">
                        {isLoading ? (
                            <div className="product-media-skeleton" />
                        ) : activeImage ? (
                            <Image
                                src={activeImage}
                                alt={product?.name || ""}
                                width={680}
                                height={680}
                                className="h-auto w-full rounded-[18px] object-cover"
                            />
                        ) : (
                            <div className="product-image-fallback" />
                        )}

                        {images.length > 1 ? (
                            <div className="product-thumb-row">
                                {images.map((src: string) => (
                                    <button
                                        key={src}
                                        type="button"
                                        className={`product-thumb${activeImage === src ? " is-active" : ""}`}
                                        onClick={() => setActiveImage(src)}
                                        style={{ backgroundImage: `url(${src})` }}
                                        aria-label={product?.name}
                                    />
                                ))}
                            </div>
                        ) : null}
                    </div>

                    <div className="product-detail-info">
                        <p className="section-kicker">{product?.brand || "TK Beauty"}</p>
                        <h1>{product?.name || ""}</h1>

                        <p className="product-detail-desc">
                            {product?.description
                                ? product.description.split("\n")[0]
                                : "Sản phẩm chính hãng, phù hợp cho routine chăm sóc da hằng ngày."}
                        </p>

                        <div className="mt-4 flex items-end gap-3">
                            <strong className="text-3xl font-extrabold text-[#f05b02]">
                                {formatCurrency(salePrice)}
                            </strong>
                            {originalPrice ? (
                                <span className="pb-1 text-lg text-[#8a8090] line-through">
                                    {formatCurrency(originalPrice)}
                                </span>
                            ) : null}
                            {discountPercent > 0 ? (
                                <span className="rounded-full bg-[#fff2f7] px-3 py-1 text-sm font-semibold text-[#d73f74]">
                                    -{discountPercent}%
                                </span>
                            ) : null}
                        </div>

                        <div className="product-detail-meta mt-4">
                            <span>Thương hiệu: {product?.brand || "Đang cập nhật"}</span>
                            <span>Xuất xứ: {resolvedOrigin}</span>
                            <span>Dung tích: {resolvedVolume}</span>
                            <span>Loại da: {product?.skin_type || "Đang cập nhật"}</span>
                            <span>
                                Danh mục: {product?.categories?.[0] || product?.category || "Đang cập nhật"}
                            </span>
                            <span>Số lượng tồn: {product?.stock ?? 0}</span>
                            <span>Đánh giá: {product?.rating ?? 0} ★</span>
                        </div>

                        <div className="product-qty-row">
                            <button
                                type="button"
                                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}>
                                -
                            </button>
                            <span>{quantity}</span>
                            <button type="button" onClick={() => setQuantity((prev) => prev + 1)}>
                                +
                            </button>
                        </div>

                        {status.message ? (
                            <div
                                className={`auth-message ${status.type === "error" ? "is-error" : "is-success"}`}>
                                {status.message}
                            </div>
                        ) : null}

                        <div className="product-detail-actions">
                            <button className="product-detail-cart" type="button" onClick={handleAddToCart}>
                                Thêm vào giỏ
                            </button>
                            <button
                                className="product-detail-buy-now"
                                type="button"
                                onClick={handleBuyNow}>
                                Mua ngay
                            </button>
                        </div>
                    </div>
                </section>

                <section className="product-detail-body">
                    <div className="product-detail-tabs">
                        <button
                            type="button"
                            className={activeTab === "description" ? "is-active" : ""}
                            onClick={() => setActiveTab("description")}>
                            Mô tả
                        </button>
                        <button
                            type="button"
                            className={activeTab === "specs" ? "is-active" : ""}
                            onClick={() => setActiveTab("specs")}>
                            Thông số
                        </button>
                        <button
                            type="button"
                            className={activeTab === "ingredients" ? "is-active" : ""}
                            onClick={() => setActiveTab("ingredients")}>
                            Thành phần
                        </button>
                        <button
                            type="button"
                            className={activeTab === "directions" ? "is-active" : ""}
                            onClick={() => setActiveTab("directions")}>
                            HDSD
                        </button>
                        <button
                            type="button"
                            className={activeTab === "reviews" ? "is-active" : ""}
                            onClick={() => setActiveTab("reviews")}>
                            Đánh giá
                        </button>
                        <button
                            type="button"
                            className={activeTab === "qa" ? "is-active" : ""}
                            onClick={() => setActiveTab("qa")}>
                            Hỏi đáp
                        </button>
                    </div>

                    <div className="product-detail-tab-content">
                        {activeTab === "description" && (
                            <div className="product-detail-desc-full">
                                {product?.description ? (
                                    <div dangerouslySetInnerHTML={{ __html: product.description }} />
                                ) : (
                                    <p>Chưa có mô tả chi tiết cho sản phẩm này.</p>
                                )}
                            </div>
                        )}

                        {activeTab === "specs" && (
                            <div className="product-detail-specs">
                                {product?.specs ? (
                                    <div dangerouslySetInnerHTML={{ __html: product.specs }} />
                                ) : (
                                    <p>Không có thông số.</p>
                                )}
                            </div>
                        )}

                        {activeTab === "ingredients" && (
                            <div className="product-detail-ingredients">
                                {product?.ingredients ? (
                                    <div dangerouslySetInnerHTML={{ __html: product.ingredients }} />
                                ) : (
                                    <p>Không có thông tin thành phần.</p>
                                )}
                            </div>
                        )}

                        {activeTab === "directions" && (
                            <div className="product-detail-directions">
                                {product?.directions ? (
                                    <div dangerouslySetInnerHTML={{ __html: product.directions }} />
                                ) : (
                                    <p>Không có hướng dẫn sử dụng.</p>
                                )}
                            </div>
                        )}

                        {activeTab === "reviews" && (
                            <div className="product-detail-reviews">
                                {reviews.length === 0 ? (
                                    <p>Chưa có đánh giá.</p>
                                ) : (
                                    reviews.map((review: ReviewItem) => (
                                        <article key={review._id}>
                                            <strong>{review.userEmail}</strong>
                                            <span>{review.rating} ★</span>
                                            <p>{review.comment}</p>
                                        </article>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === "qa" && (
                            <div className="product-detail-qa">
                                <p>Chưa có câu hỏi / trả lời.</p>
                            </div>
                        )}
                    </div>
                </section>

                <section className="review-panel">
                    <h2>Đánh giá sản phẩm</h2>
                    <form onSubmit={handleReview} className="review-form">
                        <label className="auth-field">
                            <span>Số sao</span>
                            <select
                                value={reviewForm.rating}
                                onChange={(event) =>
                                    setReviewForm({
                                        ...reviewForm,
                                        rating: event.target.value,
                                    })
                                }>
                                {[5, 4, 3, 2, 1].map((rating) => (
                                    <option key={rating} value={rating}>
                                        {rating}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="auth-field">
                            <span>Bình luận</span>
                            <input
                                value={reviewForm.comment}
                                onChange={(event) =>
                                    setReviewForm({
                                        ...reviewForm,
                                        comment: event.target.value,
                                    })
                                }
                            />
                        </label>
                        {status.message ? (
                            <div
                                className={`auth-message ${status.type === "error" ? "is-error" : "is-success"}`}>
                                {status.message}
                            </div>
                        ) : null}
                        <button className="auth-submit" type="submit">
                            Gửi đánh giá
                        </button>
                    </form>

                    <div className="review-list">
                        {reviews.length === 0 ? (
                            <p>Chưa có đánh giá.</p>
                        ) : (
                            reviews.map((review: ReviewItem) => (
                                <article key={review._id}>
                                    <strong>{review.userEmail}</strong>
                                    <span>{review.rating} ★</span>
                                    <p>{review.comment}</p>
                                </article>
                            ))
                        )}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
