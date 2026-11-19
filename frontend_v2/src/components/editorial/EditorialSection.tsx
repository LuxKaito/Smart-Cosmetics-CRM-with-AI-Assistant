import Link from "next/link";
import type { EditorialArticle } from "../../data/editorialContent";
import EditorialCard from "./EditorialCard";

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
                <Link
                    href={viewAllHref}
                    className="view-more-action home-editorial-all">
                    Xem tất cả
                </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {articles.slice(0, 4).map((article) => (
                    <EditorialCard
                        key={article.slug}
                        article={article}
                        href={
                            articleBaseHref
                                ? `${articleBaseHref}/${article.slug}`
                                : `${viewAllHref}#${article.slug}`
                        }
                    />
                ))}
            </div>
        </section>
    );
}
