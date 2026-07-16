"use client";

import type { ReactNode } from "react";

export default function AdminFilterBar({ children }: { children: ReactNode }) {
    return (
        <section className="min-w-0 rounded-[20px] border border-[#FFE3EC] bg-white p-4 shadow-[0_16px_38px_rgba(43,27,36,0.04)] 2xl:p-5">
            <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.4fr)_repeat(4,minmax(150px,1fr))] 2xl:grid-cols-[minmax(300px,1.45fr)_repeat(3,minmax(170px,1fr))_minmax(112px,0.55fr)_minmax(140px,0.65fr)]">
                {children}
            </div>
        </section>
    );
}
