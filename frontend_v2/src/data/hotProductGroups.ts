export interface HotProductGroupConfig {
    id: string;
    title: string;
    category: string;
    subcategory: string;
    href: string;
    bannerImage: string;
}

const createCategoryGroup = (
    id: string,
    title: string,
    category: string,
    subcategory: string,
    bannerImage = "",
): HotProductGroupConfig => ({
    id,
    title,
    category,
    subcategory,
    href: `/products?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}&page=1`,
    bannerImage,
});

// Category/subcategory pairs below are taken from the current product API.
export const hotProductGroups: HotProductGroupConfig[] = [
    createCategoryGroup("face-moisturizers", "Kem / Gel / Dầu Dưỡng", "Chăm Sóc Da Mặt", "Kem / Gel / Dầu Dưỡng", "/banner/hot-face-care.png"),
    createCategoryGroup("face-cleansers", "Sữa Rửa Mặt", "Chăm Sóc Da Mặt", "Sữa Rửa Mặt"),
    createCategoryGroup("sheet-masks", "Mặt Nạ Giấy", "Chăm Sóc Da Mặt", "Mặt Nạ Giấy"),
    createCategoryGroup("brow-makeup", "Kẻ Mày", "Trang Điểm", "Kẻ Mày"),
    createCategoryGroup("face-cleansing", "Tẩy Trang Mặt", "Chăm Sóc Da Mặt", "Tẩy Trang Mặt"),
    createCategoryGroup("oil-blotting", "Giấy Thấm Dầu", "Trang Điểm", "Giấy Thấm Dầu"),
    createCategoryGroup("eye-shadow", "Phấn Mắt", "Trang Điểm", "Phấn Mắt"),
    createCategoryGroup("face-lotion", "Lotion / Sữa Dưỡng", "Chăm Sóc Da Mặt", "Lotion / Sữa Dưỡng"),
    createCategoryGroup("mascara", "Mascara", "Trang Điểm", "Mascara"),
    createCategoryGroup("rinse-off-masks", "Mặt Nạ Rửa", "Chăm Sóc Da Mặt", "Mặt Nạ Rửa"),
    createCategoryGroup("foundation", "Kem Nền", "Trang Điểm", "Kem Nền"),
    createCategoryGroup("eye-care", "Serum / Kem Dưỡng Mắt", "Chăm Sóc Da Mặt", "Serum / Kem Dưỡng Mắt"),
    createCategoryGroup("toothpaste", "Kem Đánh Răng", "Chăm Sóc Cá Nhân", "Kem Đánh Răng"),
    createCategoryGroup("face-exfoliators", "Tẩy Tế Bào Chết Da Mặt", "Chăm Sóc Da Mặt", "Tẩy Tế Bào Chết Da Mặt"),
];
