import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { EditorialArticle } from "../../data/editorialContent";

export default function EditorialSection({
    title,
    articles,
    viewAllHref,
    articleBaseHref,
}: {
    title: string;
    articles: EditorialArticle[];
    viewAllHref: string;
    articleBaseHref?: string;
}) {
    return (
        <section className="home-editorial-section py-5">
            <div className="home-editorial-header">
                <h2 className="home-editorial-title">{title}</h2>
            </div>
            <div className="home-editorial-mosaic">
                {articles.slice(0, 8).map((article) => {
                    const href = articleBaseHref
                        ? `${articleBaseHref}/${article.slug}`
                        : `${viewAllHref}#${article.slug}`;

                    return (
                        <Link
                            key={article.slug}
                            href={href}
                            aria-label={`Xem bài viết: ${article.title}`}
                            data-motion-card
                            className="home-editorial-tile">
                            <span className="home-editorial-tile-media">
                                {article.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={article.imageUrl}
                                        alt={article.title}
                                        className="home-editorial-tile-image"
                                    />
                                ) : (
                                    <span className="home-editorial-tile-placeholder">
                                        <Sparkles aria-hidden="true" />
                                    </span>
                                )}
                            </span>
                            <span className="home-editorial-tile-content">
                                <span className="home-editorial-tile-category">
                                    {article.category}
                                </span>
                                <span className="home-editorial-tile-title">
                                    {article.title}
                                </span>
                                <span className="home-editorial-tile-link">
                                    Xem thêm
                                </span>
                            </span>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
