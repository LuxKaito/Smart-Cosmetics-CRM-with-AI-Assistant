"use client";

import { useState, type ReactNode } from "react";
import type { User } from "../../types/auth";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
    currentUser: User;
    children: ReactNode;
}

export default function AdminLayout({
    currentUser,
    children,
}: AdminLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen overflow-x-hidden bg-[#FFF7FA] text-[#2B1B24]">
            <AdminSidebar
                isOpen={sidebarOpen}
                collapsed={sidebarCollapsed}
                onClose={() => setSidebarOpen(false)}
                onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
            />

            <div className={`min-h-screen transition-[margin] duration-200 ${sidebarCollapsed ? "lg:ml-[76px]" : "lg:ml-[220px]"}`}>
                <AdminHeader
                    currentUser={currentUser}
                    onToggleSidebar={() => setSidebarOpen(true)}
                />
                <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-6">{children}</main>
            </div>
        </div>
    );
}
