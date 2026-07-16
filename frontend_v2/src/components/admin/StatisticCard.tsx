import type { LucideIcon } from "lucide-react";

interface StatisticCardProps {
    label: string;
    value: string;
    subLabel?: string;
    icon: LucideIcon;
}

export default function StatisticCard({
    label,
    value,
    subLabel,
    icon: Icon,
}: StatisticCardProps) {
    return (
        <article className="rounded-3xl border border-[#FFD4E1] bg-white p-5 shadow-[0_12px_30px_rgba(249,153,183,0.13)]">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm text-[#7A6A70]">{label}</p>
                    <p className="mt-2 text-3xl font-semibold text-[#2B1B24]">
                        {value}
                    </p>
                    {subLabel ? (
                        <p className="mt-1 text-xs text-[#7A6A70]">{subLabel}</p>
                    ) : null}
                </div>
                <div className="rounded-2xl bg-[#FFF7FA] p-3 text-[#F999B7]">
                    <Icon size={20} />
                </div>
            </div>
        </article>
    );
}

