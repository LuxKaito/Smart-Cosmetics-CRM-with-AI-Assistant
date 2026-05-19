import Link from "next/link";

interface CategoryItem {
    label: string;
    section?: boolean;
    submenu?: string;
    href?: string;
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

const defaultCategories = [
    {
        label: "Sức Khỏe - Làm Đẹp",
        section: true,
        href: "/products",
    },
    {
        label: "Chăm Sóc Da Mặt",
        submenu: "faceCare",
        href: "/products?category=Chăm Sóc Da Mặt",
    },
    {
        label: "Trang Điểm",
        submenu: "makeup",
        href: "/products?category=Trang Điểm",
    },
    {
        label: "Chăm Sóc Tóc Và Da Đầu",
        submenu: "hairCare",
        href: "/products?category=Chăm Sóc Tóc Và Da Đầu",
    },
    {
        label: "Chăm Sóc Cơ Thể",
        submenu: "bodyCare",
        href: "/products?category=Chăm Sóc Cơ Thể",
    },
    {
        label: "Chăm Sóc Cá Nhân",
        submenu: "personalCare",
        href: "/products?category=Chăm Sóc Cá Nhân",
    },
    {
        label: "Nước Hoa",
        submenu: "perfume",
        href: "/products?category=Nước Hoa",
    },
    {
        label: "Thực Phẩm Chức Năng",
        submenu: "supplement",
        href: "/products?category=Thực Phẩm Chức Năng",
    },
];

// Mega menu columns for 'Nước Hoa'
const perfumeColumns = [
    [
        {
            title: "Nước Hoa Hàng Hiệu",
            items: [
                "Calvin Klein",
                "Carolina Herrera",
                "Chloé",
                "Coach",
                "Dolce & Gabbana",
                "Issey Miyake",
                "Lancôme",
                "Marc Jacobs",
                "Montblanc",
                "Moschino",
                "Narciso Rodriguez",
                "Paco Rabanne",
                "Versace",
                "Yves Saint Laurent",
            ],
        },
    ],
    [
        {
            title: "Nước Hoa Giá Mềm",
            items: [
                "Armaf",
                "De Memoria",
                "Diamond",
                "Gennie",
                "Gota",
                "Laura Anne",
                "Panier Des Sens",
                "Tommy",
            ],
        },
        {
            title: "Nước Hoa Cơ Thể",
            items: [
                "Bodymiss",
                "Kiss My Body",
                "Malissa Kiss",
                "Silkygirl",
                "Foellie",
            ],
        },
    ],
];

// Mega menu columns for 'Thực Phẩm Chức Năng'
const supplementColumns = [
    [
        {
            title: "Hỗ Trợ Làm Đẹp",
            items: ["Làm Đẹp Da", "Làm Đẹp Tóc", "Hỗ Trợ Giảm Cân"],
        },
        {
            title: "Hỗ Trợ Sức Khỏe",
            items: [
                "Bổ Gan / Giải Rượu",
                "Dầu Cá / Bổ Mắt",
                "Hoạt Huyết Dưỡng Não",
                "Hỗ Trợ Sinh Lý / Nội Tiết Tố",
                "Hỗ Trợ Tiêu Hoá",
                "Hỗ Trợ Tim Mạch",
                "Hỗ Trợ Xương Khớp",
                "Tăng Sức Đề Kháng",
                "Vitamin / Khoáng Chất",
            ],
        },
    ],
    [
        {
            title: "Top Thương Hiệu",
            items: [
                "DHC",
                "Elasten",
                "Itoh kanpo",
                "Rohto",
                "Blackmores",
                "Lavima",
                "Blossomy",
                "Heliocare",
                "Adiva",
                "Decumar",
                "Nucos",
                "Pharmekal",
                "Lactobact Intima",
                "Costar",
            ],
        },
    ],
];
// Mega menu columns for 'Chăm Sóc Cơ Thể'
const bodyCareColumns = [
    [
        {
            title: "Sữa Tắm",
            items: [],
        },
        {
            title: "Xà Phòng",
            items: [],
        },
        {
            title: "Tẩy Tế Bào Chết Body",
            items: [],
        },
        {
            title: "Dưỡng Da Tay / Chân",
            items: [],
        },
        {
            title: "Dưỡng Thể",
            items: [],
        },
        {
            title: "Chống Nắng Cơ Thể",
            items: [],
        },
        {
            title: "Khử Mùi",
            items: [],
        },
        {
            title: "Tẩy Lông / Triệt Lông",
            items: ["Kem Tẩy Lông", "Dụng Cụ Tẩy Lông"],
        },
        {
            title: "Bộ Chăm Sóc Cơ Thể",
            items: [],
        },
        {
            title: "Top Bán Chạy",
            items: [],
        },
        {
            title: "Hàng Mới Về",
            items: [],
        },
    ],
    [
        {
            title: "Top Thương Hiệu",
            items: [
                "Dove",
                "Etiaxil",
                "Cocoon",
                "Vaseline",
                "Lifebuoy",
                "Hatomugi",
                "Nivea",
                "Paula's Choice",
                "Old Spice",
                "Cetaphil",
                "Vichy",
                "Nuxe",
                "Angel's Liquid",
                "Bioré",
                "Johnson's",
                "Purité By Provence",
            ],
        },
    ],
];

// Mega menu columns for 'Chăm Sóc Cá Nhân'
const personalCareColumns = [
    [
        {
            title: "Chăm Sóc Phụ Nữ",
            items: [
                "Băng Vệ Sinh",
                "Dung Dịch Vệ Sinh",
                "Dưỡng Vùng Kín",
                "Miếng Dán Ngực",
            ],
        },
        {
            title: "Chăm Sóc Răng Miệng",
            items: [
                "Bàn Chải Đánh Răng",
                "Bàn Chải Điện / Phụ Kiện",
                "Kem Đánh Răng",
                "Máy Tăm Nước",
                "Nước Súc Miệng",
                "Tăm / Chỉ Nha Khoa",
                "Xịt Thơm Miệng",
            ],
        },
        {
            title: "Khăn Giấy / Khăn Ướt",
            items: [],
        },
    ],
    [
        {
            title: "Chăm Sóc Sức Khỏe",
            items: [
                "Chống Muỗi",
                "Khẩu Trang",
                "Máy Massage",
                "Mặt Nạ Xông Hơi",
                "Nước Rửa Tay / Diệt Khuẩn",
                "Sản Phẩm Chăm Sóc Khác",
            ],
        },
        {
            title: "Cạo Râu",
            items: ["Bot Cao Rau", "Dao Cao Rau"],
        },
        {
            title: "Hỗ Trợ Tinh Dục",
            items: ["Bao Cao Su", "Gel Bôi Trơn"],
        },
    ],
];

const faceCareColumns = [
    [
        {
            title: "Làm Sạch Da",
            items: [
                "Tẩy Trang Mặt",
                "Sữa Rửa Mặt",
                "Tẩy Tế Bào Chết Da Mặt",
                "Toner / Nước Cân Bằng Da",
            ],
        },
        {
            title: "Đặc Trị",
            items: [
                "Serum / Tinh Chất",
                "Hỗ Trợ Trị Mụn",
                "Sản Phẩm Đặc Trị Khác",
            ],
        },
        {
            title: "Dưỡng Ẩm",
            items: [
                "Xịt Khoáng",
                "Lotion / Sữa Dưỡng",
                "Kem / Gel / Dầu Dưỡng",
            ],
        },
        {
            title: "Bộ Chăm Sóc Da Mặt",
            items: ["Combo Làm Sạch", "Combo Dưỡng Ẩm", "Combo Đặc Trị"],
        },
    ],
    [
        {
            title: "Chống Nắng Da Mặt",
            items: ["Anessa", "La Roche-Posay", "Vichy", "Biore"],
        },
        {
            title: "Dưỡng Mắt",
            items: ["Kem Dưỡng Mắt", "Mặt Nạ Mắt"],
        },
        {
            title: "Dưỡng Môi",
            items: ["Son Dưỡng", "Mặt Nạ Môi"],
        },
        {
            title: "Mặt Nạ",
            items: ["Mặt Nạ Giấy", "Mặt Nạ Đất Sét", "Mặt Nạ Ngủ"],
        },
        {
            title: "Vấn Đề Về Da",
            items: [
                "Da Dầu / Lỗ Chân Lông To",
                "Da Khô / Mất Nước",
                "Da Lão Hóa",
                "Da Mụn",
                "Thâm / Nám / Tàn Nhang",
            ],
        },
        {
            title: "Dụng Cụ / Phụ Kiện Chăm Sóc Da",
            items: [
                "Bông Tẩy Trang",
                "Dụng Cụ / Máy Rửa Mặt",
                "Máy Chăm Sóc Da",
            ],
        },
    ],
];

const makeupColumns = [
    [
        {
            title: "Trang Điểm Mặt",
            items: [
                "Kem Lót",
                "Kem Nền",
                "Phấn Nước Cushion",
                "Che Khuyết Điểm",
                "Má Hồng",
                "Tạo Khối / Highlight",
                "Phấn Phủ",
            ],
        },
        {
            title: "Trang Điểm Mắt",
            items: ["Kẻ Mắt", "Kẻ Mày", "Phấn Mắt", "Mascara"],
        },
        {
            title: "Bộ Trang Điểm",
            items: [],
        },
    ],
    [
        {
            title: "Trang Điểm Môi",
            items: [
                "Son Dưỡng Môi",
                "Son Kem / Tint",
                "Son Thỏi",
                "Son Bóng",
                "Tẩy Trang Mắt / Môi",
            ],
        },
        {
            title: "Trang Điểm Móng",
            items: ["Son Móng", "Dụng Cụ / Phụ Kiện Làm Móng"],
        },
        {
            title: "Dụng Cụ Trang Điểm",
            items: ["Bông / Mút Trang Điểm", "Cọ Trang Điểm"],
        },
    ],
];

const hairCareColumns = [
    [
        {
            title: "Dầu Gội Và Dầu Xả",
            items: ["Dầu Gội", "Dầu Xả", "Dầu Gội Xả 2in1", "Bộ Gội Xả"],
        },
        {
            title: "Tẩy Tế Bào Chết Da Đầu",
            items: [],
        },
        {
            title: "Dưỡng Tóc",
            items: [
                "Mặt Nạ / Kem Ủ Tóc",
                "Serum / Dầu Dưỡng Tóc",
                "Xịt Dưỡng Tóc",
            ],
        },
        {
            title: "Thuốc Nhuộm Tóc",
            items: [],
        },
        {
            title: "Sản Phẩm Tạo Kiểu Tóc",
            items: [],
        },
        {
            title: "Dụng Cụ Chăm Sóc Tóc",
            items: [],
        },
        {
            title: "Bộ Chăm Sóc Tóc",
            items: [],
        },
    ],
    [
        {
            title: "Top Thương Hiệu",
            items: [
                "Cocoon",
                "L'Oréal",
                "Hotosu",
                "TRESemmé",
                "Nguyên Xuân",
                "Tsubaki",
                "L'Oreal Professionnel",
                "Selsun",
                "Fino",
                "OGX",
                "Palmolive",
                "Aromatica",
            ],
        },
        {
            title: "Top Bán Chạy",
            items: [],
        },
        {
            title: "Hàng Mới Về",
            items: [],
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
                    {column.map((group) => (
                        <section key={group.title} className="mega-menu-group">
                            <h4>{group.title}</h4>
                            {group.items.length > 0 ? (
                                <ul>
                                    {group.items.map((subItem) => (
                                        <li key={subItem}>
                                            <Link
                                                className="mega-menu-link"
                                                href={`/products?category=${encodeURIComponent(parentCategory)}&subcategory=${encodeURIComponent(subItem)}`}>
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
}) {
    return (
        <aside className="category-sidebar">
            <div className="category-sidebar-head">
                <span className="category-sidebar-head-icon" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                </span>
                <span>Danh mục sản phẩm</span>
            </div>
            <ul>
                {categories.map((item) => (
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
                        {!item.section ? (
                            <span className="category-arrow">›</span>
                        ) : null}
                        {/* Mega menu render lại làm con trực tiếp của li */}
                        {item.submenu === "faceCare" && (
                            <MegaMenu
                                columns={faceCareColumns}
                                label="Danh mục con chăm sóc da mặt"
                                parentCategory={item.label}
                            />
                        )}
                        {item.submenu === "makeup" && (
                            <MegaMenu
                                columns={makeupColumns}
                                label="Danh mục con trang điểm"
                                parentCategory={item.label}
                            />
                        )}
                        {item.submenu === "hairCare" && (
                            <MegaMenu
                                columns={hairCareColumns}
                                label="Danh mục con chăm sóc tóc và da đầu"
                                parentCategory={item.label}
                            />
                        )}
                        {item.submenu === "bodyCare" && (
                            <MegaMenu
                                columns={bodyCareColumns}
                                label="Danh mục con chăm sóc cơ thể"
                                parentCategory={item.label}
                            />
                        )}
                        {item.submenu === "personalCare" && (
                            <MegaMenu
                                columns={personalCareColumns}
                                label="Danh mục con chăm sóc cá nhân"
                                parentCategory={item.label}
                            />
                        )}
                        {item.submenu === "perfume" && (
                            <MegaMenu
                                columns={perfumeColumns}
                                label="Danh mục con nước hoa"
                                parentCategory={item.label}
                            />
                        )}
                        {item.submenu === "supplement" && (
                            <MegaMenu
                                columns={supplementColumns}
                                label="Danh mục con thực phẩm chức năng"
                                parentCategory={item.label}
                            />
                        )}
                    </li>
                ))}
            </ul>
        </aside>
    );
}
