"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
    CheckCircle2,
    MessageSquare,
    Minus,
    PackageCheck,
    Plus,
    RotateCcw,
    ShoppingBag,
    ShieldCheck,
    Star,
    Truck,
} from "lucide-react";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import ProductCard from "../../../components/ui/ProductCard";
import {
    fetchHomeProducts,
    fetchProductById,
    fetchProducts,
} from "../../../services/productService";
import {
    addReview,
    fetchReviews,
    type ProductReview,
    type ReviewEligibility,
} from "../../../services/reviewService";
import { getErrorMessage } from "../../../lib/errors";
import { getDiscountPercent, getOriginalPrice, getSalePrice } from "../../../lib/pricing";
import { toast } from "sonner";
import { useCartStore } from "../../../stores/cartStore";
import type { Product, ProductVariant } from "../../../types/product";

const defaultEligibility: ReviewEligibility = {
    canReview: false,
    reason: "AUTH_REQUIRED",
};

const formatCurrency = (value?: number) =>
    `${Number(value || 0).toLocaleString("vi-VN")} đ`;

const renderStars = (rating = 0) =>
    Array.from({ length: 5 }, (_, index) => (
        <Star
            key={index}
            size={16}
            className={index < Math.round(rating) ? "fill-[#F59E0B] text-[#F59E0B]" : "text-[#D7CCD1]"}
        />
    ));

const getVariantKey = (variant: ProductVariant, index: number) =>
    String(variant.variant_id || variant.sku || `${variant.variant_title || "variant"}-${index}`);

const getVariantLabel = (variant: ProductVariant) =>
    variant.variant_title ||
    [variant.option1, variant.option2, variant.option3].filter(Boolean).join(" · ") ||
    variant.sku ||
    "Phiên bản";

const isVariantAvailable = (variant: ProductVariant) => {
    if (variant.available === false) return false;
    if (variant.inventory_quantity !== undefined && variant.inventory_quantity !== null) {
        return Number(variant.inventory_quantity) > 0;
    }
    return true;
};

