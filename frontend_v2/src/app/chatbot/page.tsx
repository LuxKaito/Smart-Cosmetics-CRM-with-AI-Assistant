"use client";

import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import ChatbotWidget from "./ChatbotWidget";

export default function ChatbotPage() {
    return (
        <div className="page-shell">
            <Header />
            <main className="main-content container chatbot-page-shell">
                <section className="chatbot-page-header">
                    <p className="section-kicker">Tro ly AI</p>
                    <h1>Chatbot ho tro mua sam</h1>
                    <p>Dat cau hoi de nhan goi y san pham phu hop nhat.</p>
                </section>
                <ChatbotWidget variant="page" />
            </main>
            <Footer />
        </div>
    );
}
