"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AdminVoucher, AdminVoucherPayload } from "../../types/admin";

const voucherSchema = z
    .object({
        code: z
            .string()
            .trim()
            .min(3, "Nhập mã voucher.")
            .max(64, "Mã voucher quá dài."),
        name: z.string().trim().min(2, "Nhập tên voucher."),
        description: z.string().trim().optional(),
        discountType: z.enum(["percent", "fixed"]),
        discountValue: z.coerce
            .number()
            .min(0, "Giá trị giảm không hợp lệ."),
        minOrderValue: z.coerce.number().min(0),
        maxDiscount: z.union([z.coerce.number().min(0), z.literal(""), z.null()]),
        startDate: z.string().min(1, "Chọn ngày bắt đầu."),
        endDate: z.string().min(1, "Chọn ngày kết thúc."),
        usageLimit: z.coerce.number().int().min(0),
        usedCount: z.coerce.number().int().min(0),
        isActive: z.boolean(),
    })
    .superRefine((data, ctx) => {
        const start = new Date(data.startDate).getTime();
        const end = new Date(data.endDate).getTime();
        if (Number.isFinite(start) && Number.isFinite(end) && end < start) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.",
                path: ["endDate"],
            });
        }
        if (data.discountType === "percent" && data.discountValue > 100) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Phần trăm giảm không được vượt quá 100.",
                path: ["discountValue"],
            });
        }
    });

type VoucherFormValues = z.infer<typeof voucherSchema>;

interface VoucherFormProps {
    open: boolean;
    mode: "create" | "edit";
    initialValue?: AdminVoucher | null;
    onClose: () => void;
    onSubmit: (payload: AdminVoucherPayload) => Promise<void> | void;
}

