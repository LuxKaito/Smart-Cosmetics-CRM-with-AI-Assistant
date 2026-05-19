"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import { fetchMe } from "../../services/authService";
import { useAuthStore } from "../../stores/authStore";
import type { User } from "../../types/auth";
import type { ReactNode } from "react";

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const storedUser = useAuthStore((state) => state.user);
    const hydrated = useAuthStore((state) => state.hydrated);
    const setUser = useAuthStore((state) => state.setUser);
    const [user, setLocalUser] = useState<User | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!hydrated) return;
        setLocalUser(storedUser);

        let active = true;
        const loadUser = async () => {
            try {
                const data = await fetchMe();
                if (active && data?.user) {
                    setUser(data.user);
                    setLocalUser(data.user);
                }
            } catch {
                // ignore
            } finally {
                if (active) setReady(true);
            }
        };

        loadUser();
        return () => {
            active = false;
        };
    }, [hydrated, setUser, storedUser]);

    useEffect(() => {
        if (!ready) return;
        if (!user) {
            router.replace("/login");
            return;
        }
        if (user?.role !== "admin") {
            router.replace("/");
        }
    }, [ready, user, router]);

    if (!ready) {
        return (
            <div className="admin-loading">Dang tai giao dien quan tri...</div>
        );
    }

    return (
        <div className="admin-shell">
            <AdminSidebar activePath={pathname} />
            <div className="admin-main">
                <AdminTopbar user={user} />
                <div className="admin-content">{children}</div>
            </div>
        </div>
    );
}
