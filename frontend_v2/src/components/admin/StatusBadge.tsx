"use client";

interface StatusBadgeProps {
    children: string;
    tone?: "pink" | "green" | "blue" | "orange" | "gray" | "red" | "purple";
}

const toneClass: Record<NonNullable<StatusBadgeProps["tone"]>, string> = {
    pink: "bg-[#FFE3EC] text-[#F999B7]",
    green: "bg-[#E8F9EE] text-[#168A42]",
    blue: "bg-[#E6F0FF] text-[#2563EB]",
    orange: "bg-[#FFF0DF] text-[#F97316]",
    gray: "bg-[#EEF0F4] text-[#7A6A70]",
    red: "bg-[#FFE7EE] text-[#E11D48]",
    purple: "bg-[#F1E9FF] text-[#7C3AED]",
};

export default function StatusBadge({ children, tone = "pink" }: StatusBadgeProps) {
    return (
        <span className={`inline-flex items-center rounded-md px-3 py-1 text-xs font-semibold ${toneClass[tone]}`}>
            {children}
        </span>
    );
}
