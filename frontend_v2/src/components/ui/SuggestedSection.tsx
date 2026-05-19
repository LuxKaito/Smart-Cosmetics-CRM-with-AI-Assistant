"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchHomeProducts } from "../../services/productService";
import type { Product } from "../../types/product";
import ProductCard, { enrichProducts } from "./ProductCard";

interface SuggestedSectionProps {
    title: string;
    products?: Product[];
}

export default function SuggestedSection({
    title,
    products = [],
}: SuggestedSectionProps) {
    const [remoteProducts, setRemoteProducts] = useState<Product[]>([]);

    useEffect(() => {
        let isMounted = true;

        const loadProducts = async () => {
            try {
                const data = await fetchHomeProducts();
                if (isMounted && Array.isArray(data) && data.length > 0) {
                    setRemoteProducts(data);
                }
            } catch {
                // Fallback products keep the section useful when the API is offline.
            }
        };

        loadProducts();

        return () => {
            isMounted = false;
        };
    }, []);

    const sourceProducts =
        remoteProducts.length > 0 ? remoteProducts : products;
    const enrichedProducts = enrichProducts(sourceProducts, "Gợi ý cho bạn");

    if (enrichedProducts.length === 0) {
        return null;
    }

    return (
        <section className="suggest-section" aria-label={title}>
            <div className="section-head beauty-section-head">
                <div>
                    <h2>{title}</h2>
                </div>
            </div>

            <div className="product-grid suggest-grid">
                {enrichedProducts.slice(0, 18).map((item, index) => (
                    <ProductCard
                        key={`${item._id || item.id || item.name}-${index}`}
                        item={item}
                    />
                ))}
            </div>

            <Link href="/products" className="suggest-more">
                Xem thêm
            </Link>
        </section>
    );
}
