import Link from "next/link";
import { ChevronRight, RefreshCcw, Sparkles } from "lucide-react";
import Footer from "../../components/layout/Footer";
import Header from "../../components/layout/Header";

const policySections = [
    {
        title: "1. Điều kiện đổi trả",
        text: "Sản phẩm còn nguyên tem, nhãn, bao bì và chưa qua sử dụng.",
    },
    {
        title: "2. Thời gian hỗ trợ đổi trả",
        text: "LuxBerry hỗ trợ yêu cầu đổi trả trong vòng 7 ngày kể từ ngày nhận hàng.",
    },
    {
        title: "3. Trường hợp được đổi trả",
        text: "Sản phẩm giao sai, thiếu hàng, lỗi từ nhà sản xuất hoặc hư hỏng trong quá trình vận chuyển.",
    },
    {
        title: "4. Trường hợp không hỗ trợ",
        text: "Sản phẩm đã mở nắp, đã sử dụng, không còn hóa đơn hoặc hư hỏng do bảo quản sai cách.",
    },
    {
        title: "5. Quy trình đổi trả",
        text: "Liên hệ CSKH, cung cấp mã đơn và hình ảnh sản phẩm. LuxBerry sẽ hướng dẫn bước xử lý phù hợp.",
    },
    {
        title: "6. Liên hệ hỗ trợ",
        text: "Hotline 19006750 hoặc email support@luxberry.vn trong khung giờ 08:00 - 22:00.",
    },
];

export default function ReturnPolicyPage() {
    return (
        <div className="min-h-screen bg-[#FFF9FB] text-[#2B1B24]">
            <Header />
            <main className="mx-auto max-w-6xl px-4 py-8">
                <nav className="flex items-center gap-1 text-sm text-[#8A747D]">
                    <Link href="/">Trang chủ</Link>
                    <ChevronRight className="h-4 w-4" />
                    <span>Chính sách đổi trả</span>
                </nav>

                <section className="mt-5 grid overflow-hidden rounded-[28px] border border-[#F4DEE6] bg-white shadow-[0_10px_28px_rgba(154,88,111,0.08)] md:grid-cols-[1.2fr_0.8fr]">
                    <div className="p-6 md:p-9">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B14063]">
                            Hỗ trợ mua sắm LuxBerry
                        </p>
                        <h1 className="mt-2 text-3xl font-bold md:text-4xl">
                            Chính sách đổi trả
                        </h1>
                        <p className="mt-3 text-sm leading-7 text-[#7A6A70]">
                            Quy trình rõ ràng, gọn nhẹ để bảo vệ trải nghiệm mua
                            sắm mỹ phẩm của bạn.
                        </p>
                    </div>
                    <div className="m-5 flex min-h-52 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFE1EA] via-[#FFF7FA] to-[#F4C9D7] text-[#B14063]">
                        <div className="text-center">
                            <RefreshCcw className="mx-auto h-10 w-10" />
                            <p className="mt-3 text-sm font-bold">
                                Đổi trả thuận tiện
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mt-8 grid gap-4 md:grid-cols-2">
                    {policySections.map((item) => (
                        <article
                            key={item.title}
                            className="rounded-2xl border border-[#F4DEE6] bg-white p-5 shadow-[0_8px_20px_rgba(154,88,111,0.05)]">
                            <Sparkles className="h-5 w-5 text-[#F27EA5]" />
                            <h2 className="mt-3 text-lg font-bold">{item.title}</h2>
                            <p className="mt-2 text-sm leading-6 text-[#7A6A70]">
                                {item.text}
                            </p>
                        </article>
                    ))}
                </section>
            </main>
            <Footer />
        </div>
    );
}
