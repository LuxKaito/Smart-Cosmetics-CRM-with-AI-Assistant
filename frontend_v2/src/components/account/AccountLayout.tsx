"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
    KeyRound,
    LogOut,
    MapPin,
    PackageCheck,
    TicketPercent,
    UserRound,
} from "lucide-react";
import { toast } from "sonner";
import Footer from "../layout/Footer";
import Header from "../layout/Header";
import { fetchMe, logoutUser } from "../../services/authService";
import { useCartStore } from "../../stores/cartStore";

const accountLinks = [
    { href: "/account", label: "Thông tin cá nhân", icon: UserRound },
    { href: "/account/orders", label: "Đơn hàng của tôi", icon: PackageCheck },
    { href: "/account/vouchers", label: "Voucher của tôi", icon: TicketPercent },
    { href: "/account/address", label: "Địa chỉ giao hàng", icon: MapPin },
    { href: "/account/change-password", label: "Đổi mật khẩu", icon: KeyRound },
];

export default function AccountLayout({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle: string;
    children: ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const refreshCart = useCartStore((state) => state.refresh);
    const [authState, setAuthState] = useState<
        "checking" | "allowed" | "redirecting"
    >("checking");

    useEffect(() => {
        let mounted = true;
        void fetchMe()
            .then(() => {
                if (mounted) setAuthState("allowed");
            })
            .catch(() => {
                if (mounted) setAuthState("redirecting");
                router.replace(
                    `/login?redirect=${encodeURIComponent(pathname || "/account")}`,
                );
            });
        return () => {
            mounted = false;
        };
    }, [pathname, router]);

    const handleLogout = async () => {
        router.replace("/");
        try {
            await logoutUser();
            toast.success("Đăng xuất thành công.");
        } catch {
            toast.error("Đã xóa phiên đăng nhập trên thiết bị.");
        } finally {
            await refreshCart();
        }
    };

    if (authState !== "allowed") {
        return (
            <div className="min-h-screen bg-[#FFF7FA] text-[#2B1B24]">
                <Header />
                <main className="mx-auto max-w-6xl px-4 py-8">
                    <div className="animate-pulse rounded-[24px] border border-[#F4DEE6] bg-white p-8 shadow-[0_10px_30px_rgba(249,153,183,0.1)]">
                        <div className="h-6 w-48 rounded bg-[#FFF0F5]" />
                        <div className="mt-5 h-40 rounded-2xl bg-[#FFF7FA]" />
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFF7FA] text-[#2B1B24]">
            <Header />
            <main className="mx-auto max-w-6xl px-4 py-8">
                <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
                    <aside className="h-fit rounded-[24px] border border-[#F4DEE6] bg-white p-4 shadow-[0_10px_30px_rgba(249,153,183,0.1)]">
                        <p className="px-3 pb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#B14063]">
                            Tài khoản của tôi
                        </p>
                        <nav className="flex gap-2 overflow-x-auto lg:block lg:space-y-1">
                            {accountLinks.map((item) => {
                                const isActive =
                                    item.href === "/account"
                                        ? pathname === item.href
                                        : pathname.startsWith(item.href);
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                                            isActive
                                                ? "bg-[#FFF0F5] text-[#B14063]"
                                                : "text-[#5A4850] hover:bg-[#FFF7FA]"
                                        }`}>
                                        <Icon className="h-4 w-4" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                            <button
                                type="button"
                                onClick={() => void handleLogout()}
                                className="flex w-full shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#5A4850] transition hover:bg-[#FFF7FA] hover:text-[#B14063]">
                                <LogOut className="h-4 w-4" />
                                Đăng xuất
                            </button>
                        </nav>
                    </aside>

                    <section className="rounded-[24px] border border-[#F4DEE6] bg-white p-5 shadow-[0_10px_30px_rgba(249,153,183,0.1)] md:p-7">
                        <div className="border-b border-[#F7E3EA] pb-5">
                            <h1 className="text-2xl font-bold">{title}</h1>
                            <p className="mt-1 text-sm text-[#7A6A70]">{subtitle}</p>
                        </div>
                        <div className="pt-6">{children}</div>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}
