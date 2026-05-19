import Image from "next/image";

interface CategoryIconItem {
    label: string;
    image?: string;
    highlight?: boolean;
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

                    return (
                        <article
                            key={`${iconItem.label}-${index}`}
                            className="category-icon-card">
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
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
