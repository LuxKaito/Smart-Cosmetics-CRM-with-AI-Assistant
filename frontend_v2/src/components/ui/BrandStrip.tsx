"use client";

import Link from "next/link";
import Image from "next/image";
import {
    useEffect,
    useRef,
    useState,
    type PointerEvent as ReactPointerEvent,
} from "react";

interface BrandShowcaseItem {
    id: string;
    name?: string;
    image?: string;
}

interface BrandShowcase {
    items: BrandShowcaseItem[];
}

export default function BrandStrip({
    brandShowcase,
}: {
    brandShowcase?: BrandShowcase | null;
}) {
    const items = brandShowcase?.items ?? [];
    const [activeIndex, setActiveIndex] = useState(() =>
        Math.min(11, Math.max(0, items.length - 1)),
    );
    const [visibleCount, setVisibleCount] = useState(5);
    const [viewportWidth, setViewportWidth] = useState(1280);
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isInteracting, setIsInteracting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);
    const pointerStartX = useRef<number | null>(null);
    const dragged = useRef(false);
    const isPaused = isHovered || isFocused || isInteracting || reducedMotion;

    useEffect(() => {
        const updateViewport = () => {
            const width = window.innerWidth;
            setViewportWidth(width);
            setVisibleCount(width <= 640 ? 3 : 5);
        };

        updateViewport();
        window.addEventListener("resize", updateViewport, { passive: true });
        return () => window.removeEventListener("resize", updateViewport);
    }, []);

    useEffect(() => {
        const motionPreference = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        );
        const updateMotionPreference = () =>
            setReducedMotion(motionPreference.matches);

        updateMotionPreference();
        motionPreference.addEventListener("change", updateMotionPreference);
        return () =>
            motionPreference.removeEventListener("change", updateMotionPreference);
    }, []);

    useEffect(() => {
        if (items.length < 2 || isPaused) return;

        const autoplay = window.setInterval(() => {
            setActiveIndex((current) => (current + 1) % items.length);
        }, 3600);

        return () => window.clearInterval(autoplay);
    }, [items.length, isPaused]);

    if (!brandShowcase) {
        return null;
    }

    const moveCarousel = (direction: number) => {
        if (items.length < 2) return;
        setActiveIndex((current) =>
            (current + direction + items.length) % items.length,
        );
    };

    const slotCount = Math.min(visibleCount, items.length);
    const visibleSlots = Array.from(
        { length: slotCount },
        (_, slotIndex) => slotIndex - Math.floor(slotCount / 2),
    );

    const getCardStyle = (slotIndex: number) => {
        const center = (slotCount - 1) / 2;
        const normalized = center === 0 ? 0 : (slotIndex - center) / center;
        const distance = Math.abs(normalized);
        const edgeInset = slotCount <= 3 ? 14 : 8;
        const progress = slotCount === 1 ? 0.5 : slotIndex / (slotCount - 1);
        const horizontalPosition = edgeInset + progress * (100 - edgeInset * 2);
        const arcDepth = Math.min(130, Math.max(72, viewportWidth * 0.069));
        const verticalOffset = -22 + Math.pow(distance, 1.65) * arcDepth;
        const rotation = normalized * 16;
        const scale = 1.04 - distance * 0.14;

        return {
            left: 0,
            zIndex: Math.round(10 - distance * 5),
            transform: `translate3d(calc(${horizontalPosition}cqw - 50%), calc(-50% + ${verticalOffset}px), 0) rotateZ(${rotation}deg) scale(${scale})`,
        };
    };

    const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        if (event.target instanceof Element && event.target.closest("button")) return;
        pointerStartX.current = event.clientX;
        dragged.current = false;
        setIsInteracting(true);
    };

    const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (pointerStartX.current === null || dragged.current) return;
        if (Math.abs(event.clientX - pointerStartX.current) > 8) {
            dragged.current = true;
            setIsDragging(true);
            event.currentTarget.setPointerCapture(event.pointerId);
        }
    };

    const finishPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
        const startX = pointerStartX.current;
        if (startX === null) return;

        pointerStartX.current = null;
        setIsDragging(false);
        setIsInteracting(false);

        if (Math.abs(event.clientX - startX) > 45) {
            dragged.current = true;
            moveCarousel(event.clientX < startX ? 1 : -1);
        }
    };

    const cancelPointer = () => {
        pointerStartX.current = null;
        setIsDragging(false);
        setIsInteracting(false);
    };

    return (
        <section className="brand-section brand-showcase brand-showcase--orbit">
            <div className="brand-showcase-header">
                <h2>TOP THƯƠNG HIỆU NỔI BẬT</h2>
            </div>

            <div
                className={`brand-showcase-orbit${isDragging ? " is-dragging" : ""}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onFocusCapture={() => setIsFocused(true)}
                onBlurCapture={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                        setIsFocused(false);
                    }
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={finishPointer}
                onPointerCancel={cancelPointer}
                onClickCapture={(event) => {
                    if (dragged.current) {
                        event.preventDefault();
                        event.stopPropagation();
                        dragged.current = false;
                    }
                }}>
                <button
                    type="button"
                    className="brand-showcase-nav home-carousel-arrow home-carousel-arrow--prev is-left"
                    aria-label="Xem thương hiệu trước"
                    onClick={() => moveCarousel(-1)}>
                    ‹
                </button>
                <button
                    type="button"
                    className="brand-showcase-nav home-carousel-arrow home-carousel-arrow--next is-right"
                    aria-label="Xem thương hiệu tiếp theo"
                    onClick={() => moveCarousel(1)}>
                    ›
                </button>

                <div
                    className="brand-showcase-track brand-showcase-track--orbit"
                    role="list">
                    {visibleSlots.map((offset, slotIndex) => {
                        const itemIndex =
                            (activeIndex + offset + items.length) % items.length;
                        const item = items[itemIndex];
                        const href = item.name
                            ? `/products?brand=${encodeURIComponent(item.name)}`
                            : "/products";

                        return (
                            <Link
                                key={item.id}
                                href={href}
                                className={`brand-showcase-card brand-showcase-card--orbit${item.image ? "" : " is-placeholder"}`}
                                role="listitem"
                                aria-label={`Xem sản phẩm thương hiệu ${item.name || "nổi bật"}`}
                                draggable={false}
                                style={getCardStyle(slotIndex)}>
                                {item.image ? (
                                    <Image
                                        className="brand-showcase-card-asset"
                                        src={item.image}
                                        alt=""
                                        fill
                                        sizes="(max-width: 640px) 24vw, (max-width: 1199px) 16vw, 18vw"
                                        draggable={false}
                                    />
                                ) : null}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
