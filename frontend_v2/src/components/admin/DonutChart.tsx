"use client";

import {
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

interface DonutItem {
    name: string;
    value: number;
    percent?: number;
    color: string;
}

interface DonutChartProps {
    data: DonutItem[];
    centerValue: string;
    centerLabel: string;
    valueFormatter?: (value: number) => string;
}

export default function DonutChart({
    data,
    centerValue,
    centerLabel,
    valueFormatter = (value) => Number(value || 0).toLocaleString("vi-VN"),
}: DonutChartProps) {
    return (
        <div className="grid min-w-0 items-center gap-4 lg:grid-cols-[210px_minmax(0,1fr)] 2xl:grid-cols-[220px_minmax(0,1fr)]">
            <div className="relative h-[210px] min-w-0 2xl:h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={62}
                            outerRadius={96}
                            paddingAngle={1}
                            stroke="#FFFFFF"
                            strokeWidth={2}>
                            {data.map((item) => (
                                <Cell key={item.name} fill={item.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number) => valueFormatter(value)}
                            contentStyle={{
                                border: "1px solid #FFE3EC",
                                borderRadius: 14,
                                boxShadow: "0 14px 34px rgba(43,27,36,0.12)",
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-lg font-bold text-[#2B1B24]">
                            {centerValue}
                        </p>
                        <p className="text-xs text-[#7A6A70]">{centerLabel}</p>
                    </div>
                </div>
            </div>

            <div className="min-w-0 space-y-3">
                {data.map((item) => (
                    <div
                        key={item.name}
                        className="grid min-w-0 grid-cols-[minmax(0,1fr)_56px_64px] items-center gap-2 text-sm 2xl:grid-cols-[minmax(0,1fr)_62px_76px]">
                        <div className="flex min-w-0 items-center gap-2">
                            <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="truncate text-[#2B1B24]" title={item.name}>
                                {item.name}
                            </span>
                        </div>
                        <span className="text-right font-medium text-[#2B1B24]">
                            {item.percent?.toFixed(1)}%
                        </span>
                        <span className="text-right text-[#2B1B24]">
                            {valueFormatter(item.value || 0)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
