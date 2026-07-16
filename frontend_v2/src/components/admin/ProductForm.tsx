"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Product } from "../../types/product";
import type { AdminProductPayload } from "../../types/admin";

const productSchema = z.object({
    name: z.string().trim().min(2, "Nhập tên sản phẩm."),
    slug: z.string().trim().optional(),
    sku: z.string().trim().optional(),
    brand: z.string().trim().optional(),
    category_level_1: z.string().trim().optional(),
    category_level_2: z.string().trim().optional(),
    benefits: z.string().trim().optional(),
    product_type: z.string().trim().optional(),
    sale_price: z.coerce.number().min(0, "Giá bán không hợp lệ."),
    original_price: z
        .union([z.coerce.number().min(0), z.literal(""), z.null()])
        .optional(),
    stock: z.coerce.number().int().min(0, "Tồn kho không hợp lệ."),
    image_url: z.string().trim().optional(),
    description: z.string().trim().optional(),
    shortDescription: z.string().trim().optional(),
    detailDescription: z.string().trim().optional(),
    ingredients: z.string().trim().optional(),
    usage_instructions: z.string().trim().optional(),
    isActive: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
    open: boolean;
    mode: "create" | "edit";
    initialValue?: Product | null;
    onClose: () => void;
    onSubmit: (payload: AdminProductPayload) => Promise<void> | void;
}

export default function ProductForm({
    open,
    mode,
    initialValue,
    onClose,
    onSubmit,
}: ProductFormProps) {
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
    } = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: "",
            slug: "",
            sku: "",
            brand: "",
            category_level_1: "",
            category_level_2: "",
            benefits: "",
            product_type: "",
            sale_price: 0,
            original_price: "",
            stock: 0,
            image_url: "",
            description: "",
            shortDescription: "",
            detailDescription: "",
            ingredients: "",
            usage_instructions: "",
            isActive: true,
        },
    });

    useEffect(() => {
        if (!open) return;
        setSubmitError("");
        reset({
            name: initialValue?.name || "",
            slug: initialValue?.slug || "",
            sku: initialValue?.sku || "",
            brand: initialValue?.brand || "",
            category_level_1: initialValue?.category_level_1 || "",
            category_level_2: initialValue?.category_level_2 || "",
            benefits: initialValue?.benefits || "",
            product_type: initialValue?.product_type || "",
            sale_price: Number(initialValue?.sale_price || initialValue?.price || 0),
            original_price:
                initialValue?.original_price === null ||
                initialValue?.original_price === undefined
                    ? ""
                    : Number(initialValue.original_price),
            stock: Number(initialValue?.stock || 0),
            image_url: initialValue?.image_url || initialValue?.imageUrl || "",
            description: initialValue?.description || "",
            shortDescription: initialValue?.shortDescription || "",
            detailDescription: initialValue?.detailDescription || "",
            ingredients: initialValue?.ingredients || "",
            usage_instructions: initialValue?.usage_instructions || initialValue?.usageInstructions || "",
            isActive: initialValue?.isActive ?? true,
        });
    }, [initialValue, open, reset]);

    if (!open) return null;

    const currentImage = watch("image_url");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B1B24]/35 p-4">
            <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#FFD4E1] bg-white p-6 shadow-[0_25px_60px_rgba(43,27,36,0.22)]">
                <h3 className="text-2xl font-semibold text-[#2B1B24]">
                    {mode === "create" ? "Th\u00eam s\u1ea3n ph\u1ea9m" : "Ch\u1ec9nh s\u1eeda s\u1ea3n ph\u1ea9m"}
                </h3>
                <p className="mt-1 text-sm text-[#7A6A70]">
                    Điền đầy đủ thông tin để cập nhật sản phẩm.
                </p>

                <form
                    className="mt-5 grid gap-4"
                    onSubmit={handleSubmit(async (values) => {
                        try {
                            setSubmitting(true);
                            setSubmitError("");
                            const normalizedOriginalPrice =
                                values.original_price === "" ||
                                values.original_price === null ||
                                values.original_price === undefined
                                    ? null
                                    : Number(values.original_price);

                            const payload: AdminProductPayload = {
                                name: values.name,
                                slug: values.slug || undefined,
                                sku: values.sku || undefined,
                                brand: values.brand || "",
                                category_level_1: values.category_level_1 || "",
                                category_level_2: values.category_level_2 || "",
                                benefits: values.benefits || "",
                                product_type: values.product_type || "",
                                sale_price: Number(values.sale_price),
                                original_price: normalizedOriginalPrice,
                                stock: Number(values.stock || 0),
                                image_url: values.image_url || "",
                                description: values.description || "",
                                shortDescription: values.shortDescription || "",
                                detailDescription: values.detailDescription || "",
                                ingredients: values.ingredients || "",
                                usage_instructions: values.usage_instructions || "",
                                isActive: values.isActive,
                            };
                            await onSubmit(payload);
                            onClose();
                        } catch (requestError) {
                            setSubmitError(
                                requestError instanceof Error
                                    ? requestError.message
                                    : "Không lưu được sản phẩm.",
                            );
                        } finally {
                            setSubmitting(false);
                        }
                    })}>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            label="Tên sản phẩm"
                            error={errors.name?.message}>
                            <input
                                {...register("name")}
                                className={inputClass}
                                placeholder="VD: Serum Vitamin C"
                            />
                        </Field>
                        <Field label="Slug" error={errors.slug?.message}>
                            <input
                                {...register("slug")}
                                className={inputClass}
                                placeholder="tu-dong-neu-bo-trong"
                            />
                        </Field>
                        <Field label="SKU" error={errors.sku?.message}>
                            <input
                                {...register("sku")}
                                className={inputClass}
                                placeholder="LUX-SERUM-001"
                            />
                        </Field>
                        <Field label="Thương hiệu" error={errors.brand?.message}>
                            <input
                                {...register("brand")}
                                className={inputClass}
                                placeholder="VD: La Roche-Posay"
                            />
                        </Field>
                        <Field label="Danh mục cấp 1" error={errors.category_level_1?.message}>
                            <input
                                {...register("category_level_1")}
                                className={inputClass}
                                placeholder="VD: Suc Khoe - Lam Dep"
                            />
                        </Field>
                        <Field
                            label="Danh mục cấp 2"
                            error={errors.category_level_2?.message}>
                            <input
                                {...register("category_level_2")}
                                className={inputClass}
                                placeholder="VD: Chăm Sóc Da Mặt"
                            />
                        </Field>
                        <Field label="Công dụng" error={errors.benefits?.message}>
                            <input
                                {...register("benefits")}
                                className={inputClass}
                                placeholder="VD: Làm sạch da"
                            />
                        </Field>
                        <Field label="Loại sản phẩm" error={errors.product_type?.message}>
                            <input
                                {...register("product_type")}
                                className={inputClass}
                                placeholder="VD: Sữa rửa mặt"
                            />
                        </Field>
                        <Field label="Giá bán" error={errors.sale_price?.message}>
                            <input
                                {...register("sale_price")}
                                className={inputClass}
                                type="number"
                                min={0}
                            />
                        </Field>
                        <Field
                            label="Giá gốc"
                            error={errors.original_price?.message as string}>
                            <input
                                {...register("original_price")}
                                className={inputClass}
                                type="number"
                                min={0}
                                placeholder="Bỏ trống nếu không có"
                            />
                        </Field>
                        <Field label="Tồn kho" error={errors.stock?.message}>
                            <input
                                {...register("stock")}
                                className={inputClass}
                                type="number"
                                min={0}
                            />
                        </Field>
                        <Field label="URL ảnh" error={errors.image_url?.message}>
                            <input
                                {...register("image_url")}
                                className={inputClass}
                                placeholder="https://..."
                            />
                        </Field>
                    </div>

                    {currentImage ? (
                        <Image
                            src={currentImage}
                            alt="Xem trước sản phẩm"
                            width={860}
                            height={240}
                            className="h-36 w-full rounded-2xl object-cover"
                        />
                    ) : null}

                    <Field
                        label="Mô tả ngắn"
                        error={errors.shortDescription?.message}>
                        <textarea
                            {...register("shortDescription")}
                            className={`${inputClass} min-h-20 resize-y`}
                            placeholder="Tóm tắt công dụng hiện trên danh sách..."
                        />
                    </Field>

                    <Field
                        label="Mô tả chi tiết"
                        error={errors.description?.message}>
                        <textarea
                            {...register("description")}
                            className={`${inputClass} min-h-28 resize-y`}
                            placeholder="Mô tả sản phẩm..."
                        />
                    </Field>
                    <Field
                        label="Thông tin bổ sung"
                        error={errors.detailDescription?.message}>
                        <textarea
                            {...register("detailDescription")}
                            className={`${inputClass} min-h-24 resize-y`}
                            placeholder="Thông tin chi tiết bổ sung nếu có..."
                        />
                    </Field>
                    <Field
                        label="Thành phần"
                        error={errors.ingredients?.message}>
                        <textarea
                            {...register("ingredients")}
                            className={`${inputClass} min-h-24 resize-y`}
                            placeholder="Thành phần nổi bật..."
                        />
                    </Field>
                    <Field
                        label="Hướng dẫn sử dụng"
                        error={errors.usage_instructions?.message}>
                        <textarea
                            {...register("usage_instructions")}
                            className={`${inputClass} min-h-24 resize-y`}
                            placeholder="Hướng dẫn sử dụng..."
                        />
                    </Field>

                    <label className="flex items-center gap-3 text-sm text-[#2B1B24]">
                        <input
                            type="checkbox"
                            {...register("isActive")}
                            className="h-4 w-4 rounded border-[#FFD4E1]"
                        />
                        {"S\u1ea3n ph\u1ea9m \u0111ang ho\u1ea1t \u0111\u1ed9ng"}
                    </label>

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
                            className="rounded-xl border border-[#FFD4E1] px-4 py-2 text-sm font-semibold text-[#2B1B24] disabled:opacity-60">
                            {"H\u1ee7y"}
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-xl bg-[#F999B7] px-5 py-2 text-sm font-semibold text-white disabled:opacity-65">
                            {submitting ? "\u0110ang l\u01b0u..." : "L\u01b0u s\u1ea3n ph\u1ea9m"}
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

const inputClass =
    "h-11 w-full rounded-2xl border border-[#FFD4E1] bg-[#FFF7FA] px-4 text-sm text-[#2B1B24] outline-none placeholder:text-[#b59aa4] focus:border-[#F999B7]";
