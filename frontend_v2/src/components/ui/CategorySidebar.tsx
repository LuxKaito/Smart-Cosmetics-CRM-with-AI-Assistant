import Link from "next/link";

interface CategoryItem {
    label: string;
    section?: boolean;
    submenu?: string;
    href?: string;
    queryCategory?: string;
}

interface MegaMenuGroup {
    title: string;
    items: string[];
}

type MegaMenuColumn = MegaMenuGroup[];

interface MegaMenuProps {
    columns: MegaMenuColumn[];
    label: string;
    parentCategory: string;
}

interface CategorySidebarProps {
    categories?: CategoryItem[];
    showHeader?: boolean;
}

function productsHref(filters: {
    category?: string;
    subcategory?: string;
    search?: string;
    sort?: string;
}) {
    const params = new URLSearchParams({ page: "1" });
    Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
    });
    return `/products?${params.toString()}`;
}

const defaultCategories: CategoryItem[] = [
    {
        label: "Chăm Sóc Da Mặt",
        submenu: "faceCare",
        href: productsHref({ category: "Chăm Sóc Da Mặt" }),
    },
    {
        label: "Chăm Sóc Cơ Thể",
        submenu: "bodyCare",
        href: productsHref({ category: "Chăm Sóc Cơ Thể" }),
    },
    {
        label: "Chăm Sóc Tóc Và Da Đầu",
        submenu: "hairCare",
        href: productsHref({ category: "Chăm Sóc Tóc Và Da Đầu" }),
    },
    {
        label: "Chăm Sóc Cá Nhân",
        submenu: "personalCare",
        href: productsHref({ category: "Chăm Sóc Cá Nhân" }),
    },
    {
        label: "Trang Điểm",
        submenu: "makeup",
        href: productsHref({ category: "Trang Điểm" }),
    },
    { label: "Nước Hoa", href: productsHref({ category: "Nước Hoa" }) },
    {
        label: "Sản Phẩm Bán Chạy",
        href: productsHref({ sort: "-soldCount" }),
    },
];

const faceCareColumns: MegaMenuColumn[] = [
    [
        {
            title: "",
            items: [
                "Bông Tẩy Trang",
                "Dụng Cụ / Máy Rửa Mặt",
                "Dụng Cụ Chăm Sóc Khác",
                "Hỗ Trợ Trị Mụn",
                "Kem / Gel / Dầu Dưỡng",
                "Lotion / Sữa Dưỡng",
                "Mặt Nạ Giấy",
                "Mặt Nạ Lột",
                "Mặt Nạ Mắt",
                "Mặt Nạ Môi",
                "Mặt Nạ Ngủ",
            ],
        },
    ],
    [
        {
            title: "",
            items: [
                "Mặt Nạ Rửa",
                "Sản Phẩm Đặc Trị Khác",
                "Serum / Kem Dưỡng Mắt",
                "Serum / Tinh Chất",
                "Sữa Rửa Mặt",
                "Tẩy Tế Bào Chết Da Mặt",
                "Tẩy Tế Bào Chết Môi",
                "Tẩy Trang Mặt",
                "Toner / Nước Cân Bằng Da",
                "Xịt Khoáng",
            ],
        },
    ],
];

const bodyCareColumns: MegaMenuColumn[] = [
    [{ title: "", items: ["Dụng Cụ Tẩy Lông", "Kem Tẩy Lông"] }],
];

const hairCareColumns: MegaMenuColumn[] = [
    [
        {
            title: "",
            items: ["Dầu Gội", "Dầu Gội Khô", "Dầu Gội Xả 2in1", "Dầu Xả", "Lược"],
        },
    ],
    [
        {
            title: "",
            items: [
                "Máy Tạo Kiểu Tóc",
                "Mặt Nạ / Kem Ủ Tóc",
                "Serum / Dầu Dưỡng Tóc",
                "Xịt Dưỡng Tóc",
            ],
        },
    ],
];

const personalCareColumns: MegaMenuColumn[] = [
    [
        {
            title: "",
            items: [
                "Băng Vệ Sinh",
                "Dao Cạo Râu",
                "Dung Dịch Vệ Sinh",
                "Dưỡng Vùng Kín",
                "Hỗ Trợ Trắng Răng",
                "Kem Đánh Răng",
                "Khẩu Trang",
            ],
        },
    ],
    [
        {
            title: "",
            items: [
                "Miếng Dán Ngực",
                "Nước Rửa Tay / Diệt Khuẩn",
                "Nước Súc Miệng",
                "Sản Phẩm Chăm Sóc Khác",
                "Xịt Thơm Miệng",
            ],
        },
    ],
];

