"use client";

import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import ChatbotWidget from "./ChatbotWidget";

export default function ChatbotPage() {
    return (
        <div className="page-shell bg-[#FFF7FA]">
            <Header />
            <main className="container grid gap-5 py-8">
                <section className="max-w-2xl">
                    <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#F999B7]">
                        Trợ lý AI
                    </p>
                    <h1 className="mt-2 text-3xl font-bold text-[#2B1B24]">
                        LuxBerry Assistant
                    </h1>
                    <p className="mt-2 text-sm text-[#7A6A70]">
                        Đặt câu hỏi để nhận gợi ý sản phẩm phù hợp với làn da
                        và nhu cầu mua sắm của bạn.
                    </p>
                </section>
                <ChatbotWidget variant="page" />
            </main>
            <Footer />
        </div>
    );
}
