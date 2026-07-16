"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BellRing,
    Box,
    ChevronLeft,
    Home,
    Package,
    TicketPercent,
    UsersRound,
    X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface AdminSidebarProps {
    isOpen: boolean;
    collapsed: boolean;
    onClose: () => void;
    onToggleCollapse: () => void;
}

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
}

const navItems: NavItem[] = [
    { label: "T\u1ed5ng quan", href: "/admin/overview", icon: Home },
    { label: "S\u1ea3n ph\u1ea9m", href: "/admin/products", icon: Box },
    { label: "T\u00e0i kho\u1ea3n & ph\u00e2n quy\u1ec1n", href: "/admin/users", icon: UsersRound },
    { label: "Khuy\u1ebfn m\u00e3i", href: "/admin/vouchers", icon: TicketPercent },
];

export default function AdminSidebar({ isOpen, collapsed, onClose, onToggleCollapse }: AdminSidebarProps) {
    const pathname = usePathname();

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
                className={`fixed inset-y-0 left-0 z-40 flex ${collapsed ? "lg:w-[76px]" : "lg:w-[220px]"} w-[220px] flex-col border-r border-[#F1E7EC] bg-white shadow-[0_18px_40px_rgba(249,153,183,0.16)] transition-all lg:translate-x-0 lg:shadow-none ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                }`}>
                <div className="flex h-[72px] items-center justify-between px-4">
                    <Link
                        href="/"
                        onClick={onClose}
                        className="group flex items-center gap-3">
                            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF7FA] text-[#F999B7]">
                            <BellRing size={24} className="rotate-12" />
                        </span>
                        <span className={collapsed ? "lg:hidden" : ""}>
                            <span className="block font-serif text-2xl font-bold leading-7 text-[#F999B7]">
                                LuxBerry
                            </span>
                            <span className="block text-[9px] font-bold uppercase tracking-[0.38em] text-[#F999B7]">
                                Beauty
                            </span>
                        </span>
                    </Link>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-[#FFD4E1] p-2 text-[#7A6A70] lg:hidden"
                        aria-label="\u0110\u00f3ng menu admin">
                        <X size={16} />
                    </button>
                </div>

                <nav
                    className="flex-1 space-y-1 overflow-y-auto px-3 py-3"
                    aria-label="Admin navigation">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active =
                            pathname === item.href ||
                            pathname.startsWith(item.href);

                        return (
                            <Link
                                key={`${item.label}-${item.href}`}
                                href={item.href}
                                onClick={onClose}
                                className={`relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                                    active
                                        ? "bg-[#FFF7FA] text-[#F999B7]"
                                        : "text-[#2B1B24] hover:bg-[#FFF7FA] hover:text-[#F999B7]"
                                }`}>
                                {active ? (
                                    <span className="absolute left-0 top-2 h-8 w-1 rounded-r-full bg-[#F999B7]" />
                                ) : null}
                                <Icon size={18} />
                                <span className={`flex-1 ${collapsed ? "lg:hidden" : ""}`}>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className={`mx-5 mb-5 rounded-[18px] border border-[#FFE3EC] bg-[#FFF7FA] p-5 text-center ${collapsed ? "lg:hidden" : ""}`}>
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFD4E1] text-[#F999B7] shadow-[0_12px_28px_rgba(249,153,183,0.22)]">
                        <Package size={30} />
                    </div>
                    <p className="font-serif text-xl font-semibold text-[#2B1B24]">
                        LuxBerry Beauty
                    </p>
                    <p className="mt-1 text-sm text-[#7A6A70]">
                        Skincare & Cosmetics
                    </p>
                    <p className="mt-4 text-xs leading-5 text-[#7A6A70]">
                        {"\u00a9 2026 LuxBerry Beauty. All rights reserved."}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onToggleCollapse}
                    className="mb-5 ml-5 hidden items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-[#2B1B24] hover:bg-[#FFF0F5] lg:flex">
                    <ChevronLeft size={18} className={collapsed ? "rotate-180" : ""} />
                    <span className={collapsed ? "hidden" : ""}>Thu gọn</span>
                </button>
            </aside>
        </>
    );
}