export default function ProductDetailPage() {
    const router = useRouter();
    const params = useParams<{ id?: string | string[] }>();
    const routeId = params?.id;
    const id = Array.isArray(routeId) ? routeId[0] : routeId || "";
    const addCartItem = useCartStore((state) => state.addItem);
    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [reviews, setReviews] = useState<ProductReview[]>([]);
    const [eligibility, setEligibility] = useState<ReviewEligibility>(defaultEligibility);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
    const [reviewStatus, setReviewStatus] = useState({ type: "", message: "" });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState("");
    const [selectedVariantKey, setSelectedVariantKey] = useState("");
    const [isProductInfoExpanded, setIsProductInfoExpanded] = useState(false);
    const [detailTab, setDetailTab] = useState<"product-info" | "reviews">("product-info");
    const [purchaseAction, setPurchaseAction] = useState<"cart" | "checkout" | null>(null);

    useEffect(() => {
        router.prefetch("/checkout");
        router.prefetch("/login");
    }, [router]);

    useEffect(() => {
        const syncDetailTab = () => {
            const showReviews = window.location.hash === "#reviews";
            setDetailTab(showReviews ? "reviews" : "product-info");
            if (showReviews) document.getElementById("product-detail-tabs")?.scrollIntoView();
        };

        syncDetailTab();
        window.addEventListener("hashchange", syncDetailTab);
        return () => window.removeEventListener("hashchange", syncDetailTab);
    }, [id]);

    useEffect(() => {
        if (!id) {
            setProduct(null);
            setReviews([]);
            setIsLoading(false);
            return;
        }

        let mounted = true;

        const loadData = async () => {
            setIsLoading(true);
            try {
                const [productData, reviewData] = await Promise.all([
                    fetchProductById(id),
                    fetchReviews(id).catch(() => ({
                        items: [] as ProductReview[],
                        eligibility: defaultEligibility,
                    })),
                ]);
                if (!mounted) return;

                setProduct(productData);
                setIsProductInfoExpanded(false);
                const initialVariantIndex = (productData.variants || []).findIndex(isVariantAvailable);
                const firstVariant = productData.variants?.[initialVariantIndex >= 0 ? initialVariantIndex : 0];
                setSelectedVariantKey(firstVariant ? getVariantKey(firstVariant, Math.max(0, initialVariantIndex)) : "");
                setReviews(reviewData.items || []);
                setEligibility(reviewData.eligibility || defaultEligibility);
                setActiveImage(firstVariant?.image_url || resolveImages(productData)[0] || "");
            } catch {
                if (mounted) {
                    setProduct(null);
                    setSelectedVariantKey("");
                    setReviews([]);
                }
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        void loadData();
        return () => {
            mounted = false;
        };
    }, [id]);

    const images = useMemo(() => {
        const productImages = resolveImages(product);
        const variantImages = (product?.variants || [])
            .map((variant) => variant.image_url)
            .filter((image): image is string => Boolean(image));
        return Array.from(new Set([...productImages, ...variantImages]));
    }, [product]);
    const salePrice = useMemo(() => getSalePrice(product || {}), [product]);
    const originalPrice = useMemo(
        () => getOriginalPrice(product || {}, salePrice),
        [product, salePrice],
    );
    const discountPercent = useMemo(
        () => getDiscountPercent(product || {}, salePrice, originalPrice),
        [product, salePrice, originalPrice],
    );
    const stock = Number(product?.stock || 0);
    const soldOut = stock <= 0;
    const productRating = Number(product?.rating || 0);
    const reviewCount = reviews.length || Number(product?.review_count || 0);
    const reviewNotice = !eligibility.canReview && eligibility.reason !== "AUTH_REQUIRED"
        ? reviewEligibilityMessage(eligibility.reason)
        : null;
    const productDescription = product?.description || "Thông tin mô tả đang được cập nhật.";
    const productIngredients = product?.ingredients || "";
    const productUsage = product?.usageInstructions || product?.usage_instructions || "";
    const canExpandProductInfo =
        productDescription.length + productIngredients.length + productUsage.length > 500;
    const currentProductId = String(product?._id || product?.id || id);
    const currentProductName = product?.name || "";
    const currentCategory = product?.category?.trim() || "";
    const currentBrand = product?.brand?.trim() || "";

    const handlePurchase = async (goToCheckout = false) => {
        if (!currentProductId || soldOut || purchaseAction) return;

        setPurchaseAction(goToCheckout ? "checkout" : "cart");
        try {
            await addCartItem({
                productId: currentProductId,
                name: currentProductName,
                price: salePrice,
                originalPrice: originalPrice ?? undefined,
                image: activeImage || images[0],
                quantity,
                brand: currentBrand,
                stock,
            });

            if (goToCheckout) {
                router.push("/checkout");
            } else {
                toast.success("Đã thêm sản phẩm vào giỏ hàng.");
            }
        } catch (error) {
            toast.error(getErrorMessage(error, "Không thể thêm sản phẩm vào giỏ hàng."));
        } finally {
            setPurchaseAction(null);
        }
    };

    useEffect(() => {
        if (!product) {
            setRelatedProducts([]);
            return;
        }

        let mounted = true;

        const loadRelatedProducts = async () => {
            const queries: Array<Promise<Product[]>> = [];
            if (currentCategory) {
                queries.push(
                    fetchProducts({
                        page: 1,
                        limit: 20,
                        category: currentCategory,
                        inStock: true,
                    }).then((result) => result.items),
                );
            }
            if (currentBrand) {
                queries.push(
                    fetchProducts({
                        page: 1,
                        limit: 20,
                        brand: currentBrand,
                        inStock: true,
                    }).then((result) => result.items),
                );
            }

            const results = await Promise.allSettled(queries);
            const uniqueProducts = new Map<string, Product>();
            const isRelatedCandidate = (candidate: Product) => {
                const sameCategory =
                    currentCategory &&
                    candidate.category?.trim().toLocaleLowerCase() ===
                        currentCategory.toLocaleLowerCase();
                const sameBrand =
                    currentBrand &&
                    candidate.brand?.trim().toLocaleLowerCase() ===
                        currentBrand.toLocaleLowerCase();
                return Boolean(sameCategory || sameBrand);
            };

            for (const result of results) {
                if (result.status !== "fulfilled") continue;
                for (const candidate of result.value) {
                    const candidateId = String(candidate._id || candidate.id || "");
                    if (
                        !candidateId ||
                        candidateId === currentProductId ||
                        candidate.name === currentProductName ||
                        !isRelatedCandidate(candidate) ||
                        (candidate.stock !== undefined && Number(candidate.stock) <= 0)
                    ) {
                        continue;
                    }
                    uniqueProducts.set(candidateId, candidate);
                }
            }

            if (uniqueProducts.size < 5 && (currentCategory || currentBrand)) {
                try {
                    const availableProducts = await fetchHomeProducts(40);
                    for (const candidate of availableProducts) {
                        const candidateId = String(candidate._id || candidate.id || "");
                        if (
                            candidateId &&
                            candidateId !== currentProductId &&
                            candidate.name !== currentProductName &&
                            isRelatedCandidate(candidate)
                        ) {
                            uniqueProducts.set(candidateId, candidate);
                        }
                    }
                } catch {
                    // Keep the related-products section empty when the catalog is unavailable.
                }
            }

            if (mounted) setRelatedProducts(Array.from(uniqueProducts.values()).slice(0, 5));
        };

        void loadRelatedProducts();
        return () => {
            mounted = false;
        };
    }, [product, currentProductId, currentProductName, currentCategory, currentBrand]);

    const refreshReviews = async () => {
        const data = await fetchReviews(id);
        setReviews(data.items || []);
        setEligibility(data.eligibility || defaultEligibility);
    };

    const handleSubmitReview = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!id || !eligibility.canReview) return;

        try {
            setIsSubmittingReview(true);
            setReviewStatus({ type: "", message: "" });
            const result = await addReview(id, reviewForm);
            setProduct((current) =>
                current
                    ? {
                          ...current,
                          rating: result.summary.rating,
                          review_count: result.summary.reviewCount,
                      }
                    : current,
            );
            setReviewForm({ rating: 5, comment: "" });
            setReviewStatus({ type: "success", message: "Đánh giá sản phẩm thành công." });
            await refreshReviews();
        } catch (error) {
            setReviewStatus({ type: "error", message: getErrorMessage(error, "Không thể gửi đánh giá.") });
        } finally {
            setIsSubmittingReview(false);
        }
    };

    if (!isLoading && !product) {
        return (
            <div className="page-shell">
                <Header />
                <main className="main-content container py-16">
                    <div className="rounded-3xl border border-[#FFE3EC] bg-white p-10 text-center shadow-sm">
                        <h1 className="text-2xl font-bold text-[#2B1B24]">Không tìm thấy sản phẩm</h1>
                        <p className="mt-2 text-[#7A6A70]">Sản phẩm có thể đã ẩn hoặc không còn tồn tại.</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="page-shell">
            <Header />
            <main className="main-content product-detail-page">
                <div className="container product-detail-container">
                    <nav className="pdp-breadcrumb" aria-label="Breadcrumb">
                        <Link href="/">Trang chủ</Link>
                        <span>/</span>
                        <Link href="/products">Sản phẩm</Link>
                        <span>/</span>
                        <span className="pdp-breadcrumb-current">{product?.name || "Đang tải..."}</span>
                    </nav>

                    <section className="pdp-overview" aria-label="Thông tin sản phẩm">
                        <div className="pdp-gallery">
                            <div className="pdp-main-image-wrap">
                                {discountPercent > 0 ? <span className="pdp-discount">-{discountPercent}%</span> : null}
                                {isLoading ? (
                                    <div className="pdp-image-loading" />
                                ) : activeImage ? (
                                    <Image
                                        src={activeImage}
                                        alt={product?.name || "Sản phẩm"}
                                        width={900}
                                        height={900}
                                        priority
                                        className="pdp-main-image"
                                    />
                                ) : (
                                    <div className="pdp-image-empty">Chưa có hình ảnh</div>
                                )}
                            </div>
                            {images.length > 1 ? (
                                <div className="pdp-thumbnails" aria-label="Ảnh sản phẩm">
                                    {images.map((src, index) => (
                                        <button
                                            key={`${src}-${index}`}
                                            type="button"
                                            onClick={() => setActiveImage(src)}
                                            aria-label={`Xem ảnh sản phẩm ${index + 1}`}
                                            aria-pressed={src === activeImage}
                                            className={`pdp-thumbnail ${src === activeImage ? "is-active" : ""}`}>
                                            <Image src={src} alt="" fill sizes="76px" className="object-contain" />
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        <div className="pdp-information">
                            <div className="pdp-labels">
                                <span className="pdp-brand">{product?.brand || "LuxBerry"}</span>
                                {product?.category ? <span className="pdp-category">{product.category}</span> : null}
                                <span className={`pdp-stock ${soldOut ? "is-sold-out" : ""}`}>
                                    <span aria-hidden="true" />{soldOut ? "Tạm hết hàng" : "Còn hàng"}
                                </span>
                            </div>

                            <h1 className="pdp-title">{product?.name}</h1>

                            <div className="pdp-social-proof">
                                {reviewCount > 0 || productRating > 0 ? (
                                    <a
                                        href="#reviews"
                                        className="pdp-rating-link"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            setDetailTab("reviews");
                                            document.getElementById("product-detail-tabs")?.scrollIntoView();
                                        }}>
                                        <span className="pdp-rating-stars">{renderStars(productRating)}</span>
                                        <strong>{productRating.toFixed(1)}</strong>
                                        <span>{reviewCount} đánh giá</span>
                                    </a>
                                ) : <span className="pdp-no-rating">Chưa có đánh giá</span>}
                                <span className="pdp-proof-divider" />
                                <span>Đã bán {Number(product?.soldCount || 0).toLocaleString("vi-VN")}</span>
                            </div>

                            <div className="pdp-price-panel">
                                <strong className="pdp-sale-price">{formatCurrency(salePrice)}</strong>
                                {originalPrice ? <span className="pdp-original-price">{formatCurrency(originalPrice)}</span> : null}
                                {discountPercent > 0 ? <span className="pdp-savings">Tiết kiệm {discountPercent}%</span> : null}
                            </div>

                            {product?.shortDescription ? <p className="pdp-short-description">{product.shortDescription}</p> : null}

                            <dl className="pdp-facts">
                                {product?.volume ? <ProductMeta label="Dung tích / trọng lượng" value={product.volume} /> : null}
                                {product?.origin ? <ProductMeta label="Xuất xứ" value={product.origin} /> : null}
                                {product?.skin_type ? <ProductMeta label="Loại da" value={product.skin_type} /> : null}
                            </dl>

                            {product?.variants?.length ? (
                                <fieldset className="pdp-variants">
                                    <legend>Phiên bản sản phẩm</legend>
                                    <div className="pdp-variant-options">
                                        {product.variants.map((variant, index) => {
                                            const key = getVariantKey(variant, index);
                                            const available = isVariantAvailable(variant);
                                            const selected = selectedVariantKey === key;

                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    disabled={!available}
                                                    aria-pressed={selected}
                                                    onClick={() => {
                                                        setSelectedVariantKey(key);
                                                        if (variant.image_url) setActiveImage(variant.image_url);
                                                    }}
                                                    className={`pdp-variant-option${selected ? " is-selected" : ""}${available ? "" : " is-unavailable"}`}>
                                                    {getVariantLabel(variant)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </fieldset>
                            ) : null}

                            <div className="pdp-purchase-row">
                                <div className="pdp-quantity-control">
                                    <span>Số lượng</span>
                                    <div className="pdp-stepper">
                                        <button type="button" aria-label="Giảm số lượng" onClick={() => setQuantity((current) => Math.max(1, current - 1))}>
                                            <Minus size={16} />
                                        </button>
                                        <span aria-live="polite">{quantity}</span>
                                        <button type="button" aria-label="Tăng số lượng" onClick={() => setQuantity((current) => Math.min(stock || current + 1, current + 1))}>
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                                {stock > 0 ? <span className="pdp-stock-count">Còn {stock} sản phẩm</span> : null}
                            </div>

                            <div className="pdp-purchase-actions">
                                <button
                                    type="button"
                                    className="pdp-add-to-cart"
                                    onClick={() => void handlePurchase(false)}
                                    disabled={soldOut || purchaseAction !== null}>
                                    <ShoppingBag size={19} aria-hidden="true" />
                                    {purchaseAction === "cart" ? "Đang thêm..." : "Thêm vào giỏ hàng"}
                                </button>
                                <button
                                    type="button"
                                    className="pdp-buy-now"
                                    onClick={() => void handlePurchase(true)}
                                    disabled={soldOut || purchaseAction !== null}>
                                    {purchaseAction === "checkout" ? "Đang xử lý..." : soldOut ? "Hết hàng" : "Mua ngay"}
                                </button>
                            </div>
                        </div>
                    </section>

                    <section className="pdp-assurances" aria-label="Cam kết mua sắm">
                        <TrustItem icon={Truck} title="Giao hàng nhanh" text="Theo dõi trạng thái đơn" />
                        <TrustItem icon={RotateCcw} title="Đổi trả rõ ràng" text="Theo chính sách LuxBerry" />
                        <TrustItem icon={ShieldCheck} title="Mua sắm an tâm" text="Sản phẩm được kiểm tra" />
                    </section>

                    <div
                        id="product-detail-tabs"
                        className="pdp-detail-nav scroll-mt-24"
                        role="tablist"
                        aria-label="Nội dung sản phẩm"
                        onKeyDown={(event) => {
                            const { key } = event;
                            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(key)) return;
                            event.preventDefault();
                            const nextTab = key === "Home" ? "product-info" : key === "End" ? "reviews" :
                                detailTab === "reviews" ? "product-info" : "reviews";
                            setDetailTab(nextTab);
                            document.getElementById(`pdp-tab-${nextTab}`)?.focus();
                        }}>
                        <button id="pdp-tab-product-info" type="button" role="tab" aria-controls="product-info"
                            aria-selected={detailTab === "product-info"} tabIndex={detailTab === "product-info" ? 0 : -1}
                            onClick={() => setDetailTab("product-info")}>
                            Thông tin sản phẩm
                        </button>
                        <button id="pdp-tab-reviews" type="button" role="tab" aria-controls="reviews"
                            aria-selected={detailTab === "reviews"} tabIndex={detailTab === "reviews" ? 0 : -1}
                            onClick={() => setDetailTab("reviews")}>
                            Đánh giá - Hỏi đáp ({reviewCount})
                        </button>
                    </div>

                    <section id="product-info" className="pdp-detail-content" role="tabpanel"
                        aria-labelledby="pdp-tab-product-info" hidden={detailTab !== "product-info"} tabIndex={0}>
                        <article className="pdp-description-card">
                            <h2 className="text-xl font-bold text-[#2B1B24]">Thông tin sản phẩm</h2>
                            <div
                                id="product-info-copy"
                                className={`pdp-description-copy${canExpandProductInfo && !isProductInfoExpanded ? " is-collapsed" : ""}`}>
                                <p className="mt-4 whitespace-pre-line leading-7 text-[#5F5056]">
                                    {productDescription}
                                </p>
                                {productIngredients ? (
                                    <InfoBlock title="Thành phần" text={productIngredients} />
                                ) : null}
                                {productUsage ? (
                                    <InfoBlock title="Hướng dẫn sử dụng" text={productUsage} />
                                ) : null}
                            </div>
                            {canExpandProductInfo ? (
                                <button
                                    type="button"
                                    className="pdp-description-toggle"
                                    aria-expanded={isProductInfoExpanded}
                                    aria-controls="product-info-copy"
                                    onClick={() => setIsProductInfoExpanded((expanded) => !expanded)}>
                                    {isProductInfoExpanded ? "Rút gọn" : "Xem thêm"}
                                </button>
                            ) : null}
                        </article>

                        <aside className="pdp-quick-info">
                            <h2 className="text-xl font-bold text-[#2B1B24]">Thông tin nhanh</h2>
                            <dl className="mt-5 space-y-4 text-sm">
                                <QuickInfo label="Thương hiệu" value={product?.brand || "Đang cập nhật"} />
                                <QuickInfo label="Danh mục" value={product?.category || "Mỹ phẩm"} />
                                <QuickInfo label="Nhóm sản phẩm" value={product?.subcategory || "Đang cập nhật"} />
                                <QuickInfo label="Đánh giá" value={`${productRating.toFixed(1)} / 5`} />
                            </dl>
                        </aside>
                    </section>

                    <section id="reviews" className="pdp-reviews scroll-mt-24" role="tabpanel"
                        aria-labelledby="pdp-tab-reviews" hidden={detailTab !== "reviews"} tabIndex={0}>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F5DBE5] pb-4">
                            <h2 id="pdp-reviews-title" className="text-2xl font-bold text-[#17233D]">Đánh giá từ khách hàng</h2>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <strong className="text-xl leading-none tabular-nums text-[#A92755]" aria-label={`${productRating.toFixed(1)} trên 5 sao`}>{productRating.toFixed(1)}</strong>
                                <span className="flex gap-1" aria-hidden="true">{renderStars(productRating)}</span>
                                <span className="text-sm text-[#526079]">{reviewCount} đánh giá</span>
                            </div>
                        </div>

                        {eligibility.canReview ? (
                            <ReviewComposer
                                form={reviewForm}
                                status={reviewStatus}
                                submitting={isSubmittingReview}
                                onChange={setReviewForm}
                                onSubmit={handleSubmitReview}
                            />
                        ) : reviewNotice && reviews.length > 0 ? (
                            <p className="pt-4 text-sm text-[#526079]">{reviewNotice}</p>
                        ) : null}

                        <div className="divide-y divide-[#F2E1E8]">
                            {reviews.length ? (
                                reviews.map((review) => (
                                    <article key={review._id} className="py-4 last:pb-0">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <strong className="text-[#2B1B24]">{review.userName || review.userEmail}</strong>
                                                {review.verifiedPurchase ? (
                                                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                                                        <CheckCircle2 size={12} /> Đã mua hàng
                                                    </span>
                                                ) : null}
                                            </div>
                                            <span className="flex gap-1">{renderStars(review.rating)}</span>
                                        </div>
                                        <p className="mt-3 text-sm leading-6 text-[#5F5056]">{review.comment || "Khách hàng không để lại nhận xét."}</p>
                                    </article>
                                ))
                            ) : (
                                <div className="flex min-h-[128px] flex-col items-center justify-center gap-2 px-2 py-5 text-center sm:min-h-[164px]">
                                    <MessageSquare size={22} aria-hidden="true" className="text-[#A92755]" />
                                    <p className="text-base font-semibold text-[#17233D]">Sản phẩm này chưa có đánh giá</p>
                                    {reviewNotice ? (
                                        <p className="max-w-md text-sm leading-relaxed text-[#526079]">{reviewNotice}</p>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </section>

                    {relatedProducts.length ? (
                        <section className="pdp-related-products" aria-labelledby="pdp-related-title">
                            <div className="pdp-related-heading">
                                <h2 id="pdp-related-title">Sản phẩm liên quan</h2>
                            </div>
                            <div className="pdp-related-grid">
                                {relatedProducts.map((relatedProduct) => (
                                    <ProductCard
                                        key={relatedProduct._id || relatedProduct.id}
                                        item={relatedProduct}
                                        realDataOnly
                                    />
                                ))}
                            </div>
                        </section>
                    ) : null}
                </div>
            </main>
            <Footer />
        </div>
    );
}

function ReviewComposer({
    form,
    status,
    submitting,
    onChange,
    onSubmit,
}: {
    form: { rating: number; comment: string };
    status: { type: string; message: string };
    submitting: boolean;
    onChange: (value: { rating: number; comment: string }) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
    return (
        <form onSubmit={onSubmit} className="border-b border-[#F2E1E8] py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#2B1B24]">Số sao</span>
                    <select value={form.rating} onChange={(event) => onChange({ ...form, rating: Number(event.target.value) })} className="h-11 rounded-xl border border-[#EADDE2] bg-white px-4 text-sm outline-none focus:border-[#F999B7]">
                        {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} sao</option>)}
                    </select>
                </label>
                <label className="min-w-0 flex-1">
                    <span className="mb-2 block text-sm font-semibold text-[#2B1B24]">Nhận xét</span>
                    <textarea value={form.comment} onChange={(event) => onChange({ ...form, comment: event.target.value })} maxLength={1000} rows={3} className="w-full resize-none rounded-xl border border-[#EADDE2] bg-white px-4 py-3 text-sm outline-none focus:border-[#F999B7]" placeholder="Chia sẻ trải nghiệm sử dụng sản phẩm" />
                </label>
                <button type="submit" disabled={submitting} className="h-11 rounded-full bg-[#BD285D] px-5 text-sm font-bold text-white hover:bg-[#9D1C4B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BD285D] disabled:opacity-60">
                    {submitting ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
            </div>
            {status.message ? <p className={`mt-3 text-sm font-medium ${status.type === "error" ? "text-red-600" : "text-emerald-700"}`}>{status.message}</p> : null}
        </form>
    );
}

function ProductMeta({ label, value }: { label: string; value: string }) {
    return <div><dt className="text-[#7A6A70]">{label}</dt><dd className="mt-1 font-semibold text-[#2B1B24]">{value}</dd></div>;
}

function QuickInfo({ label, value }: { label: string; value: string }) {
    return <div className="flex items-start justify-between gap-4 border-b border-[#F5E5EC] pb-3 last:border-0 last:pb-0"><dt className="text-[#7A6A70]">{label}</dt><dd className="text-right font-semibold text-[#2B1B24]">{value}</dd></div>;
}

function TrustItem({ icon: Icon, title, text }: { icon: typeof PackageCheck; title: string; text: string }) {
    return (
        <div className="flex items-start gap-3 sm:gap-4">
            <Icon size={32} aria-hidden="true" className="mt-0.5 shrink-0 text-[#F999B7]" />
            <span>
                <strong className="block text-lg font-bold leading-tight text-[#2B1B24] sm:text-xl">{title}</strong>
                <span className="mt-1 block text-base text-[#7A6A70]">{text}</span>
            </span>
        </div>
    );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
    return <div className="mt-6 border-t border-[#F5E5EC] pt-5"><h3 className="font-bold text-[#2B1B24]">{title}</h3><p className="mt-2 whitespace-pre-line leading-7 text-[#5F5056]">{text}</p></div>;
}

function resolveImages(product: Product | null) {
    if (!product) return [];
    const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
    if (images.length) return images;
    return [product.image, product.image_url, product.imageUrl].filter(Boolean) as string[];
}

function reviewEligibilityMessage(reason: ReviewEligibility["reason"]) {
    if (reason === "CUSTOMER_REQUIRED") return "Chỉ tài khoản khách hàng mới có thể đánh giá sản phẩm.";
    if (reason === "REVIEW_ALREADY_EXISTS") return "Bạn đã đánh giá sản phẩm này.";
    if (reason === "REVIEW_PURCHASE_REQUIRED") return "Bạn có thể viết đánh giá sau khi nhận được sản phẩm đã mua.";
    return "Bạn chưa thể đánh giá sản phẩm này.";
}
