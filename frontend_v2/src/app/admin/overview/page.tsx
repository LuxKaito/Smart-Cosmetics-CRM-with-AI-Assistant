"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
    ClipboardList,
    Package,
    RefreshCcw,
    ShoppingBag,
    WalletCards,
} from "lucide-react";
import DonutChart from "../../../components/admin/DonutChart";
import RevenueChart from "../../../components/admin/RevenueChart";
import StatCard from "../../../components/admin/StatCard";
import { adminOverviewService, type AdminOverviewQuery } from "../../../services/adminOverviewService";
import type { AdminOverview } from "../../../types/admin";

const money = (value: number) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;
const count = (value: number) => Number(value || 0).toLocaleString("vi-VN");
const OVERVIEW_REFRESH_INTERVAL_MS = 10_000;

const statusOrder = ["PENDING_CONFIRMATION", "CONFIRMED", "SHIPPING", "DELIVERED", "CANCELLED"];
const statusColors: Record<string, string> = {
    PENDING_CONFIRMATION: "#F999B7",
    PENDING_PAYMENT: "#F999B7",
    CONFIRMED: "#F97316",
    SHIPPING: "#2F8CFB",
    DELIVERED: "#2FB344",
    CANCELLED: "#7A6A70",
};

export default function AdminOverviewPage() {
    const [data, setData] = useState<AdminOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [query, setQuery] = useState<AdminOverviewQuery>({ preset: "7d" });

    const loadOverview = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            setData(await adminOverviewService.getOverview(query));
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Không tải được dữ liệu tổng quan.");
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [query]);

    useEffect(() => {
        void loadOverview();
    }, [loadOverview]);

    useEffect(() => {
        const refreshOnFocus = () => void loadOverview();
        const intervalId = window.setInterval(() => void loadOverview(), OVERVIEW_REFRESH_INTERVAL_MS);
        window.addEventListener("focus", refreshOnFocus);
        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener("focus", refreshOnFocus);
        };
    }, [loadOverview]);

    const orderStatusData = useMemo(
        () =>
            normalizeOrderStatusStats(data?.orderStatusStats || []).map((item, index) => ({
                name: item.label,
                value: item.count,
                percent: item.percent,
                color: statusColors[item.status || ""] || ["#F999B7", "#FFD4E1", "#2B1B24", "#7A6A70", "#FFFFFF"][index % 5],
            })),
        [data],
    );

    return (
        <div className="min-w-0 space-y-6">
            <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
                <div className="min-w-0">
                    <h1 className="text-3xl font-bold text-[#2B1B24]">Tổng quan</h1>
                    <p className="mt-2 text-sm text-[#7A6A70]">
                        Tổng quan tình hình hoạt động của cửa hàng
                    </p>
                </div>
                <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:w-auto xl:grid-cols-[154px_154px_140px_132px]">
                    <input
                        type="date"
                        value={query.dateFrom || ""}
                        onChange={(event) => setQuery((prev) => ({ ...prev, preset: "custom", dateFrom: event.target.value }))}
                        className="admin-input min-w-0 xl:!w-[154px]"
                    />
                    <input
                        type="date"
                        value={query.dateTo || ""}
                        onChange={(event) => setQuery((prev) => ({ ...prev, preset: "custom", dateTo: event.target.value }))}
                        className="admin-input min-w-0 xl:!w-[154px]"
                    />
                    <select
                        value={query.preset || "7d"}
                        onChange={(event) => setQuery({ preset: event.target.value as AdminOverviewQuery["preset"] })}
                        className="admin-input min-w-0 xl:!w-[140px]">
                        <option value="7d">7 ngày qua</option>
                        <option value="30d">30 ngày qua</option>
                        <option value="month">Tháng này</option>
                        <option value="custom">Tùy chỉnh</option>
                    </select>
                    <button
                        type="button"
                        onClick={() => void loadOverview()}
                        className="inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-xl border border-[#FFD4E1] bg-white px-4 text-sm font-semibold text-[#F999B7]">
                        <RefreshCcw size={17} />
                        Làm mới
                    </button>
                </div>
            </div>

            {error ? <p className="rounded-2xl border border-[#FFD4E1] bg-white p-4 text-sm text-[#E11D48]">{error}</p> : null}

            <section className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label={`Doanh thu (${overviewPeriodLabel(query.preset)})`} value={money(data?.totalRevenue || 0)} icon={WalletCards} />
                <StatCard label="Đơn hàng" value={count(data?.totalOrders || 0)} icon={ClipboardList} />
                <StatCard label="Sản phẩm đã bán" value={count(data?.soldProducts || 0)} icon={Package} />
                <StatCard label="Giá trị đơn trung bình" value={money(data?.averageOrderValue || 0)} icon={ShoppingBag} />
            </section>

            <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.85fr)_minmax(320px,1fr)]">
                <Panel title="Doanh thu theo ngày">
                    {loading ? <Loading /> : <RevenueChart data={data?.revenueChart || []} />}
                </Panel>
                <Panel title="Đơn hàng theo trạng thái">
                    {loading ? (
                        <Loading />
                    ) : (
                        <DonutChart
                            data={orderStatusData}
                            centerValue={count(data?.totalOrders || 0)}
                            centerLabel="Tổng đơn hàng"
                            valueFormatter={count}
                        />
                    )}
                </Panel>
            </section>

            <section className="grid min-w-0 gap-5 xl:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(320px,0.82fr)]">
                <Panel title="Top sản phẩm bán chạy">
                    <div className="space-y-3">
                        {data?.topSellingProducts?.length ? (
                            <div className="grid grid-cols-[28px_minmax(0,1fr)_72px] gap-3 text-xs font-semibold text-[#6B7280]">
                                <span>Hạng</span>
                                <span>Sản phẩm</span>
                                <span className="text-right">Đã bán</span>
                            </div>
                        ) : null}

                        {(data?.topSellingProducts || []).map((product, index) => (
                            <div
                                key={product.productId || product.name}
                                className="grid min-w-0 grid-cols-[28px_minmax(0,1fr)_72px] items-center gap-3"
                            >
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F999B7] text-xs font-bold text-white">
                                    {index + 1}
                                </span>

                                <ProductName image={product.image} name={product.name} />

                                <span className="text-right text-sm font-bold text-[#2B1B24]">
                                    {count(product.unitsSold)}
                                </span>
                            </div>
                        ))}

                        {!loading && !data?.topSellingProducts?.length ? <Empty /> : null}
                    </div>
                </Panel>
                <Panel title="Sản phẩm sắp hết hàng">
                    <div className="space-y-3">
                        {data?.lowStockProducts?.length ? (
                            <div className="grid grid-cols-[minmax(0,1fr)_72px_72px] gap-3 text-xs font-semibold text-[#6B7280]">
                                <span>Sản phẩm</span>
                                <span className="text-right">Tồn kho</span>
                                <span className="text-right">Đã bán</span>
                            </div>
                        ) : null}
                        {(data?.lowStockProducts || []).map((product) => (
                            <div key={product.productId || product.name} className="grid min-w-0 grid-cols-[minmax(0,1fr)_72px_72px] items-center gap-3">
                                <ProductName image={product.image} name={product.name} />
                                <span className="text-right text-sm font-bold text-[#F999B7]">{count(product.stock)}</span>
                                <span className="text-right text-sm text-[#2B1B24]">{count(product.soldCount)}</span>
                            </div>
                        ))}
                        {!loading && !data?.lowStockProducts?.length ? <Empty /> : null}
                    </div>
                </Panel>
                <Panel title="Thống kê khách hàng">
                    <div className="space-y-4">
                        <Metric label="Tổng khách hàng" value={count(data?.customerStats.totalCustomers || 0)} />
                        <Metric label="Khách hàng mới" value={count(data?.customerStats.newCustomers || 0)} />
                        <Metric label="Khách quay lại" value={count(data?.customerStats.returningCustomers || 0)} />
                        <Metric label="Tỷ lệ quay lại" value={`${data?.customerStats.returningRate || 0}%`} />
                    </div>
                </Panel>
            </section>
        </div>
    );
}

