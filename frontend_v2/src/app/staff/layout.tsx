import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import StaffLayout from "../../components/staff/StaffLayout";
import { SERVER_API_PREFIX } from "../../lib/config";
import type { User } from "../../types/auth";

async function resolveStaffUser(): Promise<User | null> {
    const cookieStore = await cookies();
    const response = await fetch(`${SERVER_API_PREFIX}/auth/me`, {
        method: "GET",
        headers: {
            cookie: cookieStore.toString(),
        },
        cache: "no-store",
    }).catch(() => null);

    if (!response?.ok) return null;

    const payload = (await response.json().catch(() => null)) as
        | {
              success?: boolean;
              data?: { user?: User };
          }
        | null;

    if (!payload?.success || !payload.data?.user) return null;
    return payload.data.user;
}

export default async function StaffRootLayout({
    children,
}: {
    children: ReactNode;
}) {
    const user = await resolveStaffUser();
    if (!user) redirect("/login?redirect=/staff");
    if (user.role !== "staff") redirect("/login?error=forbidden");

    return <StaffLayout currentUser={user}>{children}</StaffLayout>;
}
