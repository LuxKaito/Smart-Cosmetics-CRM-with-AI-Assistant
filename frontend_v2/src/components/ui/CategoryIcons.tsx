import Image from "next/image";
import Link from "next/link";

interface CategoryIconItem {
    label: string;
    image?: string;
    highlight?: boolean;
    href?: string;
}

interface CategoryIconsProps {
    items: Array<CategoryIconItem | string>;
}

export default function CategoryIcons({ items }: CategoryIconsProps) {
    return (
        <section className="category-icons-section">
            <div className="section-head beauty-section-head">
                <div>
                    <h2>Danh mục nổi bật</h2>
                </div>
            </div>
            <div className="category-icon-row">
                {items.map((item, index) => {
                    const iconItem =
                        typeof item === "string" ? { label: item } : item;

                    const content = (
                        <>
                            <div className="icon-circle">
                                {iconItem.image ? (
                                    <Image
                                        src={iconItem.image}
                                        alt={iconItem.label}
                                        width={72}
                                        height={72}
                                        loading="lazy"
                                    />
                                ) : (
                                    <span>✦</span>
                                )}
                            </div>
                            <p
                                className={
                                    iconItem.highlight ? "is-highlight" : ""
                                }>
                                {iconItem.label}
                            </p>
                        </>
                    );

                    return iconItem.href ? (
                        <Link
                            key={`${iconItem.label}-${index}`}
                            className="category-icon-card"
                            href={iconItem.href}>
                            {content}
                        </Link>
                    ) : (
                        <article
                            key={`${iconItem.label}-${index}`}
                            className="category-icon-card">
                            {content}
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
