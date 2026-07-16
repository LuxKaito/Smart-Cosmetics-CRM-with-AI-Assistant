const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING_PAYMENT: {
        label: "Chờ thanh toán",
        className: "bg-[#FFF7ED] text-[#C2410C]",
    },
    PENDING_CONFIRMATION: {
        label: "Chờ xác nhận",
        className: "bg-[#FFF7ED] text-[#C2410C]",
    },
    CONFIRMED: {
        label: "Đang xử lý",
        className: "bg-[#EFF6FF] text-[#1D4ED8]",
    },
    SHIPPING: {
        label: "Đang giao",
        className: "bg-[#F0FDF4] text-[#15803D]",
    },
    DELIVERED: {
        label: "Hoàn thành",
        className: "bg-[#FAF5FF] text-[#7E22CE]",
    },
    CANCELLED: {
        label: "Đã hủy",
        className: "bg-[#FFF1F2] text-[#BE123C]",
    },
};

export default function StaffOrderStatusBadge({ status }: { status: string }) {
    const config = statusConfig[status] || {
        label: status,
        className: "bg-[#EEF0F4] text-[#7A6A70]",
    };
    return (
        <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-semibold ${config.className}`}>
            {config.label}
        </span>
    );
}
