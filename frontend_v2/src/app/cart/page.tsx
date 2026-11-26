"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronRight, Heart, LoaderCircle, Minus, Plus, ShoppingBag, TicketPercent, Truck, X } from "lucide-react";
import { toast } from "sonner";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import CartRecommendations from "../../components/ui/CartRecommendations";
import {
    clearCartApi,
    fetchCart,
    removeCartItemApi,
    updateCartItemApi,
} from "../../services/cartService";
import { getErrorMessage } from "../../lib/errors";
import { removeFavoriteProduct, saveFavoriteProduct } from "../../services/favoriteService";
import { useAuthStore } from "../../stores/authStore";
import { getCartItems } from "../../utils/cart";
import { getCurrentUser } from "../../utils/user";
import type { CartItem } from "../../types/cart";

const formatCurrency = (value: number) => `${value.toLocaleString("vi-VN")} đ`;
const cartColumns = "md:grid-cols-[minmax(0,1fr)_112px_110px_112px]";
const cartPrimaryActionClass =
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#F79CBC] px-4 py-2.5 text-sm font-extrabold text-white [text-shadow:0_1px_2px_#98325E] transition-colors hover:bg-[#F382AE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A92755]";

export default function CartPage() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
    const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false);
    const updatePending = useRef(false);
    const [status, setStatus] = useState<{
        type: "error" | "success" | "";
        message: string;
    }>({ type: "", message: "" });

    useEffect(() => {
        let mounted = true;
        const loadCart = async () => {
            try {
                const cart = await fetchCart();
                if (!mounted) return;
                setItems(cart);
            } catch (error) {
                if (!mounted) return;
                setStatus({
                    type: "error",
                    message: getErrorMessage(error, "Không tải được giỏ hàng."),
                });
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        const syncItems = () => setItems(getCartItems());
        window.addEventListener("cart-change", syncItems);
        void loadCart();
        return () => {
            mounted = false;
            window.removeEventListener("cart-change", syncItems);
        };
    }, []);

    useEffect(() => {
        router.prefetch("/checkout");
        router.prefetch("/login");
    }, [router]);

    const pricing = useMemo(() => {
        const originalSubtotal = items.reduce((sum, item) => {
            const basePrice = Math.max(item.originalPrice ?? 0, item.price);
            return sum + basePrice * item.quantity;
        }, 0);

        const finalSubtotal = items.reduce(
            (sum, item) => sum + Number(item.price || 0) * item.quantity,
            0,
        );

        const discount = Math.max(0, originalSubtotal - finalSubtotal);

        return {
            originalSubtotal,
            discount,
            finalSubtotal,
        };
    }, [items]);

    const updateCart = async (
        update: () => Promise<CartItem[]>,
        errorMessage: string,
        successMessage = "",
    ) => {
        if (updatePending.current) return;
        updatePending.current = true;
        setIsUpdating(true);
        try {
            setItems(await update());
            setStatus({ type: successMessage ? "success" : "", message: successMessage });
        } catch (error) {
            setStatus({ type: "error", message: getErrorMessage(error, errorMessage) });
        } finally {
            updatePending.current = false;
            setIsUpdating(false);
        }
    };

    const handleQuantity = (productId: string, quantity: number) =>
        updateCart(() => updateCartItemApi(productId, quantity), "Cập nhật số lượng thất bại.");

    const handleRemove = (productId: string) =>
        updateCart(() => removeCartItemApi(productId), "Xóa sản phẩm thất bại.");

    const handleDecrease = (item: CartItem) => {
        if (item.quantity <= 1) return handleRemove(item.productId);
        return handleQuantity(item.productId, item.quantity - 1);
    };

    const handleClear = () => {
        setConfirmClear(false);
        return updateCart(clearCartApi, "Không thể xóa giỏ hàng.", "Đã xóa toàn bộ giỏ hàng.");
    };

    const handleCheckout = () => {
        const user = getCurrentUser();
        if (!user?._id && !user?.email) {
            router.push("/login?redirect=/checkout");
            return;
        }

        router.push("/checkout");
    };

    const handleFavorite = async (productId: string, isFavorite: boolean) => {
        if (!user) {
            router.push("/login?redirect=/cart");
            return;
        }
        if (isUpdatingFavorite) return;

        setIsUpdatingFavorite(true);
        try {
            if (isFavorite) await removeFavoriteProduct(productId);
            else await saveFavoriteProduct(productId);
        } catch (error) {
            toast.error(getErrorMessage(error, "Không thể cập nhật sản phẩm yêu thích."));
        } finally {
            setIsUpdatingFavorite(false);
        }
    };

    const itemCount = items.reduce((total, item) => total + item.quantity, 0);

    return (
        <div className="min-h-screen bg-white text-[#17233D]">
            <Header />
            <main className="mx-auto max-w-[1480px] px-4 pb-14 pt-6 sm:px-6">
                <nav aria-label="Đường dẫn" className="flex items-center gap-2 text-sm text-[#626A7B]">
                    <Link href="/" className="hover:text-[#A92755]">Trang chủ</Link>
                    <ChevronRight size={14} aria-hidden="true" />
                    <span aria-current="page" className="font-semibold text-[#17233D]">Giỏ hàng</span>
                </nav>

                <div className="mb-4 mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <h1 className="cart-page-heading">Giỏ hàng</h1>
                    {!isLoading && (items.length > 0 || status.type !== "error") ? (
                        <span className="text-sm text-[#626A7B]">({itemCount} sản phẩm)</span>
                    ) : null}
                </div>

                {status.message ? (
                    <p role={status.type === "error" ? "alert" : "status"} className="mb-4 rounded-lg bg-[#FFF1F6] px-4 py-3 text-sm text-[#91254A]">
                        {status.message}
                    </p>
                ) : null}

                {isLoading ? (
                    <p role="status" className="flex items-center justify-center gap-2 rounded-2xl border border-[#F4DCE6] py-12 text-sm text-[#626A7B]">
                        <LoaderCircle size={20} aria-hidden="true" className="motion-safe:animate-spin" /> Đang tải giỏ hàng…
                    </p>
                ) : items.length === 0 ? (
                    <div className="grid justify-items-center rounded-2xl border border-[#F4DCE6] px-5 py-12 text-center sm:py-16">
                        <ShoppingBag size={38} aria-hidden="true" className="mb-4 text-[#F999B7]" />
                        <h2 className="text-xl font-bold">{status.type === "error" ? "Chưa thể hiển thị giỏ hàng" : "Giỏ hàng đang trống"}</h2>
                        {status.type === "error" ? (
                            <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-full bg-[#B62459] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#98204B]">Tải lại giỏ hàng</button>
                        ) : (
                            <Link href="/products" className={`${cartPrimaryActionClass} mt-4`}>
                                Khám phá sản phẩm <ArrowRight size={17} aria-hidden="true" />
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                        <section aria-label="Sản phẩm trong giỏ" aria-busy={isUpdating} className="min-w-0">
                            <div className={`hidden ${cartColumns} items-center gap-4 rounded-t-lg bg-[#FFF0F6] px-4 py-3 text-sm font-bold md:grid`}>
                                <span>Sản phẩm</span>
                                <span>Đơn giá</span>
                                <span className="text-center">Số lượng</span>
                                <span className="text-right">Thành tiền</span>
                            </div>
                            <ul className="divide-y divide-[#F4DCE6]">
                                {items.map((item) => {
                                    const productUrl = `/products/${encodeURIComponent(item.productId)}`;
                                    const hasDiscount = Number(item.originalPrice) > item.price;
                                    const isFavorite = user?.savedProductIds?.includes(item.productId) ?? false;

                                    return (
                                        <li key={item.productId} className={`grid grid-cols-[minmax(0,1fr)_auto] ${cartColumns} gap-3 px-4 py-4 md:items-center md:gap-4`}>
                                            <div className="col-span-2 flex min-w-0 gap-3 md:col-span-1">
                                                <Link href={productUrl} aria-label={item.name} className="relative grid h-[72px] w-[72px] shrink-0 place-items-center overflow-hidden rounded-lg bg-[#FFFAFC]">
                                                    {item.image ? (
                                                        <Image src={item.image} alt="" fill sizes="72px" className="object-contain" unoptimized />
                                                    ) : <ShoppingBag size={24} aria-hidden="true" className="text-[#C66489]" />}
                                                </Link>
                                                <div className="min-w-0">
                                                    {item.brand ? <p className="mb-0.5 text-xs font-bold uppercase text-[#626A7B]">{item.brand}</p> : null}
                                                    <h2 className="break-words text-sm font-semibold leading-snug sm:text-base">
                                                        <Link href={productUrl} className="hover:text-[#A92755] hover:underline">{item.name}</Link>
                                                    </h2>
                                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                                                        <button type="button" aria-pressed={isFavorite} disabled={isUpdatingFavorite}
                                                            onClick={() => void handleFavorite(item.productId, isFavorite)}
                                                            className="inline-flex items-center gap-1.5 text-[#A92755] hover:underline disabled:opacity-50">
                                                            <Heart size={15} aria-hidden="true" fill={isFavorite ? "currentColor" : "none"} />
                                                            {isFavorite ? "Đã yêu thích" : "Yêu thích"}
                                                        </button>
                                                        <button type="button" aria-label={`Xóa ${item.name} khỏi giỏ`} disabled={isUpdating}
                                                            onClick={() => void handleRemove(item.productId)}
                                                            className="inline-flex items-center gap-1 text-[#626A7B] hover:text-[#A92755] hover:underline disabled:opacity-50">
                                                            <X size={15} aria-hidden="true" /> Xóa
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-span-2 text-sm md:col-span-1">
                                                <span className="mr-2 text-[#626A7B] md:sr-only">Đơn giá</span>
                                                <span className="whitespace-nowrap font-semibold text-[color:var(--lux-product-price)]">{formatCurrency(item.price)}</span>
                                                {hasDiscount ? <del className="ml-2 whitespace-nowrap text-xs text-[#626A7B] md:ml-0 md:mt-0.5 md:block">{formatCurrency(Number(item.originalPrice))}</del> : null}
                                            </div>
                                            <div className="inline-flex h-9 w-fit items-center rounded-md border border-[#F1D0DE] md:justify-self-center">
                                                <button type="button" aria-label={item.quantity <= 1 ? `Xóa ${item.name} khỏi giỏ` : `Giảm số lượng ${item.name}`}
                                                    title={item.quantity <= 1 ? "Xóa sản phẩm" : "Giảm số lượng"} disabled={isUpdating}
                                                    onClick={() => void handleDecrease(item)}
                                                    className="grid h-full w-8 place-items-center rounded-l-md hover:bg-[#FFF1F6] disabled:opacity-40">
                                                    <Minus size={15} aria-hidden="true" />
                                                </button>
                                                <span className="min-w-[28px] text-center text-sm font-bold tabular-nums" aria-live="polite">{item.quantity}</span>
                                                <button type="button" aria-label={`Tăng số lượng ${item.name}`} disabled={isUpdating || (Boolean(item.stock) && item.quantity >= (item.stock ?? 0))}
                                                    onClick={() => void handleQuantity(item.productId, item.quantity + 1)}
                                                    className="grid h-full w-8 place-items-center rounded-r-md hover:bg-[#FFF1F6] disabled:opacity-40">
                                                    <Plus size={15} aria-hidden="true" />
                                                </button>
                                            </div>
                                            <div className="self-center whitespace-nowrap text-right text-sm">
                                                <span className="mr-2 text-[#626A7B] md:sr-only">Thành tiền</span>
                                                <strong className="text-[color:var(--lux-product-price)]">{formatCurrency(item.price * item.quantity)}</strong>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                            <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[#F4DCE6] px-4 py-4">
                                <Link href="/products" className="inline-flex items-center gap-2 text-sm font-bold text-[#A92755] hover:underline">
                                    <ArrowLeft size={16} aria-hidden="true" /> Tiếp tục mua hàng
                                </Link>
                                {confirmClear ? (
                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                        <span>Xóa toàn bộ?</span>
                                        <button type="button" onClick={handleClear} disabled={isUpdating} className="font-bold text-[#A92755] hover:underline disabled:opacity-50">Xóa</button>
                                        <button type="button" onClick={() => setConfirmClear(false)} className="px-1 text-[#626A7B] hover:underline">Hủy</button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => setConfirmClear(true)} disabled={isUpdating} className="py-1 text-sm text-[#626A7B] hover:text-[#A92755] hover:underline disabled:opacity-50">
                                        Xóa tất cả
                                    </button>
                                )}
                            </div>
                            <p className="flex items-baseline justify-end gap-3 px-4 pt-4 text-sm">
                                <span className="text-[#626A7B]">Tạm tính</span>
                                <strong className="text-base text-[color:var(--lux-product-price)]">{formatCurrency(pricing.finalSubtotal)}</strong>
                            </p>
                        </section>

                        <aside aria-labelledby="cart-summary-title" className="rounded-lg border-x border-b border-[#F4DCE6] bg-[#FFFAFC] p-5">
                            <h2 id="cart-summary-title" className="border-b border-[#F4DCE6] pb-3 text-xl font-bold">Hóa đơn của bạn</h2>
                            <dl className="mt-4 space-y-3 text-sm">
                                <div className="flex items-baseline justify-between gap-3">
                                    <dt className="text-[#626A7B]">Tổng giá sản phẩm</dt>
                                    <dd className="whitespace-nowrap font-semibold">{formatCurrency(pricing.originalSubtotal)}</dd>
                                </div>
                                {pricing.discount > 0 ? (
                                    <div className="flex items-baseline justify-between gap-3">
                                        <dt className="text-[#626A7B]">Giảm giá sản phẩm</dt>
                                        <dd className="whitespace-nowrap font-semibold text-[color:var(--lux-product-price)]">−{formatCurrency(pricing.discount)}</dd>
                                    </div>
                                ) : null}
                                <div className="flex items-baseline justify-between gap-3 border-t border-[#F4DCE6] pt-3">
                                    <dt className="font-bold">Tạm tính</dt>
                                    <dd className="text-right">
                                        <strong className="block whitespace-nowrap text-xl font-extrabold text-[color:var(--lux-product-price)]">
                                            {formatCurrency(pricing.finalSubtotal)}
                                        </strong>
                                        <span className="mt-1 block text-xs text-[#626A7B]">(Đã bao gồm VAT)</span>
                                    </dd>
                                </div>
                            </dl>
                            <ul className="my-4 space-y-2.5 text-sm text-[#626A7B]">
                                <li className="flex items-center gap-2"><Truck size={17} aria-hidden="true" className="shrink-0 text-[#A92755]" /> Phí giao hàng tính theo địa chỉ.</li>
                                <li className="flex items-center gap-2"><TicketPercent size={17} aria-hidden="true" className="shrink-0 text-[#A92755]" /> Chọn voucher ở bước thanh toán.</li>
                            </ul>
                            <button type="button" onClick={handleCheckout} disabled={isUpdating}
                                className={`${cartPrimaryActionClass} w-full disabled:opacity-50`}>
                                Tiến hành đặt hàng <ArrowRight size={17} aria-hidden="true" />
                            </button>
                        </aside>
                    </div>
                )}
                {!isLoading && items.length > 0 ? (
                    <CartRecommendations cartProductIds={items.map((item) => item.productId)} />
                ) : null}
            </main>
            <Footer />
        </div>
    );
}
