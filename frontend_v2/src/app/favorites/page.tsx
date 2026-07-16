"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Footer from "../../components/layout/Footer";
import Header from "../../components/layout/Header";
import ProductCard from "../../components/ui/ProductCard";
import { fetchFavoriteProducts } from "../../services/favoriteService";
import { useAuthStore } from "../../stores/authStore";
import type { Product } from "../../types/product";

export default function FavoritesPage() {
    const user = useAuthStore((state) => state.user);
    const userId = user?._id || user?.email;
    const savedProductIds = user?.savedProductIds || [];
    const hydrated = useAuthStore((state) => state.hydrated);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (!hydrated) return;
        if (!userId) {
            setIsLoading(false);
            return;
        }

        let isMounted = true;
        setIsLoading(true);
        fetchFavoriteProducts()
            .then((data) => {
                if (isMounted) setProducts(data.items || []);
            })
            .catch((error) => {
                if (isMounted) {
                    setErrorMessage(
                        error instanceof Error
                            ? error.message
                            : "Không thể tải danh sách sản phẩm yêu thích.",
                    );
                }
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [hydrated, userId]);

    const visibleProducts = products.filter((product) => {
        const productId = product._id || product.id;
        return productId && savedProductIds.includes(productId);
    });

    return (
        <div className="page-shell">
            <Header />
            <main className="main-content container catalog-page">
                <section className="catalog-hero">
                    <p className="section-kicker">Tài khoản</p>
                    <h1>Sản phẩm yêu thích</h1>
                    <p>Lưu lại những sản phẩm bạn quan tâm để xem lại nhanh hơn.</p>
                </section>

                {!hydrated || isLoading ? (
                    <p>Đang tải danh sách sản phẩm yêu thích...</p>
                ) : !user ? (
                    <p>
                        Vui lòng <Link href="/login">đăng nhập</Link> để xem sản
                        phẩm yêu thích.
                    </p>
                ) : errorMessage ? (
                    <div className="auth-message is-error">{errorMessage}</div>
                ) : visibleProducts.length ? (
                    <div className="product-grid">
                        {visibleProducts.map((product) => (
                            <ProductCard
                                key={product._id || product.id}
                                item={product}
                            />
                        ))}
                    </div>
                ) : (
                    <p>Bạn chưa lưu sản phẩm yêu thích nào.</p>
                )}
            </main>
            <Footer />
        </div>
    );
}
