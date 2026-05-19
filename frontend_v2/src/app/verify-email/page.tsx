"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import { verifyEmailToken } from "../../services/authService";
import { getErrorMessage } from "../../lib/errors";

export default function VerifyEmailPage() {
    const [token, setToken] = useState("");
    const [tokenChecked, setTokenChecked] = useState(false);
    const [status, setStatus] = useState<{
        type: "idle" | "loading" | "success" | "error";
        message: string;
    }>({
        type: "idle",
        message: "",
    });

    useEffect(() => {
        if (typeof window === "undefined") return;
        const tokenParam =
            new URLSearchParams(window.location.search).get("token") || "";
        setToken(tokenParam);
        setTokenChecked(true);
    }, []);

    useEffect(() => {
        if (!tokenChecked) return;
        if (!token) {
            setStatus({
                type: "error",
                message: "Liên kết xác thực không hợp lệ hoặc đã thiếu token.",
            });
            return;
        }

        let cancelled = false;
        const verify = async () => {
            setStatus({ type: "loading", message: "Đang xác thực email..." });
            try {
                await verifyEmailToken({ token });
                if (cancelled) return;
                setStatus({
                    type: "success",
                    message:
                        "Xác thực email thành công. Bạn có thể đăng nhập ngay bây giờ.",
                });
            } catch (error) {
                if (cancelled) return;
                setStatus({
                    type: "error",
                    message: getErrorMessage(
                        error,
                        "Xác thực email thất bại. Vui lòng thử lại.",
                    ),
                });
            }
        };

        void verify();
        return () => {
            cancelled = true;
        };
    }, [token, tokenChecked]);

    return (
        <div className="min-h-screen bg-[#FFF7FA] text-[#2B1B24]">
            <Header />
            <main className="mx-auto max-w-3xl px-4 py-10">
                <section className="rounded-[28px] bg-white p-6 text-center shadow-[0_10px_30px_rgba(249,153,183,0.15)] md:p-10">
                    <h1 className="text-3xl font-bold">Xác thực email</h1>
                    <p className="mx-auto mt-3 max-w-xl text-sm text-[#7A6A70]">
                        Hệ thống đang xác thực địa chỉ email cho tài khoản
                        LuxBerry của bạn.
                    </p>

                    <div
                        className={`mx-auto mt-6 max-w-xl rounded-2xl border px-4 py-4 text-sm ${
                            status.type === "success"
                                ? "border-[#FFD4E1] bg-[#FFF7FA] text-[#2B1B24]"
                                : status.type === "error"
                                  ? "border-[#f0a3b6] bg-[#fff3f7] text-[#b14063]"
                                  : "border-[#FFD4E1] bg-[#FFF7FA] text-[#7A6A70]"
                        }`}>
                        {status.message || "Đang xử lý..."}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href="/login"
                            className="rounded-2xl bg-[#F999B7] px-5 py-3 text-sm font-semibold text-white">
                            Đăng nhập
                        </Link>
                        <Link
                            href="/register"
                            className="rounded-2xl border border-[#FFD4E1] px-5 py-3 text-sm font-semibold text-[#2B1B24]">
                            Đăng ký tài khoản khác
                        </Link>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
