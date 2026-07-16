import EditorialListingPage from "../../components/editorial/EditorialListingPage";
import { beautyReviewArticles } from "../../data/editorialContent";

export default function BeautyReviewsPage() {
    return (
        <EditorialListingPage
            title="Review mỹ phẩm"
            description="Khám phá các bài review, danh sách sản phẩm đáng thử và hướng dẫn lựa chọn mỹ phẩm phù hợp với nhu cầu chăm sóc cá nhân."
            featuredTitle="Bài viết nổi bật"
            articles={beautyReviewArticles}
            articleBaseHref="/review-my-pham"
        />
    );
}
