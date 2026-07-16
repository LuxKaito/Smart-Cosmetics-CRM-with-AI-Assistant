"use client";

import { useParams } from "next/navigation";
import OrderDetailPage from "../../../../components/orders/OrderDetailPage";

export default function AccountOrderDetailPage() {
    const params = useParams<{ id: string }>();
    return <OrderDetailPage orderId={params.id} />;
}
