"use client";

import { useRef } from "react";

interface QuickItem {
    id: string;
    image: string;
    name: string;
    count?: string;
    sold?: string;
}

interface QuickSectionProps {
    title: string;
    items: QuickItem[];
    variant?: "small" | "large";
}

export default function QuickSection({
    title,
    items,
    variant = "small",
}: QuickSectionProps) {
    const trackRef = useRef<HTMLDivElement | null>(null);
    const isLarge = variant === "large";

    if (!Array.isArray(items) || items.length === 0) {
        return null;
    }

    const scrollByCards = (direction: number) => {
        const track = trackRef.current;
        if (!track) return;

        const step = isLarge ? 240 : 190;
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

    return (
        <section className="quick-strip" aria-label={title}>
            <div className="quick-strip-header">
                <h2>{title}</h2>
            </div>

            <div className="quick-strip-track-wrap">
                <button
                    type="button"
                    className="quick-strip-nav is-left"
                    aria-label="Xem mục trước"
                    onClick={() => scrollByCards(-1)}>
                    ‹
                </button>
                <button
                    type="button"
                    className="quick-strip-nav is-right"
                    aria-label="Xem mục tiếp theo"
                    onClick={() => scrollByCards(1)}>
                    ›
                </button>

                <div
                    ref={trackRef}
                    className={`quick-strip-track${isLarge ? " is-large" : ""}`}
                    role="list">
                    {items.map((item) => (
                        <article
                            key={item.id}
                            className={`quick-card${isLarge ? " is-large" : ""}`}
                            role="listitem">
                            <div
                                className="quick-card-image"
                                style={{
                                    backgroundImage: `url(${item.image})`,
                                }}
                            />
                            <div className="quick-card-body">
                                <h3 className="quick-card-title">
                                    {item.name}
                                </h3>
                                <p className="quick-card-meta">
                                    {isLarge ? item.count : item.sold}
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
