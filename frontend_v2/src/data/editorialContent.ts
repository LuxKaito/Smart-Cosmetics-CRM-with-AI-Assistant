import crawledLuxberryBlogs from "./luxberryBlogs.json";
import crawledLuxberryReviews from "./luxberryReviews.json";

export interface EditorialArticle {
    slug: string;
    title: string;
    summary: string;
    category: string;
    publishedAt: string;
    tone: "rose" | "beige" | "peach" | "lavender";
    imageUrl?: string;
    detailImages?: string[];
    content?: string;
}

const articleTones: EditorialArticle["tone"][] = [
    "peach",
    "rose",
    "beige",
    "lavender",
];

const withTones = (
    articles: Omit<EditorialArticle, "tone">[],
): EditorialArticle[] =>
    articles.map((article, index) => ({
        ...article,
        tone: articleTones[index % articleTones.length],
    }));

export const beautyReviewArticles = withTones(crawledLuxberryReviews);
export const luxberryNewsArticles = withTones(crawledLuxberryBlogs);

export const findBeautyReviewArticle = (slug: string) =>
    beautyReviewArticles.find((article) => article.slug === slug);

export const findLuxberryNewsArticle = (slug: string) =>
    luxberryNewsArticles.find((article) => article.slug === slug);
