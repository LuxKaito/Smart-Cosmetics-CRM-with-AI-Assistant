"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import { changePassword } from "../../services/authService";
import { getCurrentUser } from "../../utils/user";
import { getErrorMessage } from "../../lib/errors";

type PasswordFormState = {
    oldPassword: string;
    newPassword: string;
};

export default function ChangePasswordPage() {
    const [form, setForm] = useState<PasswordFormState>({
        oldPassword: "",
        newPassword: "",
    });
    const [status, setStatus] = useState({ type: "", message: "" });

    const handleChange =
        (field: keyof PasswordFormState) =>
        (event: ChangeEvent<HTMLInputElement>) => {
            setForm((prev) => ({ ...prev, [field]: event.target.value }));
        };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const user = getCurrentUser();
        if (!user?.email) {
            setStatus({ type: "error", message: "Vui lòng đăng nhập." });
            return;
        }
        try {
            await changePassword({
                currentPassword: form.oldPassword,
                newPassword: form.newPassword,
            });
            setStatus({ type: "success", message: "Đổi mật khẩu thành công." });
        } catch (error) {
            setStatus({
                type: "error",
                message: getErrorMessage(error, "Đổi mật khẩu thất bại."),
            });
        }
    };

    return (
        <div className="page-shell">
            <Header />
            <main className="auth-page">
                <section className="auth-card" aria-label="Đổi mật khẩu">
                    <h1>Đổi mật khẩu</h1>
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <label className="auth-field">
                            <span>Mật khẩu hiện tại</span>
                            <input
                                type="password"
                                value={form.oldPassword}
                                onChange={handleChange("oldPassword")}
                                required
                            />
                        </label>
                        <label className="auth-field">
                            <span>Mật khẩu mới</span>
                            <input
                                type="password"
                                value={form.newPassword}
                                onChange={handleChange("newPassword")}
                                required
                            />
                        </label>
                        {status.message && (
                            <div
                                className={`auth-message ${status.type === "error" ? "is-error" : "is-success"}`}>
                                {status.message}
                            </div>
                        )}
                        <button type="submit" className="auth-submit">
                            Đổi mật khẩu
                        </button>
                    </form>
                </section>
            </main>
            <Footer />
        </div>
    );
}
