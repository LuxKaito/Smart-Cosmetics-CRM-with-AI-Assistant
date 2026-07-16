"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import type { AdminAssignableRole, AdminDepartment, AdminUser } from "../../types/admin";

interface UserRoleFormProps {
    open: boolean;
    user?: AdminUser | null;
    onClose: () => void;
    onSubmit: (payload: { role: AdminAssignableRole; department: AdminDepartment | "" }) => Promise<void> | void;
}

const departmentOptions: Array<{ value: AdminDepartment; label: string }> = [
    { value: "sales", label: "Sales" },
    { value: "warehouse", label: "Warehouse" },
    { value: "support", label: "Support" },
    { value: "marketing", label: "Marketing" },
];

export default function UserRoleForm({ open, user, onClose, onSubmit }: UserRoleFormProps) {
    const [role, setRole] = useState<AdminAssignableRole>("staff");
    const [department, setDepartment] = useState<AdminDepartment | "">("sales");
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    useEffect(() => {
        if (!open) return;
        setRole(user?.role === "admin" ? "admin" : "staff");
        setDepartment((user?.department as AdminDepartment | "") || "sales");
        setSubmitError("");
    }, [open, user]);

    if (!open) return null;

    const submit = async () => {
        try {
            setSubmitting(true);
            setSubmitError("");
            await onSubmit({ role, department });
            onClose();
        } catch (requestError) {
            setSubmitError(
                requestError instanceof Error
                    ? requestError.message
                    : "Không cập nhật được phân quyền.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B1B24]/35 p-4">
            <div className="w-full max-w-[680px] rounded-[22px] border border-[#F1E7EC] bg-white p-6 shadow-[0_24px_60px_rgba(43,27,36,0.18)]">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h3 className="truncate text-[22px] font-semibold text-[#2B1B24]">Sửa tài khoản</h3>
                        <p className="mt-1 truncate text-sm text-[#6B7280]">
                            {user?.name || user?.email || "Tài khoản"}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-[#2B1B24] hover:bg-[#FFF7FA]"
                        aria-label="Đóng">
                        <X size={18} />
                    </button>
                </div>

                <form
                    className="mt-6 grid gap-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        void submit();
                    }}>
                    <Field label="Vai trò">
                        <select
                            value={role}
                            onChange={(event) => setRole(event.target.value as AdminAssignableRole)}
                            className="admin-input">
                            <option value="admin">Admin</option>
                            <option value="staff">Nhân viên</option>
                        </select>
                    </Field>

                    <Field label="Phòng ban">
                        <select
                            value={department || "sales"}
                            onChange={(event) => setDepartment(event.target.value as AdminDepartment)}
                            className="admin-input">
                            {departmentOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </Field>

                    {submitError ? (
                        <p className="rounded-xl bg-[#FFE7EE] px-4 py-3 text-sm text-[#E11D48]">
                            {submitError}
                        </p>
                    ) : null}

                    <div className="mt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="h-11 min-w-[120px] rounded-xl border border-[#F1E7EC] bg-white px-5 text-sm font-semibold text-[#2B1B24] disabled:opacity-60">
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="h-11 min-w-[120px] rounded-xl bg-[#F999B7] px-5 text-sm font-semibold text-white disabled:opacity-65">
                            {submitting ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    </div>
                </form>
            </div>
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
