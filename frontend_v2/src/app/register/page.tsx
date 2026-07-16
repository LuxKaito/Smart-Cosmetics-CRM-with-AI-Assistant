"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import GoogleSignInButton from "../../components/auth/GoogleSignInButton";
import { registerUser } from "../../services/authService";
import { getErrorMessage } from "../../lib/errors";
import { useCartStore } from "../../stores/cartStore";

const registerSchema = z
    .object({
        name: z.string().min(2, "Vui lòng nhập họ và tên."),
        email: z.string().email("Email không hợp lệ."),
        password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự."),
        confirmPassword: z.string().min(8, "Vui lòng xác nhận mật khẩu."),
    })
    .refine((data) => data.password === data.confirmPassword, {
        path: ["confirmPassword"],
        message: "Mật khẩu xác nhận chưa khớp.",
    });

export default function RegisterPage() {
    const router = useRouter();
    const refreshCart = useCartStore((state) => state.refresh);
    const [redirect, setRedirect] = useState("/");
    const [statusMessage, setStatusMessage] = useState("");
    const [isRegistered, setIsRegistered] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    useEffect(() => {
        if (typeof window === "undefined") return;
        const redirectParam =
            new URLSearchParams(window.location.search).get("redirect") || "/";
        setRedirect(redirectParam);
    }, []);

    const onSubmit = async (values: z.infer<typeof registerSchema>) => {
        setStatusMessage("");
        try {
            const response = await registerUser({
                name: values.name.trim(),
                email: values.email.trim(),
                password: values.password,
            });

            const message =
                response?.message ||
                "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.";
            setStatusMessage(message);
            setIsRegistered(true);
            toast.success(message);
        } catch (error) {
            const message = getErrorMessage(error, "Đăng ký thất bại.");
            setStatusMessage(message);
            setIsRegistered(false);
            toast.error(message);
        }
    };

    const handleGoogleSuccess = async () => {
        await refreshCart();
        router.push(redirect);
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
                        <h1 className="mt-2 text-3xl font-bold">
                            Đăng ký tài khoản
                        </h1>
                        <p className="mt-2 text-sm text-[#7A6A70]">
                            Tạo tài khoản để lưu đơn hàng, giỏ hàng và nhận ưu
                            đãi thành viên.
                        </p>

                        <form
                            className="mt-6 space-y-4"
                            onSubmit={handleSubmit(onSubmit)}>
                            <GoogleSignInButton
                                text="signup_with"
                                onLoginSuccess={handleGoogleSuccess}
                                onLoginError={(message) => {
                                    setStatusMessage(message);
                                    setIsRegistered(false);
                                }}
                            />

                            <button
                                type="button"
                                disabled
                                className="h-12 w-full rounded-2xl border border-[#FFD4E1] bg-white px-4 text-sm font-semibold text-[#7A6A70] opacity-70">
                                Đăng ký với Facebook (sắp có)
                            </button>

                            <div className="relative py-1">
                                <div className="h-px bg-[#FFD4E1]" />
                                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-sm text-[#7A6A70]">
                                    hoặc đăng ký với email
                                </span>
                            </div>

                            <FormField
                                label="Họ và tên"
                                error={errors.name?.message}>
                                <input
                                    {...register("name")}
                                    type="text"
                                    placeholder="Nhập họ và tên"
                                    className="h-12 w-full rounded-2xl border border-[#FFD4E1] bg-white px-4 outline-none focus:border-[#F999B7]"
                                />
                            </FormField>

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

                            <FormField
                                label="Xác nhận mật khẩu"
                                error={errors.confirmPassword?.message}>
                                <input
                                    {...register("confirmPassword")}
                                    type="password"
                                    placeholder="Nhập lại mật khẩu"
                                    className="h-12 w-full rounded-2xl border border-[#FFD4E1] bg-white px-4 outline-none focus:border-[#F999B7]"
                                />
                            </FormField>

                            {statusMessage ? (
                                <div
                                    className={`rounded-2xl border px-4 py-3 text-sm ${
                                        isRegistered
                                            ? "border-[#FFD4E1] bg-[#FFF7FA] text-[#2B1B24]"
                                            : "border-[#f0a3b6] bg-[#fff3f7] text-[#b14063]"
                                    }`}>
                                    {statusMessage}
                                </div>
                            ) : null}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-12 w-full rounded-2xl bg-[#F999B7] font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70">
                                {isSubmitting ? "Đang xử lý..." : "Đăng ký"}
                            </button>

                            <p className="text-center text-sm text-[#7A6A70]">
                                Đã có tài khoản?{" "}
                                <Link
                                    href="/login"
                                    className="font-semibold text-[#F999B7]">
                                    Đăng nhập
                                </Link>
                            </p>

                            {isRegistered ? (
                                <Link
                                    href="/login"
                                    className="block rounded-2xl border border-[#FFD4E1] px-4 py-3 text-center text-sm font-semibold text-[#2B1B24]">
                                    Chuyển sang đăng nhập
                                </Link>
                            ) : null}
                        </form>
                    </div>

                    <aside className="overflow-hidden rounded-3xl bg-[#FFF7FA]">
                        <Image
                            src="/img/img_register.png"
                            alt="Quyền lợi thành viên LuxBerry khi đăng ký tài khoản"
                            width={1024}
                            height={1536}
                            priority
                            className="h-full max-h-[920px] min-h-[420px] w-full object-cover object-top"
                        />
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
