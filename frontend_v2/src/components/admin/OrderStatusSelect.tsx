"use client";

import { ChevronDown } from "lucide-react";

export const ORDER_STATUS_OPTIONS = [
    { value: "PENDING_CONFIRMATION", label: "Chờ xác nhận" },
    { value: "CONFIRMED", label: "Đang xử lý" },
    { value: "SHIPPING", label: "Đang giao" },
    { value: "DELIVERED", label: "Hoàn thành" },
    { value: "CANCELLED", label: "Đã hủy" },
];

const toneClass: Record<string, string> = {
    PENDING_PAYMENT: "border-[#FDBA74] bg-[#FFF7ED] text-[#C2410C]",
    PENDING_CONFIRMATION: "border-[#FDBA74] bg-[#FFF7ED] text-[#C2410C]",
    CONFIRMED: "border-[#93C5FD] bg-[#EFF6FF] text-[#1D4ED8]",
    SHIPPING: "border-[#86EFAC] bg-[#F0FDF4] text-[#15803D]",
    DELIVERED: "border-[#D8B4FE] bg-[#FAF5FF] text-[#7E22CE]",
    CANCELLED: "border-[#FDA4AF] bg-[#FFF1F2] text-[#BE123C]",
};

const allowedNextStatuses: Record<string, string[]> = {
    PENDING_PAYMENT: ["CONFIRMED", "CANCELLED"],
    PENDING_CONFIRMATION: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["SHIPPING", "CANCELLED"],
    SHIPPING: ["DELIVERED", "CANCELLED"],
};

interface OrderStatusSelectProps {
    status: string;
    disabled?: boolean;
    onChange: (status: string) => void;
}

export default function OrderStatusSelect({ status, disabled, onChange }: OrderStatusSelectProps) {
    const normalizedStatus = status === "PENDING_PAYMENT" ? "PENDING_CONFIRMATION" : status;
    const allowed = new Set([normalizedStatus, ...(allowedNextStatuses[status] || [])]);

    return (
        <div className="relative inline-flex w-full max-w-[160px]">
            <select
                value={normalizedStatus}
                disabled={disabled || ["DELIVERED", "CANCELLED"].includes(status)}
                onChange={(event) => onChange(event.target.value)}
                className={`h-9 w-full appearance-none rounded-xl border pl-3 pr-8 text-xs font-semibold outline-none disabled:cursor-not-allowed disabled:opacity-70 ${
                    toneClass[status] || toneClass[normalizedStatus] || "border-[#E5E7EB] bg-white text-[#2B1B24]"
                }`}>
                {ORDER_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} disabled={!allowed.has(option.value)}>
                        {option.label}
                    </option>
                ))}
            </select>
            <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-current"
            />
        </div>
    );
}
