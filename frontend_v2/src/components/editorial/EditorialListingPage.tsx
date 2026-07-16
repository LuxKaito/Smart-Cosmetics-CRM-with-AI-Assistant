import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { EditorialArticle } from "../../data/editorialContent";
import Footer from "../layout/Footer";
import Header from "../layout/Header";
import EditorialCard from "./EditorialCard";

export default function EditorialListingPage({
    title,
    description,
    featuredTitle,
    articles,
    categories,
    articleBaseHref,
}: {
    title: string;
    description: string;
    featuredTitle: string;
    articles: EditorialArticle[];
    categories?: string[];
    articleBaseHref?: string;
}) {
    return (
        <div className="min-h-screen bg-[#FFF9FB] text-[#2B1B24]">
            <Header />
            <main className="mx-auto max-w-6xl px-4 py-8">
                <nav className="flex items-center gap-1 text-sm text-[#8A747D]">
                    <Link href="/" className="hover:text-[#B14063]">
                        Trang chủ
                    </Link>
                    <ChevronRight className="h-4 w-4" />
                    <span>{title}</span>
                </nav>

                <header className="mt-5 rounded-[28px] border border-[#F4DEE6] bg-white p-6 shadow-[0_10px_28px_rgba(154,88,111,0.08)] md:p-8">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B14063]">
                        Góc làm đẹp LuxBerry
                    </p>
                    <h1 className="mt-2 text-3xl font-bold md:text-4xl">{title}</h1>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-[#7A6A70]">
                        {description}
                    </p>
                </header>

                <section className="mt-8">
                    <h2 className="text-2xl font-bold">{featuredTitle}</h2>
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                        {articles.slice(0, 3).map((article) => (
                            <EditorialCard
                                key={article.slug}
                                article={article}
                                href={
                                    articleBaseHref
                                        ? `${articleBaseHref}/${article.slug}`
                                        : `#${article.slug}`
                                }
                            />
                        ))}
                    </div>
                </section>

                <div
                    className={`mt-10 grid gap-6 ${
                        categories ? "lg:grid-cols-[220px_1fr]" : ""
                    }`}>
                    {categories ? (
                        <aside className="h-fit rounded-2xl border border-[#F4DEE6] bg-white p-4">
                            <h2 className="font-bold">Danh mục bài viết</h2>
                            <ul className="mt-3 space-y-1 text-sm text-[#6E5962]">
                                {categories.map((category) => (
                                    <li key={category}>
                                        <a
                                            href="#danh-sach-bai-viet"
                                            className="block rounded-lg px-3 py-2 transition hover:bg-[#FFF0F5] hover:text-[#B14063]">
                                            {category}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </aside>
                    ) : null}

                    <section id="danh-sach-bai-viet">
                        <div className="flex items-end justify-between gap-3">
                            <div>
                                <h2 className="text-2xl font-bold">
                                    Danh sách bài viết
                                </h2>
                                <p className="mt-1 text-sm text-[#7A6A70]">
                                    Nội dung chọn lọc và cập nhật từ LuxBerry.
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {articles.map((article) => (
                                <div key={article.slug} id={article.slug} className="h-full">
                                    <EditorialCard
                                        article={article}
                                        href={
                                            articleBaseHref
                                                ? `${articleBaseHref}/${article.slug}`
                                                : `#${article.slug}`
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            className="mx-auto mt-6 block rounded-xl border border-[#F4C9D7] bg-white px-5 py-3 text-sm font-bold text-[#B14063] transition hover:bg-[#FFF0F5]">
                            Xem thêm
                        </button>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}