const makeupColumns: MegaMenuColumn[] = [
    [
        {
            title: "",
            items: [
                "Bấm Mi",
                "BB / CC Cream",
                "Bông / Mút Trang Điểm",
                "Che Khuyết Điểm",
                "Cọ Trang Điểm",
                "Dụng Cụ / Phụ Kiện Làm Móng",
                "Dụng Cụ Trang Điểm Khác",
                "Giấy Thấm Dầu",
                "Kẻ Mày",
                "Kẻ Mắt",
                "Kem Lót",
                "Kem Nền",
                "Má Hồng",
                "Mascara",
            ],
        },
    ],
    [
        {
            title: "",
            items: [
                "Mi Giả",
                "Miếng Dán Kích Mí",
                "Nhíp / Dao Cạo",
                "Phấn Mắt",
                "Phấn Nền",
                "Phấn Nước Cushion",
                "Phấn Phủ",
                "Son Bóng",
                "Son Dưỡng Môi",
                "Son Kem / Tint",
                "Son Thỏi",
                "Tạo Khối / Highlight",
                "Xịt Khoá Makeup",
            ],
        },
    ],
];

function MegaMenu({ columns, label, parentCategory }: MegaMenuProps) {
    return (
        <div className="category-mega-menu" aria-label={label}>
            {columns.map((column, columnIndex) => (
                <div
                    key={`mega-column-${columnIndex}`}
                    className="mega-menu-column">
                    {column.map((group, groupIndex) => (
                        <section
                            key={`${columnIndex}-${groupIndex}-${group.title}`}
                            className="mega-menu-group">
                            <h4>{group.title}</h4>
                            {group.items.length > 0 ? (
                                <ul>
                                    {group.items.map((subItem) => (
                                        <li key={subItem}>
                                            <Link
                                                className="mega-menu-link"
                                                href={productsHref({ category: parentCategory, subcategory: subItem })}>
                                                {subItem}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </section>
                    ))}
                </div>
            ))}
        </div>
    );
}

export default function CategorySidebar({
    categories = defaultCategories as CategoryItem[],
    showHeader = true,
}: CategorySidebarProps) {
    return (
        <aside className="category-sidebar">
            {showHeader ? (
                <div className="category-sidebar-head">
                    <span className="category-sidebar-head-icon" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                    </span>
                    <span>Danh mục sản phẩm</span>
                </div>
            ) : null}
            <ul>
                {categories.map((item) => {
                    return (
                        <li
                            key={item.label}
                            className={`${item.section ? "is-section-title" : ""}${item.submenu ? " has-submenu" : ""}`.trim()}>
                            <span className="category-item-left">
                                {item.href ? (
                                    <Link className="category-link" href={item.href}>
                                        {item.label}
                                    </Link>
                                ) : (
                                    <span>{item.label}</span>
                                )}
                            </span>
                            {item.submenu ? (
                                <span className="category-arrow">›</span>
                            ) : null}
                            {/* Mega menu stays attached to its parent row. */}
                            {item.submenu === "faceCare" && (
                                <MegaMenu
                                    columns={faceCareColumns}
                                    label="Danh mục con chăm sóc da mặt"
                                    parentCategory={item.queryCategory ?? item.label}
                                />
                            )}
                            {item.submenu === "makeup" && (
                                <MegaMenu
                                    columns={makeupColumns}
                                    label="Danh mục con trang điểm"
                                    parentCategory={item.queryCategory ?? item.label}
                                />
                            )}
                            {item.submenu === "hairCare" && (
                                <MegaMenu
                                    columns={hairCareColumns}
                                    label="Danh mục con chăm sóc tóc"
                                    parentCategory={item.queryCategory ?? item.label}
                                />
                            )}
                            {item.submenu === "bodyCare" && (
                                <MegaMenu
                                    columns={bodyCareColumns}
                                    label="Danh mục con chăm sóc cơ thể"
                                    parentCategory={item.queryCategory ?? item.label}
                                />
                            )}
                            {item.submenu === "personalCare" && (
                                <MegaMenu
                                    columns={personalCareColumns}
                                    label="Danh mục con chăm sóc cá nhân"
                                    parentCategory={item.queryCategory ?? item.label}
                                />
                            )}
                        </li>
                    );
                })}
            </ul>
        </aside>
    );
}
