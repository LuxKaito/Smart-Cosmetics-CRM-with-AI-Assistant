import Link from "next/link";
import { CalendarDays, Sparkles } from "lucide-react";
import type { EditorialArticle } from "../../data/editorialContent";

const toneClasses: Record<EditorialArticle["tone"], string> = {
    rose: "from-[#FFE1EA] via-[#FFF4F7] to-[#F8BFD0]",
    beige: "from-[#F5E9E0] via-[#FFF9F4] to-[#EFD4C1]",
    peach: "from-[#FFE4D6] via-[#FFF7F1] to-[#FBC6B3]",
    lavender: "from-[#EEE5F8] via-[#FCF8FF] to-[#DCC8EF]",
};

export default function EditorialCard({
    article,
    href,
}: {
    article: EditorialArticle;
    href: string;
}) {
    return (
        <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#F4DEE6] bg-white shadow-[0_8px_20px_rgba(154,88,111,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(154,88,111,0.14)]">
            <Link
                href={href}
                aria-label={`Xem bài viết: ${article.title}`}
                className={`block aspect-video overflow-hidden bg-gradient-to-br ${toneClasses[article.tone]}`}>
                {article.imageUrl ? (
                    // The crawled workbook provides CDN URLs. Keep them external until local assets are supplied.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center p-5 text-[#B14063]">
                        <Sparkles className="h-8 w-8" />
                    </div>
                )}
            </Link>
            <div className="flex flex-1 flex-col p-4">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wide">
                    <span className="rounded-full bg-[#FFF0F5] px-2.5 py-1 text-[#B14063]">
                        {article.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#8A747D]">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {article.publishedAt}
                    </span>
                </div>
                <Link href={href} className="mt-3 block flex-1">
                    <h3 className="line-clamp-2 text-base font-bold leading-6 text-[#2B1B24] transition group-hover:text-[#B14063]">
                        {article.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#7A6A70]">
                        {article.summary}
                    </p>
                </Link>
            </div>
        </article>
    );
}
