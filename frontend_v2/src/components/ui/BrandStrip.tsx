"use client";

import Link from "next/link";
import { useRef } from "react";

interface BrandShowcaseItem {
    id: string;
    name?: string;
    image?: string;
}

interface BrandShowcase {
    hero: {
        image?: string;
        label?: string;
    };
    items: BrandShowcaseItem[];
}

export default function BrandStrip({
    brandShowcase,
}: {
    brandShowcase?: BrandShowcase | null;
}) {
    const trackRef = useRef<HTMLDivElement | null>(null);

    if (!brandShowcase) {
        return null;
    }

    const { hero, items } = brandShowcase;

    const scrollTrack = (direction: number) => {
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

    return (
        <section className="brand-section brand-showcase">
            <div className="brand-showcase-header">
                <div>
                    <h2>Thương hiệu được yêu thích</h2>
                </div>
                <Link href="/products" className="brand-showcase-all">
                    Xem tất cả
                </Link>
            </div>

            <div className="brand-showcase-body">
                <article
                    className={`brand-hero${hero.image ? "" : " is-placeholder"}`}
                    style={
                        hero.image
                            ? { backgroundImage: `url(${hero.image})` }
                            : undefined
                    }
                    aria-label={hero.label}>
                    <div>
                        <span>Brand week</span>
                        <h3>Ưu đãi thương hiệu đến 45%</h3>
                    </div>
                </article>

                <div className="brand-showcase-track-wrap">
                    <button
                        type="button"
                        className="brand-showcase-nav is-left"
                        aria-label="Xem thương hiệu trước"
                        onClick={() => scrollTrack(-1)}>
                        ‹
                    </button>
                    <button
                        type="button"
                        className="brand-showcase-nav is-right"
                        aria-label="Xem thương hiệu tiếp theo"
                        onClick={() => scrollTrack(1)}>
                        ›
                    </button>

                    <div
                        ref={trackRef}
                        className="brand-showcase-track"
                        role="list">
                        {items.map((item) => (
                            <article
                                key={item.id}
                                className={`brand-showcase-card${item.image ? "" : " is-placeholder"}`}
                                role="listitem"
                                style={
                                    item.image
                                        ? {
                                              backgroundImage: `url(${item.image})`,
                                          }
                                        : undefined
                                }
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
