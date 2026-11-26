"use client";

import { Heart, LockKeyhole, LogOut, MapPin, PackageCheck, TicketPercent, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { logoutUser } from "../../services/authService";
import { useAuthStore } from "../../stores/authStore";
import { useCartStore } from "../../stores/cartStore";
import CategorySidebar from "../ui/CategorySidebar";

export default function Header() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const hydrateAuth = useAuthStore((state) => state.hydrate);
    const cartItems = useCartStore((state) => state.items);
    const refreshCart = useCartStore((state) => state.refresh);
    const [searchText, setSearchText] = useState("");

    const cartCount = useMemo(
        () => cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
        [cartItems],
    );
    const displayName = useMemo(
        () =>
            user?.name?.trim() ||
            [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
            "Khách hàng",
        [user],
    );

    const handleCatalogSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const keyword = searchText.trim();
        router.push(
            keyword
                ? `/products?search=${encodeURIComponent(keyword)}&page=1`
                : "/products",
        );
    };

    const handleLogout = async () => {
        router.replace("/");
        try {
            await logoutUser();
            toast.success("Đăng xuất thành công.");
        } catch {
            toast.error("Đăng xuất thất bại. Vui lòng thử lại.");
        } finally {
            hydrateAuth();
            await refreshCart();
        }
    };

    useEffect(() => {
        const syncStorageState = () => {
            hydrateAuth();
            void refreshCart();
        };

        void syncStorageState();
        window.addEventListener("storage", syncStorageState);
        window.addEventListener("auth-change", syncStorageState);
        window.addEventListener("cart-change", syncStorageState);
        return () => {
            window.removeEventListener("storage", syncStorageState);
            window.removeEventListener("auth-change", syncStorageState);
            window.removeEventListener("cart-change", syncStorageState);
        };
    }, [hydrateAuth, refreshCart]);

    return (
        <header className="site-header">
            <div className="sale-topbar">
                <div className="sale-marquee" aria-label="Thông báo khuyến mãi">
                    <span>Siêu sale chính hãng</span>
                    <strong>Flash Sale mỗi ngày</strong>
                    <span>Miễn phí giao hàng cho đơn đủ điều kiện</span>
                    <strong>Lưu voucher ngay</strong>
                    <Link href="/products">Xem ngay</Link>
                </div>
            </div>

            <div className="header-top">
                <div className="logo-wrap">
                    <Link
                        className="logo-link"
                        href="/"
                        aria-label="Về trang chủ">
                        <Image
                            src="/Logo_LuxBerry.png"
                            alt="LuxBerry Beauty"
                            width={240}
                            height={66}
                            priority
                            style={{
                                width: "auto",
                                height: "56px",
                                maxWidth: "100%",
                                objectFit: "contain",
                            }}
                        />
                    </Link>
                </div>

                <form className="search-wrap" onSubmit={handleCatalogSearch}>
                    <input
                        type="text"
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
                        placeholder="Tìm sản phẩm, thương hiệu, công dụng..."
                        aria-label="Tìm kiếm"
                    />
                    <button type="submit" aria-label="Tìm">
                        <span className="search-icon" aria-hidden="true" />
                    </button>
                </form>

                <div className="header-meta">
                    <div className="meta-item">
                        <span className="meta-icon" aria-hidden="true">
                            ☎
                        </span>
                        <div className="meta-box">
                            <strong>Hỗ trợ khách hàng</strong>
                            <span className="meta-phone">19006750</span>
                        </div>
                    </div>

                    <div
                        className={`meta-item${user ? " meta-account-hover" : ""}`}>
                        <span className="meta-icon is-user" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" />
                            </svg>
                        </span>

                        <div className="meta-box">
                            <strong>Tài khoản</strong>
                            {user ? (
                                <span className="meta-sub">
                                    Xin chào, {displayName}
                                </span>
                            ) : (
                                <Link className="meta-sub" href="/login">
                                    Đăng nhập
                                </Link>
                            )}
                        </div>

                        {user ? (
                            <span className="account-arrow" aria-hidden="true">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none">
                                    <path
                                        d="M7 10l5 5 5-5"
                                        stroke="#3a2c34"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </span>
                        ) : null}

                        {user ? (
                            <div
                                className="account-dropdown-menu"
                                role="menu"
                                aria-label="Tùy chọn tài khoản">
                                {user?.role === "admin" || user?.role === "staff" ? (
                                    <Link
                                        className="account-dropdown-item"
                                        href={user?.role === "staff" ? "/staff" : "/admin"}>
                                        <span
                                            className="account-dropdown-icon"
                                            aria-hidden="true">
                                            <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 20 20"
                                                fill="none">
                                                <rect
                                                    x="3"
                                                    y="3"
                                                    width="14"
                                                    height="14"
                                                    rx="3"
                                                    stroke="#f999b7"
                                                    strokeWidth="2"
                                                />
                                                <path
                                                    d="M6 10h8"
                                                    stroke="#f999b7"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                        </span>
                                        {user?.role === "staff" ? "Khu vực nhân viên" : "Quản trị hệ thống"}
                                    </Link>
                                ) : null}
                                <Link
                                    className="account-dropdown-item"
                                    href="/account">
                                    <span
                                        className="account-dropdown-icon"
                                        aria-hidden="true">
                                        <UserRound size={20} strokeWidth={1.8} />
                                    </span>
                                    Tài khoản của bạn
                                </Link>
                                <Link
                                    className="account-dropdown-item"
                                    href="/account/orders">
                                    <span
                                        className="account-dropdown-icon"
                                        aria-hidden="true">
                                        <PackageCheck size={20} strokeWidth={1.8} />
                                    </span>
                                    Đơn hàng của tôi
                                </Link>
                                <Link
                                    className="account-dropdown-item"
                                    href="/account/vouchers">
                                    <span
                                        className="account-dropdown-icon"
                                        aria-hidden="true">
                                        <TicketPercent size={20} strokeWidth={1.8} />
                                    </span>
                                    Voucher của tôi
                                </Link>
                                <Link
                                    className="account-dropdown-item"
                                    href="/favorites">
                                    <span
                                        className="account-dropdown-icon"
                                        aria-hidden="true">
                                        <Heart size={20} strokeWidth={1.8} />
                                    </span>
                                    Sản phẩm yêu thích
                                </Link>
                                <Link
                                    className="account-dropdown-item"
                                    href="/account/address">
                                    <span
                                        className="account-dropdown-icon"
                                        aria-hidden="true">
                                        <MapPin size={20} strokeWidth={1.8} />
                                    </span>
                                    Địa chỉ giao hàng
                                </Link>
                                <Link
                                    className="account-dropdown-item"
                                    href="/account/change-password">
                                    <span
                                        className="account-dropdown-icon"
                                        aria-hidden="true">
                                        <LockKeyhole size={20} strokeWidth={1.8} />
                                    </span>
                                    Đổi mật khẩu
                                </Link>
                                <button
                                    className="account-dropdown-item meta-logout"
                                    type="button"
                                    onClick={handleLogout}>
                                    <span
                                        className="account-dropdown-icon"
                                        aria-hidden="true">
                                        <LogOut size={20} strokeWidth={1.8} />
                                    </span>
                                    Đăng xuất
                                </button>
                            </div>
                        ) : null}
                    </div>

                    <Link className="cart-btn" href="/cart">
                        <span className="cart-icon" aria-hidden="true">
                            🛒
                        </span>
                        Giỏ hàng
                        <span className="cart-count">{cartCount}</span>
                    </Link>
                </div>
            </div>

            <div className="header-nav-wrap">
                <nav
                    className="header-nav container"
                    aria-label="Điều hướng chính">
                    <div className="header-category-menu">
                        <button
                            type="button"
                            className="menu-btn"
                            aria-haspopup="true">
                            <span className="menu-icon">☰</span>
                            Danh mục sản phẩm
                        </button>
                        <div className="header-category-dropdown">
                            <CategorySidebar showHeader={false} />
                        </div>
                    </div>
                    <Link href="/chinh-sach-doi-tra">Chính sách đổi trả</Link>
                    <Link href="/he-thong-cua-hang">Hệ thống cửa hàng</Link>
                    <Link href="/review-my-pham">GÓC LÀM ĐẸP LUXBERRY</Link>
                    <Link href="/tin-tuc-luxberry">Tin tức Luxberry</Link>
                </nav>
            </div>
        </header>
    );
}
