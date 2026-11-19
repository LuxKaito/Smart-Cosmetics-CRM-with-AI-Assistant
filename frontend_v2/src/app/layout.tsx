import "./globals.css";
import "../styles/legacy.css";
import "../styles/motion.css";
import "../styles/typography.css";
import "../styles/palette.css";
import "../styles/tactile-button.css";

import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Nunito, Vollkorn, Barlow_Condensed } from "next/font/google";
import AppProviders from "../providers/AppProviders";
import SiteMotion from "../components/layout/SiteMotion";
import ChatbotWidget from "../app/chatbot/ChatbotWidget";

const siteFont = Nunito({
    subsets: ["latin", "vietnamese"],
    display: "swap",
    variable: "--font-site",
});

const headingFont = Vollkorn({
    subsets: ["latin", "vietnamese"],
    display: "swap",
    variable: "--font-editorial",
});

const displayFont = Barlow_Condensed({
    subsets: ["latin", "vietnamese"],
    weight: ["400", "600", "700"],
    display: "swap",
    variable: "--font-display",
});

export const metadata: Metadata = {
    title: "Smart Cosmetic CRM",
    description: "Giao diện trang chủ mỹ phẩm",
    metadataBase: new URL("http://localhost:3000"),
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="vi" className={`${siteFont.variable} ${headingFont.variable} ${displayFont.variable}`} suppressHydrationWarning>
            <body className="font-sans antialiased" suppressHydrationWarning>
                <AppProviders>
                    {children}
                    <SiteMotion />
                    <ChatbotWidget />
                </AppProviders>
            </body>
        </html>
    );
}