export default function VoucherForm({
    open,
    mode,
    initialValue,
    onClose,
    onSubmit,
}: VoucherFormProps) {
    const [submitting, setSubmitting] = useState(false);
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        reset,
    } = useForm<VoucherFormValues>({
        resolver: zodResolver(voucherSchema),
        defaultValues: {
            code: "",
            name: "",
            description: "",
            discountType: "percent",
            discountValue: 10,
            minOrderValue: 0,
            maxDiscount: "",
            startDate: "",
            endDate: "",
            usageLimit: 0,
            usedCount: 0,
            isActive: true,
        },
    });

    useEffect(() => {
        if (!open) return;

        reset({
            code: initialValue?.code || "",
            name: initialValue?.name || "",
            description: initialValue?.description || "",
            discountType: initialValue?.discountType || "percent",
            discountValue: Number(initialValue?.discountValue || 0),
            minOrderValue: Number(initialValue?.minOrderValue || 0),
            maxDiscount:
                initialValue?.maxDiscount === null ||
                initialValue?.maxDiscount === undefined
                    ? ""
                    : Number(initialValue.maxDiscount),
            startDate: toDateInputValue(initialValue?.startDate),
            endDate: toDateInputValue(initialValue?.endDate),
            usageLimit: Number(initialValue?.usageLimit || 0),
            usedCount: Number(initialValue?.usedCount || 0),
            isActive: initialValue?.isActive ?? true,
        });
    }, [initialValue, open, reset]);

    if (!open) return null;
    const discountType = watch("discountType");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B1B24]/35 p-4">
            <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#FFD4E1] bg-white p-6 shadow-[0_25px_60px_rgba(43,27,36,0.22)]">
                <h3 className="text-2xl font-semibold text-[#2B1B24]">
                    {mode === "create" ? "Th\u00eam voucher" : "C\u1eadp nh\u1eadt voucher"}
                </h3>
                <p className="mt-1 text-sm text-[#7A6A70]">
                    {"Quản lý chương trình khuyến mãi theo từng điều kiện."}
                </p>

                <form
                    className="mt-5 grid gap-4"
                    onSubmit={handleSubmit(async (values) => {
                        try {
                            setSubmitting(true);
                            const payload: AdminVoucherPayload = {
                                code: values.code.trim().toUpperCase(),
                                name: values.name.trim(),
                                description: values.description || "",
                                discountType: values.discountType,
                                discountValue: Number(values.discountValue),
                                minOrderValue: Number(values.minOrderValue),
                                maxDiscount:
                                    values.discountType === "fixed" ||
                                    values.maxDiscount === "" ||
                                    values.maxDiscount === null
                                        ? null
                                        : Number(values.maxDiscount),
                                startDate: values.startDate,
                                endDate: values.endDate,
                                usageLimit: Number(values.usageLimit),
                                usedCount: Number(values.usedCount),
                                isActive: values.isActive,
                            };
                            await onSubmit(payload);
                            onClose();
                        } finally {
                            setSubmitting(false);
                        }
                    })}>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Mã voucher" error={errors.code?.message}>
                            <input
                                {...register("code")}
                                className={inputClass}
                                placeholder="VD: WELCOME10"
                            />
                        </Field>
                        <Field label="Tên voucher" error={errors.name?.message}>
                            <input
                                {...register("name")}
                                className={inputClass}
                                placeholder="VD: Ưu đãi khách mới"
                            />
                        </Field>
                        <Field
                            label="Loại giảm giá"
                            error={errors.discountType?.message}>
                            <select
                                {...register("discountType")}
                                className={inputClass}>
                                <option value="percent">Phần trăm</option>
                                <option value="fixed">Số tiền cố định</option>
                            </select>
                        </Field>
                        <Field
                            label="Giá trị giảm"
                            error={errors.discountValue?.message}>
                            <input
                                {...register("discountValue")}
                                className={inputClass}
                                type="number"
                                min={0}
                            />
                        </Field>
                        <Field
                            label="Đơn tối thiểu"
                            error={errors.minOrderValue?.message}>
                            <input
                                {...register("minOrderValue")}
                                className={inputClass}
                                type="number"
                                min={0}
                            />
                        </Field>
                        <Field
                            label="Giảm tối đa"
                            error={errors.maxDiscount?.message as string}>
                            <input
                                {...register("maxDiscount")}
                                className={inputClass}
                                type="number"
                                min={0}
                                disabled={discountType === "fixed"}
                                placeholder={
                                    discountType === "fixed"
                                        ? "Không áp dụng cho giảm cố định"
                                        : "Nhập mức cần giảm"
                                }
                            />
                        </Field>
                        <Field
                            label="Giới hạn sử dụng"
                            error={errors.usageLimit?.message}>
                            <input
                                {...register("usageLimit")}
                                className={inputClass}
                                type="number"
                                min={0}
                            />
                        </Field>
                        <Field
                            label="Ngày bắt đầu"
                            error={errors.startDate?.message}>
                            <input
                                {...register("startDate")}
                                className={inputClass}
                                type="date"
                            />
                        </Field>
                        <Field
                            label="Ngày kết thúc"
                            error={errors.endDate?.message}>
                            <input
                                {...register("endDate")}
                                className={inputClass}
                                type="date"
                            />
                        </Field>
                        <Field
                            label="Đã sử dụng"
                            error={errors.usedCount?.message}>
                            <input
                                {...register("usedCount")}
                                className={inputClass}
                                type="number"
                                min={0}
                            />
                        </Field>
                    </div>

                    <Field
                        label="Mô tả"
                        error={errors.description?.message}>
                        <textarea
                            {...register("description")}
                            className={`${inputClass} min-h-24 resize-y`}
                            placeholder="Mô tả điều kiện và đối tượng áp dụng..."
                        />
                    </Field>

                    <label className="flex items-center gap-3 text-sm text-[#2B1B24]">
                        <input
                            type="checkbox"
                            {...register("isActive")}
                            className="h-4 w-4 rounded border-[#FFD4E1]"
                        />
                        Voucher đang hoạt động
                    </label>

                    <div className="mt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="rounded-xl border border-[#FFD4E1] px-4 py-2 text-sm font-semibold text-[#2B1B24] disabled:opacity-60">
                            {"H\u1ee7y"}
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-xl bg-[#F999B7] px-5 py-2 text-sm font-semibold text-white disabled:opacity-65">
                            {submitting ? "\u0110ang l\u01b0u..." : "L\u01b0u voucher"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Field({
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
            <span className="mb-1 block text-sm font-semibold text-[#2B1B24]">
                {label}
            </span>
            {children}
            {error ? (
                <span className="mt-1 block text-xs text-[#c25879]">{error}</span>
            ) : null}
        </label>
    );
}

const toDateInputValue = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
};

const inputClass =
    "h-11 w-full rounded-2xl border border-[#FFD4E1] bg-[#FFF7FA] px-4 text-sm text-[#2B1B24] outline-none placeholder:text-[#b59aa4] focus:border-[#F999B7]";
