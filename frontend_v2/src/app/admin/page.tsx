"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminDashboard } from "../../types/admin";
import {
    ResponsiveContainer,
    Area,
    AreaChart,
    CartesianGrid,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import type { ValueType } from "recharts/types/component/DefaultTooltipContent";
import { fetchAdminDashboard } from "../../services/adminService";

const formatCurrency = (value: number | string | null | undefined) =>
    `${Number(value || 0).toLocaleString("vi-VN")} d`;

export default function AdminDashboardPage() {
    const [data, setData] = useState<AdminDashboard | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const result = await fetchAdminDashboard();
                if (active) setData(result);
            } catch {
                if (active) setData(null);
            } finally {
                if (active) setIsLoading(false);
            }
        };

        load();
        return () => {
            active = false;
        };
    }, []);

    const chartData = useMemo(() => {
        return (data?.monthlyChart || []).map((item) => ({
            name: `T${item.month}`,
            revenue: item.revenue,
            orders: item.orders,
        }));
    }, [data]);

    const dashboard = data;

    return (
        <div className="admin-dashboard">
            <section className="admin-grid">
                {["Users", "Products", "Orders", "Revenue"].map((label) => (
                    <div
                        key={label}
                        className={`admin-stat-card${isLoading ? " is-loading" : ""}`}>
                        {isLoading ? (
                            <div className="stat-skeleton" />
                        ) : (
                            <>
                                <p>{label}</p>
                                <strong>
                                    {label === "Users" && data?.totalUsers}
                                    {label === "Products" &&
                                        data?.totalProducts}
                                    {label === "Orders" && data?.totalOrders}
                                    {label === "Revenue" &&
                                        formatCurrency(data?.revenue)}
                                </strong>
                                <span>Cap nhat theo thang</span>
                            </>
                        )}
                    </div>
                ))}
            </section>

            <section className="admin-chart-card">
                <div className="admin-card-head">
                    <div>
                        <h2>Doanh thu theo thang</h2>
                        <p>Theo doi tang truong qua cac thang</p>
                    </div>
                </div>
                <div className="admin-chart-body">
                    {isLoading ? (
                        <div className="chart-skeleton" />
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart
                                data={chartData}
                                margin={{
                                    top: 10,
                                    right: 20,
                                    left: 0,
                                    bottom: 0,
                                }}>
                                <defs>
                                    <linearGradient
                                        id="revenueGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1">
                                        <stop
                                            offset="5%"
                                            stopColor="#f999b7"
                                            stopOpacity={0.6}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#f999b7"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#ecd9e6"
                                />
                                <XAxis dataKey="name" stroke="#6f6675" />
                                <YAxis stroke="#6f6675" />
                                <Tooltip
                                    formatter={(value: ValueType) =>
                                        formatCurrency(
                                            Array.isArray(value)
                                                ? value[0]
                                                : value,
                                        )
                                    }
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#f999b7"
                                    fill="url(#revenueGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </section>

            <section className="admin-list-card">
                <div className="admin-card-head">
                    <div>
                        <h2>Top san pham ban chay</h2>
                        <p>Danh sach duoc cap nhat tu he thong</p>
                    </div>
                </div>
                <div className="admin-list-body">
                    {isLoading ? (
                        <div className="list-skeleton" />
                    ) : (dashboard?.topSellingProducts || []).length === 0 ? (
                        <p>Chua co du lieu san pham.</p>
                    ) : (
                        <ul>
                            {dashboard?.topSellingProducts.map(
                                (
                                    item: AdminDashboard["topSellingProducts"][number],
                                ) => (
                                    <li key={item._id}>
                                        <div>
                                            <strong>{item.name}</strong>
                                            <span>{item.brand || "--"}</span>
                                        </div>
                                        <div>
                                            <strong>
                                                {formatCurrency(item.price)}
                                            </strong>
                                            <span>
                                                Da ban: {item.soldCount || 0}
                                            </span>
                                        </div>
                                    </li>
                                ),
                            )}
                        </ul>
                    )}
                </div>
            </section>
        </div>
    );
}
