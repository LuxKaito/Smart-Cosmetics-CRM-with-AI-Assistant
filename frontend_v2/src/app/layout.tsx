import "./globals.css";
import "../styles/legacy.css";

import type { ReactNode } from "react";
import type { Metadata } from "next";
import AppProviders from "../providers/AppProviders";
import ChatbotWidget from "../app/chatbot/ChatbotWidget";

export const metadata: Metadata = {
    title: "Smart Cosmetic CRM",
    description: "Giao diện trang chủ mỹ phẩm",
    metadataBase: new URL("http://localhost:3000"),
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="vi" suppressHydrationWarning>
            <body suppressHydrationWarning>
                <AppProviders>
                    {children}
                    <ChatbotWidget />
                </AppProviders>
            </body>
        </html>
    );
}
