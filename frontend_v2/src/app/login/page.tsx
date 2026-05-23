"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import GoogleSignInButton from "../../components/auth/GoogleSignInButton";
import {
    loginUser,
    resendVerificationEmail,
} from "../../services/authService";
import { getErrorMessage } from "../../lib/errors";
import { useCartStore } from "../../stores/cartStore";

const loginSchema = z.object({
    email: z.string().email("Email không hợp lệ."),
    password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự."),
});

export default function LoginPage() {
    const router = useRouter();
    const refreshCart = useCartStore((state) => state.refresh);
    const [redirect, setRedirect] = useState("/");
    const [status, setStatus] = useState<{
        type: "" | "error" | "success";
        message: string;
    }>({ type: "", message: "" });
    const [showResend, setShowResend] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const emailValue = watch("email");

    useEffect(() => {
        if (typeof window === "undefined") return;
        const redirectParam =
            new URLSearchParams(window.location.search).get("redirect") || "/";
        setRedirect(redirectParam);
    }, []);

    useEffect(() => {
        router.prefetch(redirect || "/");
    }, [redirect, router]);

    const handleGoogleSuccess = async () => {
        await refreshCart();
        router.replace(redirect);
    };

    const onSubmit = async (values: z.infer<typeof loginSchema>) => {
        setStatus({ type: "", message: "" });
        setShowResend(false);
        try {
            const result = await loginUser({
                email: values.email.trim(),
                password: values.password,
            });

            toast.success(result?.message || "Đăng nhập thành công.");
            await refreshCart();
            router.push(redirect);
        } catch (error) {
            const message = getErrorMessage(error, "Đăng nhập thất bại.");
            const needVerify = /xác thực email|xac thuc email/i.test(message);
            setShowResend(needVerify);
            setStatus({ type: "error", message });
            toast.error(message);
        }
    };

    const handleResend = async () => {
        if (!emailValue) {
            setStatus({
                type: "error",
                message: "Vui lòng nhập email trước khi gửi lại xác thực.",
            });
            return;
        }

        setIsResending(true);
        try {
            const response = await resendVerificationEmail({
                email: emailValue.trim(),
            });
            const message =
                response?.message ||
                "Vui lòng kiểm tra email để xác thực tài khoản.";
            setStatus({ type: "success", message });
            toast.success(message);
        } catch (error) {
            const message = getErrorMessage(
                error,
                "Không gửi lại được email xác thực.",
            );
            setStatus({ type: "error", message });
            toast.error(message);
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FFF7FA] text-[#2B1B24]">
            <Header />
            <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
                <section className="grid gap-6 rounded-[28px] bg-white p-5 shadow-[0_10px_30px_rgba(249,153,183,0.15)] md:grid-cols-2 md:p-8">
                    <div>
                        <p className="text-sm font-semibold text-[#7A6A70]">
                            LuxBerry Beauty
                        </p>
                        <h1 className="mt-2 text-3xl font-bold">Đăng nhập</h1>
                        <p className="mt-2 text-sm text-[#7A6A70]">
                            Chào mừng bạn quay lại với thế giới làm đẹp của
                            LuxBerry.
                        </p>

                        <form
                            className="mt-6 space-y-4"
                            onSubmit={handleSubmit(onSubmit)}>
                            <GoogleSignInButton
                                text="signin_with"
                                onLoginSuccess={handleGoogleSuccess}
                                onLoginError={(message) => {
                                    setStatus({ type: "error", message });
                                }}
                            />

                            <button
                                type="button"
                                disabled
                                className="h-12 w-full rounded-2xl border border-[#FFD4E1] bg-white px-4 text-sm font-semibold text-[#7A6A70] opacity-70">
                                Đăng nhập với Facebook (sắp có)
                            </button>

                            <div className="relative py-1">
                                <div className="h-px bg-[#FFD4E1]" />
                                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-sm text-[#7A6A70]">
                                    hoặc
                                </span>
                            </div>

                            <FormField
                                label="Email"
                                error={errors.email?.message}>
                                <input
                                    {...register("email")}
                                    type="email"
                                    placeholder="Nhập email"
                                    className="h-12 w-full rounded-2xl border border-[#FFD4E1] bg-white px-4 outline-none focus:border-[#F999B7]"
                                />
                            </FormField>

                            <FormField
                                label="Mật khẩu"
                                error={errors.password?.message}>
                                <input
                                    {...register("password")}
                                    type="password"
                                    placeholder="Nhập mật khẩu"
                                    className="h-12 w-full rounded-2xl border border-[#FFD4E1] bg-white px-4 outline-none focus:border-[#F999B7]"
                                />
                            </FormField>

                            {status.message ? (
                                <div
                                    className={`rounded-2xl border px-4 py-3 text-sm ${
                                        status.type === "error"
                                            ? "border-[#f0a3b6] bg-[#fff3f7] text-[#b14063]"
                                            : "border-[#FFD4E1] bg-[#FFF7FA] text-[#2B1B24]"
                                    }`}>
                                    {status.message}
                                </div>
                            ) : null}

                            {showResend ? (
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={isResending}
                                    className="w-full rounded-2xl border border-[#FFD4E1] px-4 py-3 text-sm font-semibold text-[#2B1B24] disabled:opacity-60">
                                    {isResending
                                        ? "Đang gửi lại email xác thực..."
                                        : "Gửi lại email xác thực"}
                                </button>
                            ) : null}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-12 w-full rounded-2xl bg-[#F999B7] font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70">
                                {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
                            </button>

                            <div className="flex items-center justify-between text-sm text-[#7A6A70]">
                                <Link
                                    href="/change-password"
                                    className="hover:text-[#F999B7]">
                                    Quên mật khẩu?
                                </Link>
                                <Link
                                    href="/register"
                                    className="font-semibold text-[#F999B7]">
                                    Đăng ký tài khoản
                                </Link>
                            </div>
                        </form>
                    </div>

                    <aside className="rounded-3xl bg-[#FFF7FA] p-6">
                        <h2 className="text-2xl font-bold text-[#2B1B24]">
                            Đăng nhập để trải nghiệm trọn vẹn
                        </h2>
                        <ul className="mt-4 space-y-3 text-sm text-[#7A6A70]">
                            <li className="rounded-2xl bg-white p-4">
                                Theo dõi đơn hàng theo thời gian thực.
                            </li>
                            <li className="rounded-2xl bg-white p-4">
                                Quản lý danh sách sản phẩm yêu thích nhanh chóng.
                            </li>
                            <li className="rounded-2xl bg-white p-4">
                                Nhận ưu đãi và voucher cá nhân hóa.
                            </li>
                            <li className="rounded-2xl bg-white p-4">
                                Tiếp tục thanh toán ngay với giỏ hàng đã lưu.
                            </li>
                        </ul>
                    </aside>
                </section>
            </main>
            <Footer />
        </div>
    );
}

function FormField({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-medium">{label}</span>
            {children}
            {error ? <span className="mt-1 block text-xs text-[#b14063]">{error}</span> : null}
        </label>
    );
}
