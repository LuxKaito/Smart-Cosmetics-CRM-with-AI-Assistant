"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { fetchMe, updateProfile } from "../../services/authService";
import { getErrorMessage } from "../../lib/errors";
import AccountLayout from "./AccountLayout";

export default function ProfilePage() {
    const [form, setForm] = useState({ name: "", phone: "", email: "" });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{
        type: "error" | "success" | "";
        message: string;
    }>({ type: "", message: "" });

    useEffect(() => {
        let mounted = true;
        void fetchMe()
            .then(({ user }) => {
                if (!mounted) return;
                setForm({
                    name: user.name || "",
                    phone: user.phone || "",
                    email: user.email || "",
                });
            })
            .catch((error) => {
                if (!mounted) return;
                setStatus({
                    type: "error",
                    message: getErrorMessage(
                        error,
                        "Không tải được thông tin tài khoản.",
                    ),
                });
            })
            .finally(() => {
                if (mounted) setIsLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, []);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSaving(true);
        setStatus({ type: "", message: "" });
        try {
            const user = await updateProfile({
                name: form.name.trim(),
                phone: form.phone.trim(),
            });
            setForm((current) => ({
                ...current,
                name: user.name || "",
                phone: user.phone || "",
            }));
            setStatus({
                type: "success",
                message: "Đã cập nhật thông tin tài khoản.",
            });
        } catch (error) {
            setStatus({
                type: "error",
                message: getErrorMessage(
                    error,
                    "Không thể cập nhật thông tin tài khoản.",
                ),
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AccountLayout
            title="Thông tin tài khoản"
            subtitle="Quản lý thông tin liên hệ dùng cho mua sắm và nhận hàng.">
            {status.message ? (
                <div
                    className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
                        status.type === "error"
                            ? "border-rose-200 bg-rose-50 text-rose-700"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}>
                    {status.message}
                    {status.type === "error" ? (
                        <Link
                            href="/login?redirect=/account"
                            className="ml-2 font-semibold underline">
                            Đăng nhập
                        </Link>
                    ) : null}
                </div>
            ) : null}

            {isLoading ? (
                <div className="animate-pulse space-y-4">
                    <div className="h-12 rounded-xl bg-[#FFF0F5]" />
                    <div className="h-12 rounded-xl bg-[#FFF0F5]" />
                    <div className="h-12 rounded-xl bg-[#FFF0F5]" />
                </div>
            ) : (
                <form className="max-w-2xl space-y-5" onSubmit={handleSubmit}>
                    <Field label="Họ và tên">
                        <input
                            value={form.name}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    name: event.target.value,
                                }))
                            }
                            required
                            minLength={2}
                            className="account-input"
                            placeholder="Nhập họ và tên"
                        />
                    </Field>
                    <Field label="Số điện thoại">
                        <input
                            value={form.phone}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    phone: event.target.value,
                                }))
                            }
                            className="account-input"
                            inputMode="tel"
                            placeholder="Ví dụ: 0901234567"
                        />
                    </Field>
                    <Field label="Email đăng nhập">
                        <input
                            value={form.email}
                            readOnly
                            className="account-input bg-[#FAF7F8] text-[#7A6A70]"
                        />
                    </Field>
                    <p className="text-xs text-[#7A6A70]">
                        Email đăng nhập không thể thay đổi tại đây.
                    </p>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="rounded-xl bg-[#F999B7] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#ee86a7] disabled:cursor-not-allowed disabled:opacity-60">
                        {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                </form>
            )}
        </AccountLayout>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#4A3540]">
                {label}
            </span>
            {children}
        </label>
    );
}
