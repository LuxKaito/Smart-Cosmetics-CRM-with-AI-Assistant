"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product } from "../../types/product";
import { hotProductGroups } from "../../data/hotProductGroups";
import ProductCard from "./ProductCard";

const normalizeCategory = (value: string) =>
    value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLocaleLowerCase("vi");

function productMatchesGroup(
    product: Product,
    category: string,
    subcategory: string,
) {
    const categoryValues = [product.category, product.category_level_1].filter(
        (value): value is string => Boolean(value),
    );
    const subcategoryValues = [
        product.subcategory,
        product.category_level_2,
        product.product_type,
    ].filter((value): value is string => Boolean(value));
    const targetCategory = normalizeCategory(category);
    const targetSubcategory = normalizeCategory(subcategory);

    return (
        categoryValues.some((value) => normalizeCategory(value) === targetCategory) &&
        subcategoryValues.some((value) => normalizeCategory(value) === targetSubcategory)
    );
}

export default function HotProductsSection({
    products,
}: {
    products: Product[];
}) {
    const [activePage, setActivePage] = useState(0);

    const populatedGroups = useMemo(
        () =>
            hotProductGroups
                .map((group) => ({
                    ...group,
                    products: products
                        .filter((product) =>
                            productMatchesGroup(product, group.category, group.subcategory),
                        )
                        .slice(0, 2),
                }))
                .filter((group) => group.products.length > 0),
        [products],
    );

    const pages = useMemo(() => {
        const result: (typeof populatedGroups)[] = [];
        for (let index = 0; index < populatedGroups.length; index += 2) {
            result.push(populatedGroups.slice(index, index + 2));
        }
        return result;
    }, [populatedGroups]);

    const pageIndex = Math.min(activePage, Math.max(0, pages.length - 1));
    const visibleGroups = pages[pageIndex] || [];

    const changePage = (direction: number) => {
        if (pages.length < 2) return;
        setActivePage((current) => (current + direction + pages.length) % pages.length);
    };

    return (
        <section className="hot-products-section" aria-label="LuxBerry có gì hot">
            <header className="hot-products-header">
                <h2 className="hot-products-title">LuxBerry có gì HOT?</h2>
                {pages.length > 0 ? (
                    <nav className="hot-products-pagination" aria-label="Trang nhóm sản phẩm nổi bật">
                        {pages.map((_, index) => (
                            <button
                                key={index}
                                type="button"
                                className={`hot-products-page${index === pageIndex ? " is-active" : ""}`}
                                onClick={() => setActivePage(index)}
                                aria-label={`Trang ${index + 1}`}
                                aria-current={index === pageIndex ? "page" : undefined}>
                                {index + 1}
                            </button>
                        ))}
                    </nav>
                ) : null}
            </header>

            {visibleGroups.length > 0 ? (
                <div className="hot-products-slider">
                    <button
                        type="button"
                        className="hot-products-arrow is-prev"
                        onClick={() => changePage(-1)}
                        disabled={pages.length < 2}
                        aria-label="Xem nhóm sản phẩm trước">
                        <span aria-hidden="true">‹</span>
                    </button>

                    <div
                        className={`hot-products-slide${visibleGroups.length === 1 ? " is-single" : ""}`}
                        aria-live="polite">
                        {visibleGroups.map((group) => (
                            <article className="hot-products-group" key={group.id}>
                                <div className="hot-products-banner">
                                    {group.bannerImage ? (
                                        <Image
                                            src={group.bannerImage}
                                            alt=""
                                            fill
                                            sizes="(max-width: 720px) 100vw, 50vw"
                                            className="hot-products-banner-image"
                                            unoptimized
                                        />
                                    ) : null}
                                </div>

                                <div className="hot-products-group-heading">
                                    <h3>{group.title}</h3>
                                    <Link href={group.href} className="view-more-action">Xem thêm</Link>
                                </div>

                                <div className="hot-products-items">
                                    {group.products.map((product, index) => (
                                        <ProductCard
                                            key={`${product._id || product.id || product.name}-${index}`}
                                            item={product}
                                            realDataOnly
                                            showOfficialBadge
                                        />
                                    ))}
                                </div>
                            </article>
                        ))}
                    </div>

                    <button
                        type="button"
                        className="hot-products-arrow is-next"
                        onClick={() => changePage(1)}
                        disabled={pages.length < 2}
                        aria-label="Xem nhóm sản phẩm tiếp theo">
                        <span aria-hidden="true">›</span>
                    </button>
                </div>
            ) : (
                <p className="hot-products-empty">
                    Chưa có sản phẩm phù hợp để hiển thị ở mục này.
                </p>
            )}
        </section>
    );
}
