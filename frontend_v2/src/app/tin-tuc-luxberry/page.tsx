import EditorialListingPage from "../../components/editorial/EditorialListingPage";
import { luxberryNewsArticles } from "../../data/editorialContent";

export default function LuxberryNewsPage() {
    return (
        <EditorialListingPage
            title="Tin tức LuxBerry"
            description="Theo dõi thông tin mới về sản phẩm, ưu đãi và chính sách mua sắm tại LuxBerry Beauty."
            featuredTitle="Tin tức nổi bật"
            articles={luxberryNewsArticles}
            articleBaseHref="/tin-tuc-luxberry"
        />
    );
}
