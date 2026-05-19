"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { Product } from "../../types/product";

const emptyForm = {
    name: "",
    price: "",
    brand: "",
    category: "",
    stock: "",
    rating: "",
    description: "",
};

interface AdminProductModalProps {
    open: boolean;
    mode: "create" | "edit";
    product: Product | null;
    onClose: () => void;
    onSave: (payload: FormData) => Promise<void>;
}

export default function AdminProductModal({
    open,
    mode,
    product,
    onClose,
    onSave,
}: AdminProductModalProps) {
    const [form, setForm] = useState(emptyForm);
    const [images, setImages] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!open) return;
        if (product) {
            setForm({
                name: product.name || "",
                price: String(product.price ?? ""),
                brand: product.brand || "",
                category: product.categories?.[0] || product.category || "",
                stock: String(product.stock ?? ""),
                rating: String(product.rating ?? ""),
                description: product.description || "",
            });
        } else {
            setForm(emptyForm);
        }
        setImages([]);
        setIsSubmitting(false);
    }, [open, product]);

    if (!open) return null;

    const handleChange =
        (field: keyof typeof emptyForm) =>
        (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setForm((prev) => ({ ...prev, [field]: event.target.value }));
        };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        const payload = new FormData();
        payload.append("name", form.name.trim());
        payload.append("price", String(form.price).trim());
        payload.append("brand", form.brand.trim());
        payload.append("category", form.category.trim());
        payload.append("stock", String(form.stock || 0));
        payload.append("rating", String(form.rating || 0));
        payload.append("description", form.description.trim());
        images.forEach((file) => payload.append("images", file));

        await onSave(payload);
        setIsSubmitting(false);
    };

    return (
        <div className="admin-modal-backdrop">
            <div className="admin-modal large">
                <div className="admin-modal-head">
                    <h3>
                        {mode === "edit"
                            ? "Cap nhat san pham"
                            : "Tao san pham moi"}
                    </h3>
                    <button type="button" onClick={onClose} aria-label="Dong">
                        ✕
                    </button>
                </div>
                <form className="admin-form" onSubmit={handleSubmit}>
                    <div className="admin-form-grid">
                        <label>
                            Ten san pham
                            <input
                                value={form.name}
                                onChange={handleChange("name")}
                                required
                            />
                        </label>
                        <label>
                            Gia
                            <input
                                type="number"
                                value={form.price}
                                onChange={handleChange("price")}
                                required
                            />
                        </label>
                        <label>
                            Thuong hieu
                            <input
                                value={form.brand}
                                onChange={handleChange("brand")}
                            />
                        </label>
                        <label>
                            Danh muc
                            <input
                                value={form.category}
                                onChange={handleChange("category")}
                            />
                        </label>
                        <label>
                            Ton kho
                            <input
                                type="number"
                                value={form.stock}
                                onChange={handleChange("stock")}
                            />
                        </label>
                        <label>
                            Danh gia
                            <input
                                type="number"
                                step="0.1"
                                value={form.rating}
                                onChange={handleChange("rating")}
                            />
                        </label>
                        <label className="span-2">
                            Mo ta
                            <textarea
                                rows={4}
                                value={form.description}
                                onChange={handleChange("description")}
                            />
                        </label>
                        <label className="span-2">
                            Hinh anh (co the chon nhieu)
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(event) =>
                                    setImages(
                                        Array.from(event.target.files || []),
                                    )
                                }
                            />
                        </label>
                    </div>
                    <div className="admin-modal-actions">
                        <button
                            type="button"
                            className="admin-btn ghost"
                            onClick={onClose}>
                            Huy
                        </button>
                        <button
                            type="submit"
                            className="admin-btn"
                            disabled={isSubmitting}>
                            {isSubmitting ? "Dang luu..." : "Luu"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
