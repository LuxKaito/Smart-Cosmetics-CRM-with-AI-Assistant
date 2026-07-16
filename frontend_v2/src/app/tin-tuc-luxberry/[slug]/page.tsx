import { notFound } from "next/navigation";
import EditorialDetailPage from "../../../components/editorial/EditorialDetailPage";
import {
    findLuxberryNewsArticle,
    luxberryNewsArticles,
} from "../../../data/editorialContent";

export function generateStaticParams() {
    return luxberryNewsArticles.map((article) => ({ slug: article.slug }));
}

export default async function LuxberryNewsDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const article = findLuxberryNewsArticle(slug);
    if (!article) notFound();

    return (
        <EditorialDetailPage
            article={article}
            listingHref="/tin-tuc-luxberry"
            listingLabel="Tin tức LuxBerry"
        />
    );
}
