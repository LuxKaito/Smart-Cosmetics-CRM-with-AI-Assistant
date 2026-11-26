"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState } from "react";
import { fetchProductById, fetchProducts } from "../../services/productService";
import type { Product } from "../../types/product";
import ProductCard from "./ProductCard";

const maxRecommendations = 16;

async function loadRecommendations(cartProductIds: string[]) {
    const excludedIds = new Set(cartProductIds);
    const cartProducts = await Promise.allSettled(cartProductIds.slice(0, 3).map(fetchProductById));
    const categories = new Set<string>();
    for (const result of cartProducts) {
        if (result.status === "fulfilled" && result.value?.category) categories.add(result.value.category);
    }

    const recommendations = new Map<string, Product>();
    const collect = (products: Product[]) => {
        for (const product of products) {
            if (recommendations.size >= maxRecommendations) break;
            const id = product._id || product.id;
            if (id && !excludedIds.has(id) && !recommendations.has(id)) recommendations.set(id, product);
        }
    };

    const query = { limit: maxRecommendations, inStock: true, sort: "-soldCount" };
    const categoryResults = await Promise.allSettled(
        Array.from(categories, (category) => fetchProducts({ ...query, category })),
    );
    for (const result of categoryResults) {
        if (result.status === "fulfilled") collect(result.value.items);
    }

    if (recommendations.size < maxRecommendations) {
        const popular = await fetchProducts({ ...query, limit: 40 }).catch(() => null);
        if (popular) collect(popular.items);
    }

    return Array.from(recommendations.entries());
}

export default function CartRecommendations({ cartProductIds }: { cartProductIds: string[] }) {
    const trackRef = useRef<HTMLUListElement>(null);
    const trackId = useId();
    const headingId = useId();
    const [edges, setEdges] = useState({ atStart: true, atEnd: true });
    const { data } = useQuery({
        queryKey: ["cart-recommendations", cartProductIds],
        queryFn: () => loadRecommendations(cartProductIds),
        staleTime: 60_000,
    });

    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;

        const updateEdges = () => {
            setEdges({
                atStart: track.scrollLeft <= 1,
                atEnd: track.scrollLeft + track.clientWidth >= track.scrollWidth - 1,
            });
        };
        const observer = new ResizeObserver(updateEdges);
        observer.observe(track);
        track.addEventListener("scroll", updateEdges, { passive: true });
        updateEdges();
        return () => {
            observer.disconnect();
            track.removeEventListener("scroll", updateEdges);
        };
    }, [data]);

    const scroll = (direction: -1 | 1) => {
        const track = trackRef.current;
        if (!track) return;
        track.scrollBy({
            left: direction * track.clientWidth,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        });
    };

    if (!data?.length) return null;

    return (
        <section aria-labelledby={headingId} className="mt-10 border-t border-[#F4DCE6] pt-5">
            <h2 id={headingId} className="cart-page-heading mb-4">Thường được mua cùng</h2>
            <div className="relative">
                <ul id={trackId} ref={trackRef} className="flex snap-x snap-mandatory gap-3 overflow-x-auto py-2 sm:gap-4">
                    {data.map(([productId, product]) => (
                        <li key={productId} className="min-w-0 basis-[172px] shrink-0 snap-start sm:basis-[calc((100%_-_2rem)/3)] lg:basis-[calc((100%_-_4rem)/5)] [&>article]:mx-auto [&>article]:h-full [&>article]:w-[94%]">
                            <ProductCard item={product} realDataOnly showOfficialBadge />
                        </li>
                    ))}
                </ul>
                {!edges.atStart ? (
                    <button type="button" aria-label="Xem sản phẩm trước" aria-controls={trackId} onClick={() => scroll(-1)}
                        className="home-carousel-arrow home-carousel-arrow--prev absolute left-1 top-1/2 z-20 -translate-y-1/2" />
                ) : null}
                {!edges.atEnd ? (
                    <button type="button" aria-label="Xem sản phẩm tiếp theo" aria-controls={trackId} onClick={() => scroll(1)}
                        className="home-carousel-arrow home-carousel-arrow--next absolute right-1 top-1/2 z-20 -translate-y-1/2" />
                ) : null}
            </div>
        </section>
    );
}
