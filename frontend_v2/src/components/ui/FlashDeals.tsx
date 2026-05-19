"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
import type { Product } from "../../types/product";
import ProductCard, { enrichProducts } from "./ProductCard";

interface FlashDealsProps {
    deals: Product[];
    title?: string;
    showTimer?: boolean;
    variant?: "hot" | "plain";
}

export default function FlashDeals({
    deals,
    title = "Flash Deals",
    showTimer = true,
    variant = "hot",
}: FlashDealsProps) {
    const trackRef = useRef<HTMLDivElement | null>(null);
    const enrichedDeals = useMemo(
        () =>
            enrichProducts(
                Array.isArray(deals) ? deals : [],
                title.toUpperCase(),
            ),
        [deals, title],
    );

    if (enrichedDeals.length === 0) {
        return null;
    }

    const scrollByCards = (direction: number) => {
        const track = trackRef.current;
        if (!track) return;

        const step = 240;
        const maxScrollLeft = track.scrollWidth - track.clientWidth;

        if (direction > 0 && track.scrollLeft >= maxScrollLeft - 8) {
            track.scrollTo({ left: 0, behavior: "smooth" });
            return;
        }

        if (direction < 0 && track.scrollLeft <= 8) {
            track.scrollTo({ left: maxScrollLeft, behavior: "smooth" });
            return;
        }

        track.scrollBy({ left: direction * step, behavior: "smooth" });
    };

    const sectionClassName = `flash-deals${variant === "plain" ? " is-plain" : ""}`;

    return (
        <section className={sectionClassName} aria-label={title}>
            <div className="flash-deals-header">
                <div className="flash-deals-title">
                    <h2>{title}</h2>
                    {showTimer ? (
                        <div
                            className="flash-deals-timer"
                            aria-label="Thời gian đếm ngược">
                            <span>01</span>
                            <span>:</span>
                            <span>34</span>
                            <span>:</span>
                            <span>47</span>
                        </div>
                    ) : null}
                </div>
                <Link href="/products" className="flash-deals-all">
                    Xem tất cả
                </Link>
            </div>

            <div className="flash-deals-track-wrap">
                <button
                    type="button"
                    className="flash-deals-nav is-left"
                    aria-label="Xem sản phẩm trước"
                    onClick={() => scrollByCards(-1)}>
                    ‹
                </button>
                <button
                    type="button"
                    className="flash-deals-nav is-right"
                    aria-label="Xem sản phẩm tiếp theo"
                    onClick={() => scrollByCards(1)}>
                    ›
                </button>

                <div ref={trackRef} className="flash-deals-track" role="list">
                    {enrichedDeals.map((deal, index) => (
                        <div
                            key={`${deal._id || deal.id || deal.name}-${index}`}
                            className="flash-deal-item"
                            role="listitem">
                            <ProductCard item={deal} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
