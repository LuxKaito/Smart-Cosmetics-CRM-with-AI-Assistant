"use client";

import { Menu, UserRound } from "lucide-react";
import type { User } from "../../types/auth";

interface StaffHeaderProps {
    currentUser: User;
    onToggleSidebar: () => void;
}

export default function StaffHeader({
    currentUser,
    onToggleSidebar,
}: StaffHeaderProps) {
    const displayName = currentUser.name || currentUser.email;

    return (
        <header className="sticky top-0 z-20 h-[72px] border-b border-[#F1E7EC] bg-white/95 px-4 backdrop-blur md:px-6">
            <div className="flex h-full items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={onToggleSidebar}
                    className="rounded-xl p-2 text-[#2B1B24] hover:bg-[#FFF0F5] lg:hidden"
                    aria-label="Mở menu nhân viên">
                    <Menu size={24} />
                </button>
                <div className="ml-auto flex items-center gap-3 rounded-2xl bg-[#FFF7FA] px-3 py-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFD4E1] text-[#F999B7]">
                        <UserRound size={19} />
                    </span>
                    <span className="hidden text-left sm:block">
                        <span className="block text-sm font-bold text-[#2B1B24]">
                            {displayName}
                        </span>
                        <span className="block text-xs text-[#7A6A70]">
                            Nhân viên bán hàng
                        </span>
                    </span>
                </div>
            </div>
        </header>
    );
}
