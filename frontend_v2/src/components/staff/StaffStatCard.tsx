import type { LucideIcon } from "lucide-react";

export default function StaffStatCard({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: string;
    icon: LucideIcon;
}) {
    return (
        <article className="rounded-[20px] border border-[#F1E7EC] bg-white p-5 shadow-[0_4px_20px_rgba(255,105,180,0.05)]">
            <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0F5] text-[#F999B7]">
                    <Icon size={22} />
                </span>
                <span>
                    <span className="block text-sm text-[#7A6A70]">{label}</span>
                    <strong className="mt-1 block text-2xl text-[#2B1B24]">
                        {value}
                    </strong>
                </span>
            </div>
        </article>
    );
}
