import "./globals.css";
import "../styles/legacy.css";

import type { ReactNode } from "react";
import type { Metadata } from "next";
import AppProviders from "../providers/AppProviders";
import ChatbotWidget from "../app/chatbot/ChatbotWidget";

export const metadata: Metadata = {
    title: "Smart Cosmetic CRM",
    description: "Giao dien trang chu my pham",
    metadataBase: new URL("http://localhost:3000"),
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="vi">
            <body>
                <AppProviders>
                    {children}
                    <ChatbotWidget />
                </AppProviders>
            </body>
        </html>
    );
}
