"use client";

import type { LucideIcon } from "lucide-react";

interface StatCardProps {
    label: string;
    value: string;
    helper?: string;
    trend?: string;
    trendDirection?: "up" | "down";
    icon: LucideIcon;
}

export default function StatCard({
    label,
    value,
    helper,
    trend,
    trendDirection = "up",
    icon: Icon,
}: StatCardProps) {
    return (
        <article className="min-w-0 rounded-[22px] border border-[#F1E7EC] bg-white p-6 shadow-[0_4px_20px_rgba(255,105,180,0.05)]">
            <div className="flex h-full min-h-[80px] items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#FFF7FA] text-[#F999B7]">
                    <Icon size={24} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm leading-5 text-[#374151]">{label}</p>
                    <p className="mt-1 text-[25px] font-bold leading-[1.15] tracking-normal text-[#2B1B24]">
                        {value}
                    </p>
                    {trend || helper ? (
                        <p className="mt-2 text-[13px] leading-5 text-[#6B7280]">
                            {trend ? (
                                <span
                                    className={
                                        trendDirection === "up"
                                            ? "font-semibold text-[#16A34A]"
                                            : "font-semibold text-[#F999B7]"
                                    }>
                                    {trendDirection === "up" ? "↑" : "↓"} {trend}
                                </span>
                            ) : null}{" "}
                            {helper || ""}
                        </p>
                    ) : null}
                </div>
            </div>
        </article>
    );
}
