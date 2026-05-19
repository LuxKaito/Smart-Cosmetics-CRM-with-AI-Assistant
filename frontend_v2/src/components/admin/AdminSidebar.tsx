"use client";

import Link from "next/link";

interface AdminSidebarProps {
    activePath?: string;
}

const navItems = [
    { label: "Dashboard", href: "/admin", icon: "⌂" },
    { label: "Products", href: "/admin/products", icon: "◼" },
    { label: "Users", href: "/admin/users", icon: "◯" },
    { label: "Orders", href: "/admin/orders", icon: "▦" },
    { label: "Analytics", href: "/admin/analytics", icon: "◧" },
    { label: "Settings", href: "/admin/settings", icon: "⚙" },
];

export default function AdminSidebar({ activePath }: AdminSidebarProps) {
    return (
        <aside className="admin-sidebar">
            <div className="admin-brand">
                <span>TK Beauty</span>
                <small>Admin</small>
            </div>
            <nav className="admin-nav" aria-label="Admin navigation">
                {navItems.map((item) => {
                    const isActive =
                        activePath === item.href ||
                        (item.href !== "/admin" &&
                            activePath?.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`admin-nav-item${isActive ? " is-active" : ""}`}>
                            <span className="admin-nav-icon" aria-hidden="true">
                                {item.icon}
                            </span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="admin-sidebar-footer">
                <span>Smart Cosmetics CRM</span>
            </div>
        </aside>
    );
}
