"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardList, ContactRound, Home, LogOut, Store, X } from "lucide-react";
import { useState } from "react";
import { logoutUser } from "../../services/authService";

interface StaffSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const navItems = [
    { label: "Dashboard Staff", href: "/staff", icon: Home },
    { label: "Quản lý đơn hàng", href: "/staff/orders", icon: ClipboardList },
    { label: "Quản lý khách hàng", href: "/staff/customers", icon: ContactRound },
];

export default function StaffSidebar({ isOpen, onClose }: StaffSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        try {
            setLoggingOut(true);
            await logoutUser();
            router.replace("/login");
        } finally {
            setLoggingOut(false);
        }
    };

    return (
        <>
            <div
                className={`fixed inset-0 z-30 bg-[#2B1B24]/25 transition-opacity lg:hidden ${
                    isOpen ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-[#F1E7EC] bg-white shadow-[0_18px_40px_rgba(249,153,183,0.16)] transition-transform lg:translate-x-0 lg:shadow-none ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                }`}>
                <div className="flex h-[72px] items-center justify-between border-b border-[#F5E5EC] px-4">
                    <Link href="/" onClick={onClose} className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF0F5] text-[#F999B7]">
                            <Store size={22} />
                        </span>
                        <span>
                            <span className="block font-serif text-xl font-bold text-[#F999B7]">
                                LuxBerry
                            </span>
                            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#7A6A70]">
                                Staff Sales
                            </span>
                        </span>
                    </Link>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl p-2 text-[#7A6A70] lg:hidden"
                        aria-label="Đóng menu nhân viên">
                        <X size={18} />
                    </button>
                </div>

                <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Staff navigation">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active =
                            item.href === "/staff"
                                ? pathname === item.href
                                : pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                                    active
                                        ? "bg-[#FFF0F5] text-[#F999B7]"
                                        : "text-[#2B1B24] hover:bg-[#FFF7FA] hover:text-[#F999B7]"
                                }`}>
                                <Icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-[#F5E5EC] p-3">
                    <button
                        type="button"
                        onClick={() => void handleLogout()}
                        disabled={loggingOut}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#E11D48] hover:bg-[#FFF0F5] disabled:opacity-60">
                        <LogOut size={18} />
                        {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
                    </button>
                </div>
            </aside>
        </>
    );
}
