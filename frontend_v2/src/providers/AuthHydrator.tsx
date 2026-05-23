"use client";

import { useEffect } from "react";
import { fetchMe } from "../services/authService";
import { useAuthStore } from "../stores/authStore";
import { useCartStore } from "../stores/cartStore";

export default function AuthHydrator() {
    const hydrateAuth = useAuthStore((state) => state.hydrate);
    const setUser = useAuthStore((state) => state.setUser);
    const hydrateCart = useCartStore((state) => state.hydrate);
    const refreshCart = useCartStore((state) => state.refresh);

    useEffect(() => {
        hydrateAuth();
        hydrateCart();

        void fetchMe()
            .then((data) => {
                if (data?.user) {
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            })
            .catch(() => {
                setUser(null);
            })
            .finally(() => {
                void refreshCart();
            });
    }, [hydrateAuth, hydrateCart, refreshCart, setUser]);

    return null;
}
