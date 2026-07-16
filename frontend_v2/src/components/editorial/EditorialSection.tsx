import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { EditorialArticle } from "../../data/editorialContent";
import EditorialCard from "./EditorialCard";

export default function EditorialSection({
    title,
    description,
    articles,
    viewAllHref,
    articleBaseHref,
}: {
    title: string;
    description: string;
    articles: EditorialArticle[];
    viewAllHref: string;
    articleBaseHref?: string;
}) {
    return (
        <section className="py-5">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-[#2B1B24]">{title}</h2>
                    <p className="mt-1 text-sm text-[#7A6A70]">{description}</p>
                </div>
                <Link
                    href={viewAllHref}
                    className="inline-flex items-center gap-1 text-sm font-bold text-[#B14063]">
                    Xem tất cả
                    <ArrowRight className="h-4 w-4" />
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
