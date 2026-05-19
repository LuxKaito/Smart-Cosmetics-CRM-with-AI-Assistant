"use client";

import { useMemo } from "react";
import type { User } from "../../types/auth";

interface AdminTopbarProps {
    user: User | null;
}

export default function AdminTopbar({ user }: AdminTopbarProps) {
    const displayName = useMemo(() => {
        if (!user) return "";
        return user.name || user.email || "Admin";
    }, [user]);

    return (
        <header className="admin-topbar">
            <div>
                <h1>Quan ly he thong</h1>
                <p>Cap nhat so lieu kinh doanh va van hanh</p>
            </div>
            <div className="admin-user">
                <div>
                    <strong>{displayName}</strong>
                    <span>{user?.role || "admin"}</span>
                </div>
                <div className="admin-avatar" aria-hidden="true">
                    {displayName.slice(0, 2).toUpperCase()}
                </div>
            </div>
        </header>
    );
}
