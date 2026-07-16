"use client";

import { useState, type ReactNode } from "react";
import type { User } from "../../types/auth";
import StaffHeader from "./StaffHeader";
import StaffSidebar from "./StaffSidebar";

interface StaffLayoutProps {
    currentUser: User;
    children: ReactNode;
}

export default function StaffLayout({ currentUser, children }: StaffLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen overflow-x-hidden bg-[#FFF7FA] text-[#2B1B24]">
            <StaffSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="min-h-screen lg:ml-[240px]">
                <StaffHeader
                    currentUser={currentUser}
                    onToggleSidebar={() => setSidebarOpen(true)}
                />
                <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
