"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, ChevronDown, LogOut, Menu, UserRound } from "lucide-react";
import { logoutUser } from "../../services/authService";
import type { User } from "../../types/auth";

interface AdminHeaderProps {
    currentUser: User;
    onToggleSidebar: () => void;
}

export default function AdminHeader({
    currentUser,
    onToggleSidebar,
}: AdminHeaderProps) {
    const displayName = currentUser?.name || currentUser?.email || "Admin";
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const roleLabel = "Quản trị viên";

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
        <header className="sticky top-0 z-20 h-[72px] border-b border-[#F1E7EC] bg-white/95 px-4 backdrop-blur md:px-6">
            <div className="flex h-full items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onToggleSidebar}
                        className="rounded-xl p-2 text-[#2B1B24] hover:bg-[#FFF0F5]"
                        aria-label="Mở menu admin">
                        <Menu size={24} />
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        className="relative rounded-full p-2 text-[#2B1B24] hover:bg-[#FFF0F5]"
                        aria-label="Th\u00f4ng b\u00e1o">
                        <Bell size={22} />
                    </button>

                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setMenuOpen((value) => !value)}
                            className="flex items-center gap-3 rounded-2xl px-2 py-1.5 hover:bg-[#FFF7FA]">
                            <Image
                                src={currentUser.avatar || "https://i.pravatar.cc/96?img=5"}
                                alt={displayName}
                                width={42}
                                height={42}
                                className="h-10 w-10 rounded-full object-cover"
                            />
                            <span className="hidden text-left sm:block">
                                <span className="block text-sm font-bold text-[#2B1B24]">
                                    {displayName}
                                </span>
                                <span className="block text-xs text-[#7A6A70]">
                                    {roleLabel}
                                </span>
                            </span>
                            <ChevronDown size={16} className="text-[#2B1B24]" />
                        </button>

                        {menuOpen ? (
                            <div className="absolute right-0 top-full mt-3 w-56 rounded-2xl border border-[#FFE3EC] bg-white p-2 shadow-[0_18px_42px_rgba(43,27,36,0.12)]">
                                <div className="flex items-center gap-3 rounded-xl bg-[#FFF7FA] p-3">
                                    <UserRound size={18} className="text-[#F999B7]" />
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-[#2B1B24]">
                                            {displayName}
                                        </p>
                                        <p className="text-xs text-[#7A6A70]">
                                            Bảng điều khiển admin
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => void handleLogout()}
                                    disabled={loggingOut}
                                    className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#F999B7] hover:bg-[#FFF0F5] disabled:opacity-60">
                                    <LogOut size={18} />
                                    {loggingOut ? "\u0110ang \u0111\u0103ng xu\u1ea5t..." : "\u0110\u0103ng xu\u1ea5t"}
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </header>
    );
}
