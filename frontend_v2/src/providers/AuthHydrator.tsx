"use client";

import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { useCartStore } from "../stores/cartStore";

export default function AuthHydrator() {
    const hydrateAuth = useAuthStore((state) => state.hydrate);
    const hydrateCart = useCartStore((state) => state.hydrate);

    useEffect(() => {
        hydrateAuth();
        hydrateCart();
    }, [hydrateAuth, hydrateCart]);

    return null;
}
