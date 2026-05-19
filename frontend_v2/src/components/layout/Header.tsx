"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { logoutUser } from "../../services/authService";
import { useAuthStore } from "../../stores/authStore";
import { useCartStore } from "../../stores/cartStore";

const quickLinks = ["Kem chống nắng", "Son môi", "Bông tẩy trang", "Serum"];

export default function Header() {
    const user = useAuthStore((state) => state.user);
    const hydrateAuth = useAuthStore((state) => state.hydrate);
    const cartItems = useCartStore((state) => state.items);
    const hydrateCart = useCartStore((state) => state.hydrate);
    const syncCartFromCache = useCartStore((state) => state.syncFromCache);

    const cartCount = useMemo(
        () => cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
        [cartItems],
    );

    const handleLogout = async () => {
        try {
            await logoutUser();
            toast.success("Đăng xuất thành công.");
        } catch {
            toast.error("Đăng xuất thất bại. Vui lòng thử lại.");
        } finally {
            hydrateAuth();
            hydrateCart();
        }
    };

    useEffect(() => {
        const syncStorageState = () => {
            hydrateAuth();
            syncCartFromCache();
        };

        syncStorageState();
        window.addEventListener("storage", syncStorageState);
        window.addEventListener("auth-change", syncStorageState);
        window.addEventListener("cart-change", syncStorageState);
        return () => {
            window.removeEventListener("storage", syncStorageState);
            window.removeEventListener("auth-change", syncStorageState);
            window.removeEventListener("cart-change", syncStorageState);
        };
    }, [hydrateAuth, syncCartFromCache]);

    return (
        <header className="site-header">
            <div className="sale-topbar">
                <span>Siêu sale chính hãng</span>
                <strong>15-20 tháng 10</strong>
                <span>Miễn phí giao hàng</span>
                <strong>Chỉ 5 ngày</strong>
                <Link href="/products">Xem ngay</Link>
            </div>

            <div className="header-top">
                <div className="logo-wrap">
                    <Link
                        className="logo-link"
                        href="/"
                        aria-label="Về trang chủ">
                        <span className="logo-main">TK BEAUTY</span>
                    </Link>
                </div>

                <div className="search-wrap">
                    <input
                        type="text"
                        placeholder="Tìm theo thương hiệu."
                        aria-label="Tìm kiếm"
                    />
                    <button type="button" aria-label="Tìm">
                        <span className="search-icon" aria-hidden="true" />
                    </button>
                    <div className="quick-links">
                        {quickLinks.map((item) => (
                            <Link key={item} href="/products">
                                {item}
                            </Link>
                        ))}
                    </div>
                </div>

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
                                    Xin chào, {user.firstName || user.email}
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
                                {user?.role === "admin" ? (
                                    <Link
                                        className="account-dropdown-item"
                                        href="/admin">
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
                                        Quan tri he thong
                                    </Link>
                                ) : null}
                                <Link
                                    className="account-dropdown-item"
                                    href="/account">
                                    <span
                                        className="account-dropdown-icon"
                                        aria-hidden="true">
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 20 20"
                                            fill="none">
                                            <rect
                                                x="4"
                                                y="4"
                                                width="12"
                                                height="2"
                                                rx="1"
                                                fill="#f999b7"
                                            />
                                            <rect
                                                x="4"
                                                y="9"
                                                width="12"
                                                height="2"
                                                rx="1"
                                                fill="#f999b7"
                                            />
                                            <rect
                                                x="4"
                                                y="14"
                                                width="8"
                                                height="2"
                                                rx="1"
                                                fill="#f999b7"
                                            />
                                        </svg>
                                    </span>
                                    Tài khoản của bạn
                                </Link>
                                <Link
                                    className="account-dropdown-item"
                                    href="/orders">
                                    <span
                                        className="account-dropdown-icon"
                                        aria-hidden="true">
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 20 20"
                                            fill="none">
                                            <rect
                                                x="4"
                                                y="4"
                                                width="12"
                                                height="2"
                                                rx="1"
                                                fill="#f999b7"
                                            />
                                            <rect
                                                x="4"
                                                y="9"
                                                width="8"
                                                height="2"
                                                rx="1"
                                                fill="#f999b7"
                                            />
                                            <rect
                                                x="4"
                                                y="14"
                                                width="6"
                                                height="2"
                                                rx="1"
                                                fill="#f999b7"
                                            />
                                        </svg>
                                    </span>
                                    Lịch sử giao hàng
                                </Link>
                                <Link
                                    className="account-dropdown-item"
                                    href="/favorites">
                                    <span
                                        className="account-dropdown-icon"
                                        aria-hidden="true">
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 20 20"
                                            fill="none">
                                            <path
                                                d="M10 17l-1.45-1.32C5.4 13.36 2 10.28 2 7.5 2 5.5 3.5 4 5.5 4c1.54 0 3.04 1.04 3.57 2.36h1.87C11.46 5.04 12.96 4 14.5 4 16.5 4 18 5.5 18 7.5c0 2.78-3.4 5.86-6.55 8.18L10 17z"
                                                fill="#f999b7"
                                            />
                                        </svg>
                                    </span>
                                    Sản phẩm yêu thích
                                </Link>
                                <Link
                                    className="account-dropdown-item"
                                    href="/address">
                                    <span
                                        className="account-dropdown-icon"
                                        aria-hidden="true">
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 20 20"
                                            fill="none">
                                            <circle
                                                cx="10"
                                                cy="8"
                                                r="3"
                                                stroke="#f999b7"
                                                strokeWidth="2"
                                            />
                                            <path
                                                d="M10 2C6.13 2 3 5.13 3 9c0 5.25 7 9 7 9s7-3.75 7-9c0-3.87-3.13-7-7-7z"
                                                stroke="#f999b7"
                                                strokeWidth="2"
                                            />
                                        </svg>
                                    </span>
                                    Địa chỉ giao hàng
                                </Link>
                                <button
                                    className="account-dropdown-item meta-logout"
                                    type="button"
                                    onClick={handleLogout}>
                                    <span
                                        className="account-dropdown-icon"
                                        aria-hidden="true">
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 20 20"
                                            fill="none">
                                            <circle
                                                cx="10"
                                                cy="10"
                                                r="8"
                                                stroke="#f999b7"
                                                strokeWidth="2"
                                            />
                                            <path
                                                d="M13 10a3 3 0 11-6 0 3 3 0 016 0z"
                                                stroke="#f999b7"
                                                strokeWidth="2"
                                            />
                                        </svg>
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
                    <span className="menu-btn">
                        <span className="menu-icon">☰</span>
                        Danh mục sản phẩm
                    </span>
                    <Link href="/products">Chính sách đổi trả</Link>
                    <Link href="/news">Hệ thống cửa hàng</Link>
                    <Link href="/orders">Kiểm tra đơn hàng</Link>
                </nav>
            </div>
        </header>
    );
}
