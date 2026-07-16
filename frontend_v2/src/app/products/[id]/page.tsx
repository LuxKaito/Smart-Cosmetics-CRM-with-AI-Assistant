"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
    CheckCircle2,
    Minus,
    PackageCheck,
    Plus,
    RotateCcw,
    ShieldCheck,
    ShoppingBag,
    Star,
    Truck,
} from "lucide-react";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import { addCartItem } from "../../../services/cartService";
import { fetchProductById } from "../../../services/productService";
import {
    addReview,
    fetchReviews,
    type ProductReview,
    type ReviewEligibility,
} from "../../../services/reviewService";
import { getErrorMessage } from "../../../lib/errors";
import { getDiscountPercent, getOriginalPrice, getSalePrice } from "../../../lib/pricing";
import { getCurrentUser } from "../../../utils/user";
import type { Product } from "../../../types/product";

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

export default function ProductDetailPage() {
    const router = useRouter();
    const params = useParams<{ id?: string | string[] }>();
    const routeId = params?.id;
    const id = Array.isArray(routeId) ? routeId[0] : routeId || "";
    const [product, setProduct] = useState<Product | null>(null);
    const [reviews, setReviews] = useState<ProductReview[]>([]);
    const [eligibility, setEligibility] = useState<ReviewEligibility>(defaultEligibility);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
    const [reviewStatus, setReviewStatus] = useState({ type: "", message: "" });
    const [actionStatus, setActionStatus] = useState({ type: "", message: "" });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState("");

    useEffect(() => {
        router.prefetch("/checkout");
        router.prefetch("/login");
    }, [router]);

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
                setReviews(reviewData.items || []);
                setEligibility(reviewData.eligibility || defaultEligibility);
                setActiveImage(resolveImages(productData)[0] || "");
            } catch {
                if (mounted) {
                    setProduct(null);
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

    const images = useMemo(() => resolveImages(product), [product]);
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

    const handleAddToCart = async () => {
        if (!product?._id || soldOut) return;
        try {
            await addCartItem(product._id, quantity);
            setActionStatus({ type: "success", message: "Đã thêm sản phẩm vào giỏ hàng." });
        } catch (error) {
            setActionStatus({ type: "error", message: getErrorMessage(error, "Không thể thêm vào giỏ hàng.") });
        }
    };

    const handleBuyNow = async () => {
        if (!product?._id || soldOut) return;
        const user = getCurrentUser();
        if (!user?._id && !user?.email) {
            router.push("/login?redirect=/checkout");
            return;
        }

        try {
            await addCartItem(product._id, quantity);
            router.push("/checkout");
        } catch (error) {
            setActionStatus({ type: "error", message: getErrorMessage(error, "Không thể mua ngay lúc này.") });
        }
    };

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
            <main className="main-content bg-gradient-to-b from-[#FFF7FA] to-white pb-16">
                <div className="container py-7">
                    <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-[#7A6A70]" aria-label="Breadcrumb">
                        <Link href="/" className="hover:text-[#F999B7]">Trang chủ</Link>
                        <span>/</span>
                        <Link href="/products" className="hover:text-[#F999B7]">Sản phẩm</Link>
                        <span>/</span>
                        <span className="font-medium text-[#2B1B24]">{product?.name || "Đang tải..."}</span>
                    </nav>

                    <section className="grid gap-7 rounded-[28px] border border-[#FFE3EC] bg-white p-4 shadow-[0_20px_55px_rgba(249,153,183,0.14)] md:p-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                        <div className={`grid gap-4 ${images.length > 1 ? "sm:grid-cols-[82px_minmax(0,1fr)]" : ""}`}>
                            {images.length > 1 ? (
                                <div className="order-2 flex gap-3 overflow-x-auto sm:order-1 sm:flex-col">
                                    {images.map((src) => (
                                        <button
                                            key={src}
                                            type="button"
                                            onClick={() => setActiveImage(src)}
                                            className={`relative h-[74px] w-[74px] shrink-0 overflow-hidden rounded-2xl border bg-white transition ${
                                                src === activeImage
                                                    ? "border-[#F999B7] ring-2 ring-[#FFD4E1]"
                                                    : "border-[#EEE4E8] hover:border-[#F999B7]"
                                            }`}>
                                            <Image src={src} alt={product?.name || "Ảnh sản phẩm"} fill sizes="74px" className="object-contain p-1" />
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                            <div className="order-1 relative overflow-hidden rounded-[24px] border border-[#F4E9ED] bg-[#FFFBFC] sm:order-2">
                                {discountPercent > 0 ? (
                                    <span className="absolute left-4 top-4 z-[1] rounded-full bg-[#F999B7] px-3 py-1 text-xs font-bold text-white">
                                        -{discountPercent}%
                                    </span>
                                ) : null}
                                {isLoading ? (
                                    <div className="aspect-square animate-pulse bg-[#FFF0F5]" />
                                ) : activeImage ? (
                                    <Image
                                        src={activeImage}
                                        alt={product?.name || "Sản phẩm"}
                                        width={900}
                                        height={900}
                                        priority
                                        className="aspect-square h-auto w-full object-contain p-5"
                                    />
                                ) : (
                                    <div className="flex aspect-square items-center justify-center text-[#7A6A70]">Chưa có hình ảnh</div>
                                )}
                            </div>
                        </div>

                        <div className="flex min-w-0 flex-col">
                            <div className="flex flex-wrap gap-2">
                                <span className="rounded-full bg-[#FFF0F5] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#B14063]">
                                    {product?.brand || "LuxBerry"}
                                </span>
                                <span className="rounded-full border border-[#FFE3EC] px-3 py-1 text-xs font-semibold text-[#7A6A70]">
                                    {product?.category || "Mỹ phẩm"}
                                </span>
                            </div>

                            <h1 className="mt-4 text-2xl font-bold leading-tight text-[#2B1B24] md:text-3xl">
                                {product?.name}
                            </h1>

                            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                                <span className="flex items-center gap-1">{renderStars(productRating)}</span>
                                <strong className="text-[#B14063]">{productRating.toFixed(1)}</strong>
                                <a href="#reviews" className="text-[#7A6A70] underline decoration-[#FFD4E1] underline-offset-4">
                                    {reviewCount} đánh giá
                                </a>
                                <span className="text-[#D7CCD1]">|</span>
                                <span className="text-[#7A6A70]">Đã bán {Number(product?.soldCount || 0).toLocaleString("vi-VN")}</span>
                            </div>

                            <div className="mt-5 rounded-2xl bg-[#FFF7FA] p-4">
                                <div className="flex flex-wrap items-end gap-3">
                                    <strong className="text-3xl font-extrabold text-[#D9366E]">{formatCurrency(salePrice)}</strong>
                                    {originalPrice ? <span className="pb-1 text-base text-[#A99AA0] line-through">{formatCurrency(originalPrice)}</span> : null}
                                </div>
                            </div>

                            <dl className="mt-5 grid gap-x-5 gap-y-3 text-sm sm:grid-cols-2">
                                <ProductMeta label="Xuất xứ" value={product?.origin || "Đang cập nhật"} />
                                <ProductMeta label="Dung tích" value={product?.volume || "Đang cập nhật"} />
                                <ProductMeta label="Loại da" value={product?.skin_type || "Phù hợp nhiều loại da"} />
                                <ProductMeta label="Tình trạng" value={soldOut ? "Tạm hết hàng" : `Còn ${stock} sản phẩm`} />
                            </dl>

                            <div className="mt-6 flex flex-wrap items-center gap-3">
                                <span className="text-sm font-semibold text-[#2B1B24]">Số lượng</span>
                                <div className="inline-flex overflow-hidden rounded-xl border border-[#EADDE2] bg-white">
                                    <button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} className="flex h-11 w-11 items-center justify-center text-[#7A6A70] hover:bg-[#FFF7FA]">
                                        <Minus size={16} />
                                    </button>
                                    <span className="flex h-11 min-w-12 items-center justify-center border-x border-[#EADDE2] px-3 font-bold">{quantity}</span>
                                    <button type="button" onClick={() => setQuantity((current) => Math.min(stock || current + 1, current + 1))} className="flex h-11 w-11 items-center justify-center text-[#7A6A70] hover:bg-[#FFF7FA]">
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                            {actionStatus.message ? (
                                <p className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${actionStatus.type === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
                                    {actionStatus.message}
                                </p>
                            ) : null}

                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                <button type="button" disabled={soldOut} onClick={() => void handleAddToCart()} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#F999B7] bg-white font-bold text-[#D9366E] transition hover:bg-[#FFF7FA] disabled:cursor-not-allowed disabled:opacity-50">
                                    <ShoppingBag size={18} /> Thêm vào giỏ
                                </button>
                                <button type="button" disabled={soldOut} onClick={() => void handleBuyNow()} className="h-12 rounded-xl bg-[#F999B7] font-bold text-white shadow-[0_12px_25px_rgba(249,153,183,0.28)] transition hover:bg-[#F47FA5] disabled:cursor-not-allowed disabled:opacity-50">
                                    Mua ngay
                                </button>
                            </div>

                            <div className="mt-6 grid gap-3 border-t border-[#F5E5EC] pt-5 sm:grid-cols-3">
                                <TrustItem icon={Truck} title="Giao hàng nhanh" text="Theo dõi trạng thái đơn" />
                                <TrustItem icon={RotateCcw} title="Đổi trả rõ ràng" text="Theo chính sách LuxBerry" />
                                <TrustItem icon={ShieldCheck} title="Mua sắm an tâm" text="Sản phẩm được kiểm tra" />
                            </div>
                        </div>
                    </section>

                    <section className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
                        <article className="rounded-[24px] border border-[#FFE3EC] bg-white p-6 shadow-[0_12px_32px_rgba(43,27,36,0.05)]">
                            <h2 className="text-xl font-bold text-[#2B1B24]">Thông tin sản phẩm</h2>
                            <p className="mt-4 whitespace-pre-line leading-7 text-[#5F5056]">
                                {product?.description || "Thông tin mô tả đang được cập nhật."}
                            </p>
                            {product?.ingredients ? (
                                <InfoBlock title="Thành phần" text={product.ingredients} />
                            ) : null}
                            {product?.usageInstructions || product?.usage_instructions ? (
                                <InfoBlock title="Hướng dẫn sử dụng" text={product.usageInstructions || product.usage_instructions || ""} />
                            ) : null}
                        </article>

                        <aside className="rounded-[24px] border border-[#FFE3EC] bg-white p-6 shadow-[0_12px_32px_rgba(43,27,36,0.05)]">
                            <h2 className="text-xl font-bold text-[#2B1B24]">Thông tin nhanh</h2>
                            <dl className="mt-5 space-y-4 text-sm">
                                <QuickInfo label="Thương hiệu" value={product?.brand || "Đang cập nhật"} />
                                <QuickInfo label="Danh mục" value={product?.category || "Mỹ phẩm"} />
                                <QuickInfo label="Nhóm sản phẩm" value={product?.subcategory || "Đang cập nhật"} />
                                <QuickInfo label="Đánh giá" value={`${productRating.toFixed(1)} / 5`} />
                            </dl>
                        </aside>
                    </section>

                    <section id="reviews" className="mt-7 scroll-mt-24 rounded-[24px] border border-[#FFE3EC] bg-white p-6 shadow-[0_12px_32px_rgba(43,27,36,0.05)]">
                        <div className="flex flex-col gap-4 border-b border-[#F5E5EC] pb-5 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h2 className="mt-1 text-2xl font-bold text-[#2B1B24]">Đánh giá từ khách hàng</h2>
                            </div>
                            <div className="flex items-center gap-3">
                                <strong className="text-3xl text-[#D9366E]">{productRating.toFixed(1)}</strong>
                                <span>
                                    <span className="flex gap-1">{renderStars(productRating)}</span>
                                    <span className="mt-1 block text-xs text-[#7A6A70]">{reviewCount} đánh giá</span>
                                </span>
                            </div>
                        </div>

                        <ReviewComposer
                            productId={id}
                            eligibility={eligibility}
                            form={reviewForm}
                            status={reviewStatus}
                            submitting={isSubmittingReview}
                            onChange={setReviewForm}
                            onSubmit={handleSubmitReview}
                        />

                        <div className="mt-6 grid gap-3">
                            {reviews.length ? (
                                reviews.map((review) => (
                                    <article key={review._id} className="rounded-2xl border border-[#F5E5EC] bg-[#FFFCFD] p-4">
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
                                <div className="rounded-2xl border border-dashed border-[#FFD4E1] bg-[#FFF7FA] px-5 py-8 text-center text-sm text-[#7A6A70]">
                                    Chưa có đánh giá nào cho sản phẩm này.
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}

function ReviewComposer({
    productId,
    eligibility,
    form,
    status,
    submitting,
    onChange,
    onSubmit,
}: {
    productId: string;
    eligibility: ReviewEligibility;
    form: { rating: number; comment: string };
    status: { type: string; message: string };
    submitting: boolean;
    onChange: (value: { rating: number; comment: string }) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
    if (!eligibility.canReview) {
        return (
            <div className="mt-5 rounded-2xl border border-[#FFE3EC] bg-[#FFF7FA] p-4 text-sm text-[#5F5056]">
                <p>{reviewEligibilityMessage(eligibility.reason)}</p>
                {eligibility.reason === "AUTH_REQUIRED" ? (
                    <Link
                        href={`/login?redirect=${encodeURIComponent(`/products/${productId}#reviews`)}`}
                        className="mt-3 inline-flex rounded-xl bg-[#F999B7] px-4 py-2 font-bold text-white">
                        Đăng nhập để đánh giá
                    </Link>
                ) : null}
            </div>
        );
    }

    return (
        <form onSubmit={onSubmit} className="mt-5 rounded-2xl border border-[#FFE3EC] bg-[#FFF7FA] p-4">
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
                <button type="submit" disabled={submitting} className="h-11 rounded-xl bg-[#F999B7] px-5 text-sm font-bold text-white disabled:opacity-60">
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
    return <div className="flex gap-2"><Icon size={18} className="mt-0.5 shrink-0 text-[#F999B7]" /><span><strong className="block text-xs text-[#2B1B24]">{title}</strong><span className="mt-1 block text-[11px] leading-4 text-[#7A6A70]">{text}</span></span></div>;
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
    if (reason === "AUTH_REQUIRED") return "Vui lòng đăng nhập để đánh giá sản phẩm.";
    if (reason === "CUSTOMER_REQUIRED") return "Chỉ tài khoản khách hàng mới có thể đánh giá sản phẩm.";
    if (reason === "REVIEW_ALREADY_EXISTS") return "Bạn đã đánh giá sản phẩm này.";
    if (reason === "REVIEW_PURCHASE_REQUIRED") return "Bạn chỉ có thể đánh giá sản phẩm đã mua và giao hàng thành công.";
    return "Bạn chưa thể đánh giá sản phẩm này.";
}
