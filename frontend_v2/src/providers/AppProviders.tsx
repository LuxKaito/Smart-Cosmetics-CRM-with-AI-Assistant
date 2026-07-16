"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { Toaster } from "sonner";
import AuthHydrator from "./AuthHydrator";

interface AppProvidersProps {
    children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 30_000,
                        retry: 1,
                        refetchOnWindowFocus: false,
                    },
                },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            <AuthHydrator />
            {children}
            <Toaster position="top-right" richColors duration={1000} />
        </QueryClientProvider>
    );
}
