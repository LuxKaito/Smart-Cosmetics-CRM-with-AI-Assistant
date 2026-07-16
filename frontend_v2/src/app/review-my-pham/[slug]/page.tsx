import { notFound } from "next/navigation";
import EditorialDetailPage from "../../../components/editorial/EditorialDetailPage";
import {
    beautyReviewArticles,
    findBeautyReviewArticle,
} from "../../../data/editorialContent";

export function generateStaticParams() {
    return beautyReviewArticles.map((article) => ({ slug: article.slug }));
}

export default async function BeautyReviewDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const article = findBeautyReviewArticle(slug);
    if (!article) notFound();

    return (
        <EditorialDetailPage
            article={article}
            listingHref="/review-my-pham"
            listingLabel="Review mỹ phẩm"
        />
    );
}
