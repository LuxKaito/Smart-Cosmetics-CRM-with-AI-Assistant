import Link from "next/link";
import {
    ChevronRight,
    Clock3,
    ExternalLink,
    Mail,
    MapPin,
    Phone,
    Store,
} from "lucide-react";
import Footer from "../../components/layout/Footer";
import Header from "../../components/layout/Header";

const storeAddress =
    "225 Đ. Phạm Văn Chiêu, An Hội Tây, Hồ Chí Minh, Vietnam";
const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeAddress)}`;
const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(storeAddress)}&output=embed`;

export default function StoresPage() {
    return (
        <div className="min-h-screen bg-[#FFF9FB] text-[#2B1B24]">
            <Header />
            <main className="mx-auto max-w-6xl px-4 py-8">
                <nav className="flex items-center gap-1 text-sm text-[#8A747D]">
                    <Link href="/">Trang chủ</Link>
                    <ChevronRight className="h-4 w-4" />
                    <span>Hệ thống cửa hàng</span>
                </nav>

                <header className="mt-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B14063]">
                        Ghé thăm LuxBerry
                    </p>
                    <h1 className="mt-2 text-3xl font-bold md:text-4xl">
                        Hệ thống cửa hàng LuxBerry
                    </h1>
                </header>

                <section className="mt-6 grid overflow-hidden rounded-[28px] border border-[#F4DEE6] bg-white shadow-[0_10px_28px_rgba(154,88,111,0.08)] lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="p-6 md:p-8">
                        <div className="inline-flex rounded-2xl bg-[#FFF0F5] p-3 text-[#B14063]">
                            <Store className="h-7 w-7" />
                        </div>
                        <h2 className="mt-4 text-2xl font-bold">
                            LuxBerry Cosmetics
                        </h2>
                        <div className="mt-5 space-y-4 text-sm leading-6 text-[#6E5962]">
                            <StoreInfo icon={MapPin} text={storeAddress} />
                            <StoreInfo icon={Phone} text="Hotline: 19006750" />
                            <StoreInfo
                                icon={Mail}
                                text="Email: support@luxberry.vn"
                            />
                            <StoreInfo
                                icon={Clock3}
                                text="Giờ mở cửa: 08:00 - 22:00 hằng ngày"
                            />
                        </div>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <a
                                href={directionsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl bg-[#F999B7] px-4 py-3 text-sm font-bold text-white">
                                Xem chỉ đường
                                <ExternalLink className="h-4 w-4" />
                            </a>
                            <a
                                href="tel:19006750"
                                className="rounded-xl border border-[#F4C9D7] px-4 py-3 text-sm font-bold text-[#B14063]">
                                Liên hệ ngay
                            </a>
                        </div>
                    </div>

                    <div className="min-h-[360px] bg-[#FFF0F5]">
                        <iframe
                            title="Bản đồ LuxBerry Cosmetics"
                            src={mapEmbedUrl}
                            className="h-full min-h-[360px] w-full border-0"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}

function StoreInfo({
    icon: Icon,
    text,
}: {
    icon: typeof MapPin;
    text: string;
}) {
    return (
        <div className="flex gap-3">
            <Icon className="mt-1 h-4 w-4 shrink-0 text-[#B14063]" />
            <span>{text}</span>
        </div>
    );
}
