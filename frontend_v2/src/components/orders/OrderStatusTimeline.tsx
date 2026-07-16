import {
    CheckCircle2,
    Clock3,
    Circle,
    Truck,
    XCircle,
} from "lucide-react";
import type { OrderItem } from "../../services/orderService";
import {
    getOrderTimeline,
    type OrderTimelineStep,
} from "./orderStatus";

function StepIcon({ step }: { step: OrderTimelineStep }) {
    const className = "h-6 w-6";
    if (step.state === "failed") return <XCircle className={className} />;
    if (step.icon === "truck" && step.state !== "pending") {
        return <Truck className={className} />;
    }
    if (step.state === "done") return <CheckCircle2 className={className} />;
    if (step.state === "current") return <Clock3 className={className} />;
    return <Circle className={className} />;
}

export default function OrderStatusTimeline({ order }: { order: OrderItem }) {
    const steps = getOrderTimeline(order);

    return (
        <section>
            <h2 className="text-lg font-bold">Theo dõi đơn hàng</h2>
            <ol className="mt-5 grid gap-0 md:grid-cols-[repeat(auto-fit,minmax(100px,1fr))]">
                {steps.map((step, index) => {
                    const isLast = index === steps.length - 1;
                    const tone =
                        step.state === "failed"
                            ? "text-rose-600"
                            : step.state === "pending"
                              ? "text-slate-300"
                              : "text-[#F06C96]";
                    return (
                        <li
                            key={step.key}
                            className="relative flex gap-3 pb-6 md:flex-col md:items-center md:gap-2 md:pb-0 md:text-center">
                            {!isLast ? (
                                <span className="absolute left-3 top-7 h-[calc(100%-1.5rem)] w-px bg-[#FFD4E1] md:left-[calc(50%+14px)] md:top-3 md:h-px md:w-[calc(100%-28px)]" />
                            ) : null}
                            <span className={`relative z-10 bg-white ${tone}`}>
                                <StepIcon step={step} />
                            </span>
                            <span
                                className={`text-sm font-semibold ${
                                    step.state === "pending"
                                        ? "text-slate-400"
                                        : "text-[#2B1B24]"
                                }`}>
                                {step.label}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
