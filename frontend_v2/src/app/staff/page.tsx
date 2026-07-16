"use client";

import Link from "next/link";
import { ClipboardList, Clock, ContactRound, PackageCheck, Truck, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import StaffStatCard from "../../components/staff/StaffStatCard";
import { staffService } from "../../services/staffService";
import type { StaffOverview } from "../../types/staff";

const emptyOverview: StaffOverview = {
    orders: {
        total: 0,
        pending: 0,
        processing: 0,
        shipping: 0,
        completed: 0,
        cancelled: 0,
    },
    customers: {
        total: 0,
        active: 0,
        blocked: 0,
        verified: 0,
        unverified: 0,
    },
};

export default function StaffDashboardPage() {
    const [overview, setOverview] = useState(emptyOverview);
    const [error, setError] = useState("");

    useEffect(() => {
        void staffService
            .overview()
            .then(setOverview)
            .catch((requestError) => {
                setError(
                    requestError instanceof Error
                        ? requestError.message
                        : "Không tải được dashboard nhân viên.",
                );
            });
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Dashboard Staff</h1>
                <p className="mt-2 text-sm text-[#7A6A70]">
                    Theo dõi nhanh đơn hàng và khách hàng cần xử lý.
                </p>
            </div>
            {error ? (
                <p className="rounded-2xl border border-[#FFD4E1] bg-white p-4 text-sm text-[#E11D48]">
                    {error}
                </p>
            ) : null}
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <StaffStatCard label="Tổng đơn hàng" value={String(overview.orders.total)} icon={ClipboardList} />
                <StaffStatCard label="Chờ xác nhận" value={String(overview.orders.pending)} icon={Clock} />
                <StaffStatCard label="Đang giao" value={String(overview.orders.shipping)} icon={Truck} />
                <StaffStatCard label="Hoàn thành" value={String(overview.orders.completed)} icon={PackageCheck} />
                <StaffStatCard label="Tổng khách hàng" value={String(overview.customers.total)} icon={UsersRound} />
                <StaffStatCard label="Khách đang hoạt động" value={String(overview.customers.active)} icon={ContactRound} />
            </section>
            <section className="grid gap-4 md:grid-cols-2">
                <Link
                    href="/staff/orders"
                    className="rounded-[20px] border border-[#FFE3EC] bg-white p-6 shadow-[0_12px_28px_rgba(43,27,36,0.04)] transition hover:border-[#F999B7]">
                    <strong className="text-lg">Quản lý đơn hàng</strong>
                    <p className="mt-2 text-sm text-[#7A6A70]">
                        Xác nhận, cập nhật trạng thái và hủy đơn.
                    </p>
                </Link>
                <Link
                    href="/staff/customers"
                    className="rounded-[20px] border border-[#FFE3EC] bg-white p-6 shadow-[0_12px_28px_rgba(43,27,36,0.04)] transition hover:border-[#F999B7]">
                    <strong className="text-lg">Quản lý khách hàng</strong>
                    <p className="mt-2 text-sm text-[#7A6A70]">
                        Tra cứu thông tin và lịch sử mua hàng.
                    </p>
                </Link>
            </section>
        </div>
    );
}
