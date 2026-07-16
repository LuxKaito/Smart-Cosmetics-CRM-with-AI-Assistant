"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
    title = "Flash Sale",
    showTimer = true,
    variant = "hot",
}: FlashDealsProps) {
    const trackRef = useRef<HTMLDivElement | null>(null);
    const [remainingMs, setRemainingMs] = useState(0);
    const enrichedDeals = useMemo(
        () =>
            enrichProducts(
                Array.isArray(deals) ? deals : [],
                title.toUpperCase(),
            ),
        [deals, title],
    );

    useEffect(() => {
        if (!showTimer) return;

        const resolveRemaining = () => {
            const now = new Date();
            const endOfDay = new Date(now);
            endOfDay.setHours(23, 59, 59, 999);
            setRemainingMs(Math.max(0, endOfDay.getTime() - now.getTime()));
        };

        resolveRemaining();
        const timer = window.setInterval(resolveRemaining, 1000);
        return () => window.clearInterval(timer);
    }, [showTimer]);

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
    const hours = Math.floor(remainingMs / 3600000);
    const minutes = Math.floor((remainingMs % 3600000) / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    const timerParts = [hours, minutes, seconds].map((value) =>
        String(value).padStart(2, "0"),
    );

    return (
        <section className={sectionClassName} aria-label={title}>
            <div className="flash-deals-header">
                <div className="flash-deals-title">
                    <h2>{title}</h2>
                    {showTimer ? (
                        <div
                            className="flash-deals-timer"
                            aria-label="Thời gian đếm ngược">
                            <span>{timerParts[0]}</span>
                            <span>:</span>
                            <span>{timerParts[1]}</span>
                            <span>:</span>
                            <span>{timerParts[2]}</span>
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