function overviewPeriodLabel(preset: AdminOverviewQuery["preset"]) {
    if (preset === "30d") return "30 ngày qua";
    if (preset === "month") return "tháng này";
    if (preset === "custom") return "tùy chỉnh";
    return "7 ngày qua";
}

function normalizeOrderStatusStats(rows: AdminOverview["orderStatusStats"]) {
    const merged = new Map<string, { status: string; label: string; count: number }>();

    rows.forEach((item) => {
        const status = item.status === "PENDING_PAYMENT" ? "PENDING_CONFIRMATION" : item.status || "";
        if (!statusOrder.includes(status)) return;
        const current = merged.get(status) || {
            status,
            label: status === "PENDING_CONFIRMATION" ? "Chờ xác nhận" : item.label,
            count: 0,
        };
        current.count += Number(item.count || 0);
        merged.set(status, current);
    });

    const total = [...merged.values()].reduce((sum, item) => sum + item.count, 0);
    return [...merged.values()]
        .sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status))
        .map((item) => ({
            ...item,
            percent: total ? Math.round((item.count / total) * 1000) / 10 : 0,
        }));
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
    return (
        <article className="min-w-0 overflow-hidden rounded-[20px] border border-[#FFE3EC] bg-white p-5 shadow-[0_16px_38px_rgba(43,27,36,0.04)]">
            <h2 className="mb-5 truncate text-lg font-bold leading-7 text-[#2B1B24]" title={title}>{title}</h2>
            {children}
        </article>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-[#7A6A70]">{label}</span>
            <strong className="text-[#2B1B24]">{value}</strong>
        </div>
    );
}

function ProductName({ image, name }: { image?: string; name: string }) {
    return (
        <span className="flex min-w-0 items-center gap-3">
            <ProductThumb image={image} name={name} />
            <span className="truncate text-sm font-semibold text-[#2B1B24]" title={name}>
                {name}
            </span>
        </span>
    );
}

function ProductThumb({ image, name }: { image?: string; name: string }) {
    if (!image) return <span className="h-9 w-9 shrink-0 rounded-xl border border-[#FFE3EC] bg-[#FFF7FA]" />;
    return (
        <Image
            src={image}
            alt={name}
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-xl border border-[#FFE3EC] object-cover"
        />
    );
}

function Loading() {
    return <p className="py-12 text-center text-sm text-[#7A6A70]">Đang tải dữ liệu...</p>;
}

function Empty() {
    return <p className="py-8 text-center text-sm text-[#7A6A70]">Chưa có dữ liệu.</p>;
}
