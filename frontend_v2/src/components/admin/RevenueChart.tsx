"use client";

import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

interface RevenueChartProps {
    data: Array<{ date: string; revenue: number; previous?: number }>;
}

const compactCurrency = (value: number) =>
    `${Math.round(Number(value || 0) / 1000000)}M`;

const currency = (value: number) =>
    `${Number(value || 0).toLocaleString("vi-VN")}d`;

export default function RevenueChart({ data }: RevenueChartProps) {
    return (
        <div className="h-[280px] min-w-0 w-full 2xl:h-[292px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 20, right: 16, left: -8, bottom: 0 }}>
                    <defs>
                        <linearGradient id="revenuePink" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="5%" stopColor="#F999B7" stopOpacity={0.22} />
                            <stop offset="95%" stopColor="#F999B7" stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#F4E4EA" vertical={false} />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#7A6A70", fontSize: 12 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#7A6A70", fontSize: 12 }}
                        tickFormatter={compactCurrency}
                        width={44}
                    />
                    <Tooltip
                        cursor={{ stroke: "#F999B7", strokeDasharray: "4 4" }}
                        contentStyle={{
                            border: "1px solid #FFE3EC",
                            borderRadius: 16,
                            boxShadow: "0 14px 34px rgba(43,27,36,0.12)",
                        }}
                        formatter={(value: number, name) => [
                            currency(value),
                            name === "revenue" ? "Doanh thu" : "7 ng\u00e0y tr\u01b0\u1edbc",
                        ]}
                    />
                    <Area
                        type="monotone"
                        dataKey="previous"
                        stroke="#E8A8BD"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        fill="transparent"
                        dot={{ r: 3, fill: "#E8A8BD", strokeWidth: 0 }}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#F999B7"
                        strokeWidth={3}
                        fill="url(#revenuePink)"
                        dot={{ r: 4, fill: "#F999B7", stroke: "#fff", strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
