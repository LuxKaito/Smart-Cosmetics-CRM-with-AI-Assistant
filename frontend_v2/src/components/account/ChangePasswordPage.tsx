"use client";

import { useState, type FormEvent } from "react";
import { changePassword } from "../../services/authService";
import { getErrorMessage } from "../../lib/errors";
import AccountLayout from "./AccountLayout";

export default function ChangePasswordPage() {
    const [form, setForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{
        type: "error" | "success" | "";
        message: string;
    }>({ type: "", message: "" });

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (form.newPassword !== form.confirmPassword) {
            setStatus({
                type: "error",
                message: "Mật khẩu nhập lại chưa khớp.",
            });
            return;
        }

        setIsSaving(true);
        setStatus({ type: "", message: "" });
        try {
            await changePassword({
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
            });
            setForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
            setStatus({
                type: "success",
                message: "Đổi mật khẩu thành công.",
            });
        } catch (error) {
            setStatus({
                type: "error",
                message: getErrorMessage(error, "Đổi mật khẩu thất bại."),
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AccountLayout
            title="Đổi mật khẩu"
            subtitle="Sử dụng mật khẩu mạnh và không dùng lại mật khẩu ở dịch vụ khác.">
            <form className="max-w-2xl space-y-5" onSubmit={handleSubmit}>
                <PasswordField
                    label="Mật khẩu hiện tại"
                    value={form.currentPassword}
                    onChange={(value) =>
                        setForm((current) => ({
                            ...current,
                            currentPassword: value,
                        }))
                    }
                />
                <PasswordField
                    label="Mật khẩu mới"
                    value={form.newPassword}
                    onChange={(value) =>
                        setForm((current) => ({
                            ...current,
                            newPassword: value,
                        }))
                    }
                    minLength={8}
                />
                <PasswordField
                    label="Nhập lại mật khẩu mới"
                    value={form.confirmPassword}
                    onChange={(value) =>
                        setForm((current) => ({
                            ...current,
                            confirmPassword: value,
                        }))
                    }
                    minLength={8}
                />
                <p className="text-xs text-[#7A6A70]">
                    Mật khẩu mới cần ít nhất 8 ký tự và khác mật khẩu hiện tại.
                </p>
                {status.message ? (
                    <div
                        className={`rounded-xl border px-4 py-3 text-sm ${
                            status.type === "error"
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        }`}>
                        {status.message}
                    </div>
                ) : null}
                <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-xl bg-[#F999B7] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#ee86a7] disabled:cursor-not-allowed disabled:opacity-60">
                    {isSaving ? "Đang cập nhật..." : "Đổi mật khẩu"}
                </button>
            </form>
        </AccountLayout>
    );
}

function PasswordField({
    label,
    value,
    onChange,
    minLength,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    minLength?: number;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#4A3540]">
                {label}
            </span>
            <input
                type="password"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                required
                minLength={minLength}
                autoComplete="new-password"
                className="account-input"
            />
        </label>
    );
}
