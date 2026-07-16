import { formatOrderStatus, formatPaymentStatus } from "./orderStatus";

const colorByStatus: Record<string, string> = {
    PENDING_PAYMENT: "border-amber-200 bg-amber-50 text-amber-700",
    PENDING_CONFIRMATION: "border-amber-200 bg-amber-50 text-amber-700",
    UNPAID: "border-amber-200 bg-amber-50 text-amber-700",
    PENDING: "border-amber-200 bg-amber-50 text-amber-700",
    CONFIRMED: "border-blue-200 bg-blue-50 text-blue-700",
    SHIPPING: "border-violet-200 bg-violet-50 text-violet-700",
    PAID: "border-emerald-200 bg-emerald-50 text-emerald-700",
    DELIVERED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    CANCELLED: "border-rose-200 bg-rose-50 text-rose-700",
    FAILED: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function OrderStatusBadge({
    status,
    type = "order",
}: {
    status?: string;
    type?: "order" | "payment";
}) {
    const label =
        type === "payment"
            ? formatPaymentStatus(status)
            : formatOrderStatus(status);

    return (
        <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                colorByStatus[status || ""] ||
                "border-slate-200 bg-slate-50 text-slate-600"
            }`}>
            {label}
        </span>
    );
}
