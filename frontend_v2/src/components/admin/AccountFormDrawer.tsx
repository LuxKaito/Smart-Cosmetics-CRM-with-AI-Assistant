"use client";

import { Eye, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { AdminDepartment, AdminUserPayload } from "../../types/admin";

interface AccountFormDrawerProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (payload: AdminUserPayload) => Promise<void> | void;
}

const initialForm: AdminUserPayload & { confirmPassword: string } = {
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "staff",
    department: "sales",
    isBlocked: false,
};

const departmentOptions: Array<{ value: AdminDepartment; label: string }> = [
    { value: "sales", label: "Sales" },
    { value: "warehouse", label: "Warehouse" },
    { value: "support", label: "Support" },
    { value: "marketing", label: "Marketing" },
];

export default function AccountFormDrawer({
    open,
    onClose,
    onSubmit,
}: AccountFormDrawerProps) {
    const [form, setForm] = useState(initialForm);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setForm(initialForm);
            setError("");
        }
    }, [open]);

    if (!open) return null;

    const submit = async () => {
        if (!form.name.trim() || !form.email.trim() || !form.password) {
            setError("Vui lòng nhập đủ họ tên, email và mật khẩu.");
            return;
        }
        if (form.password !== form.confirmPassword) {
            setError("Mật khẩu xác nhận không khớp.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");
            await onSubmit({
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone?.trim(),
                password: form.password,
                role: form.role,
                department: form.department,
                isBlocked: form.isBlocked,
            });
            onClose();
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Không tạo được tài khoản.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#2B1B24]/35 p-4">
            <aside className="h-full w-full max-w-[420px] overflow-y-auto rounded-[24px] border border-[#FFE3EC] bg-white p-6 shadow-[0_24px_60px_rgba(43,27,36,0.18)]">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[#2B1B24]">Thêm tài khoản</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-[#2B1B24] hover:bg-[#FFF0F5]">
                        <X size={18} />
                    </button>
                </div>

                <form
                    className="space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        void submit();
                    }}>
                    <Field label="Họ và tên">
                        <input
                            value={form.name}
                            onChange={(event) => setForm({ ...form, name: event.target.value })}
                            className="admin-input"
                            placeholder="Nhập họ và tên"
                        />
                    </Field>
                    <Field label="Email">
                        <input
                            value={form.email}
                            onChange={(event) => setForm({ ...form, email: event.target.value })}
                            className="admin-input"
                            placeholder="Nhập email"
                            type="email"
                        />
                    </Field>
                    <Field label="Số điện thoại">
                        <input
                            value={form.phone}
                            onChange={(event) => setForm({ ...form, phone: event.target.value })}
                            className="admin-input"
                            placeholder="Nhập số điện thoại"
                        />
                    </Field>
                    <Field label="Vai trò">
                        <select
                            value={form.role}
                            onChange={(event) =>
                                setForm({ ...form, role: event.target.value as AdminUserPayload["role"] })
                            }
                            className="admin-input">
                            <option value="admin">Admin</option>
                            <option value="staff">Nhân viên</option>
                        </select>
                    </Field>
                    <Field label="Phòng ban">
                        <select
                            value={form.department || "sales"}
                            onChange={(event) =>
                                setForm({ ...form, department: event.target.value as AdminDepartment })
                            }
                            className="admin-input">
                            {departmentOptions.map((department) => (
                                <option key={department.value} value={department.value}>
                                    {department.label}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Trạng thái">
                        <select
                            value={form.isBlocked ? "blocked" : "active"}
                            onChange={(event) => setForm({ ...form, isBlocked: event.target.value === "blocked" })}
                            className="admin-input">
                            <option value="active">Hoạt động</option>
                            <option value="blocked">Tạm khóa</option>
                        </select>
                    </Field>
                    <Field label="Mật khẩu">
                        <PasswordInput
                            value={form.password}
                            onChange={(value) => setForm({ ...form, password: value })}
                            placeholder="Nhập mật khẩu"
                        />
                    </Field>
                    <Field label="Xác nhận mật khẩu">
                        <PasswordInput
                            value={form.confirmPassword}
                            onChange={(value) => setForm({ ...form, confirmPassword: value })}
                            placeholder="Nhập lại mật khẩu"
                        />
                    </Field>

                    {error ? <p className="rounded-xl bg-[#FFE7EE] px-4 py-3 text-sm text-[#E11D48]">{error}</p> : null}

                    <div className="flex gap-3 pt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="h-12 flex-1 rounded-2xl border border-[#EADDE2] bg-white font-semibold text-[#2B1B24]">
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="h-12 flex-1 rounded-2xl bg-[#F999B7] font-semibold text-white shadow-[0_12px_24px_rgba(249,153,183,0.24)]">
                            {submitting ? "Đang tạo..." : "Tạo tài khoản"}
                        </button>
                    </div>
                </form>
            </aside>
        </div>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#2B1B24]">{label}</span>
            {children}
        </label>
    );
}

function PasswordInput({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) {
    const [visible, setVisible] = useState(false);
    return (
        <div className="relative">
            <input
                className="admin-input pr-10"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                type={visible ? "text" : "password"}
            />
            <button
                type="button"
                onClick={() => setVisible((next) => !next)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6A70]">
                <Eye size={16} />
            </button>
        </div>
    );
}
