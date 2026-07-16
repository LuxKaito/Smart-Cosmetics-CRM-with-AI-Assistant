"use client";

import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
    createShippingAddress,
    deleteShippingAddress,
    fetchMe,
    updateShippingAddress,
    type ShippingAddressPayload,
} from "../../services/authService";
import type { ShippingAddress } from "../../types/auth";
import { getErrorMessage } from "../../lib/errors";
import AccountLayout from "./AccountLayout";

const emptyAddress: ShippingAddressPayload = {
    label: "Nhà riêng",
    fullName: "",
    phone: "",
    province: "",
    district: "",
    ward: "",
    addressLine: "",
    isDefault: false,
};

export default function AddressBookPage() {
    const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
    const [form, setForm] = useState<ShippingAddressPayload>(emptyAddress);
    const [editingId, setEditingId] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
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
                if (mounted) setAddresses(user.shippingAddresses || []);
            })
            .catch((error) => {
                if (!mounted) return;
                setStatus({
                    type: "error",
                    message: getErrorMessage(
                        error,
                        "Không tải được sổ địa chỉ giao hàng.",
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

    const resetForm = () => {
        setForm(emptyAddress);
        setEditingId("");
        setIsFormOpen(false);
    };

    const startCreate = () => {
        setForm({ ...emptyAddress, isDefault: addresses.length === 0 });
        setEditingId("");
        setIsFormOpen(true);
        setStatus({ type: "", message: "" });
    };

    const startEdit = (address: ShippingAddress) => {
        setForm({
            label: address.label,
            fullName: address.fullName,
            phone: address.phone,
            province: address.province,
            district: address.district,
            ward: address.ward,
            addressLine: address.addressLine,
            isDefault: Boolean(address.isDefault),
        });
        setEditingId(address._id);
        setIsFormOpen(true);
        setStatus({ type: "", message: "" });
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSaving(true);
        setStatus({ type: "", message: "" });
        try {
            const nextAddresses = editingId
                ? await updateShippingAddress(editingId, form)
                : await createShippingAddress(form);
            setAddresses(nextAddresses);
            resetForm();
            setStatus({
                type: "success",
                message: editingId
                    ? "Đã cập nhật địa chỉ giao hàng."
                    : "Đã thêm địa chỉ giao hàng.",
            });
        } catch (error) {
            setStatus({
                type: "error",
                message: getErrorMessage(
                    error,
                    "Không thể lưu địa chỉ giao hàng.",
                ),
            });
        } finally {
            setIsSaving(false);
        }
    };

    const setDefaultAddress = async (addressId: string) => {
        try {
            setAddresses(
                await updateShippingAddress(addressId, { isDefault: true }),
            );
            setStatus({
                type: "success",
                message: "Đã chọn địa chỉ giao hàng mặc định.",
            });
        } catch (error) {
            setStatus({
                type: "error",
                message: getErrorMessage(error, "Không thể đổi địa chỉ mặc định."),
            });
        }
    };

    const removeAddress = async (addressId: string) => {
        if (!window.confirm("Xóa địa chỉ giao hàng này?")) return;
        try {
            setAddresses(await deleteShippingAddress(addressId));
            setStatus({
                type: "success",
                message: "Đã xóa địa chỉ giao hàng.",
            });
        } catch (error) {
            setStatus({
                type: "error",
                message: getErrorMessage(error, "Không thể xóa địa chỉ."),
            });
        }
    };

    return (
        <AccountLayout
            title="Địa chỉ giao hàng"
            subtitle="Lưu địa chỉ thường dùng để điền thông tin mua sắm nhanh hơn.">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[#7A6A70]">
                    {addresses.length} địa chỉ đã lưu
                </p>
                <button
                    type="button"
                    onClick={startCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#F999B7] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#ee86a7]">
                    <Plus className="h-4 w-4" />
                    Thêm địa chỉ
                </button>
            </div>

            {status.message ? (
                <div
                    className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                        status.type === "error"
                            ? "border-rose-200 bg-rose-50 text-rose-700"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}>
                    {status.message}
                </div>
            ) : null}

            {isFormOpen ? (
                <form
                    onSubmit={handleSubmit}
                    className="mt-5 rounded-2xl border border-[#F4DEE6] bg-[#FFFBFC] p-5">
                    <h2 className="text-lg font-bold">
                        {editingId ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}
                    </h2>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <AddressField label="Tên địa chỉ">
                            <AddressInput
                                value={form.label}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        label: value,
                                    }))
                                }
                                placeholder="Ví dụ: Nhà riêng, Văn phòng"
                            />
                        </AddressField>
                        <AddressField label="Họ và tên người nhận">
                            <AddressInput
                                value={form.fullName}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        fullName: value,
                                    }))
                                }
                                required
                            />
                        </AddressField>
                        <AddressField label="Số điện thoại">
                            <AddressInput
                                value={form.phone}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        phone: value,
                                    }))
                                }
                                required
                                inputMode="tel"
                                placeholder="Ví dụ: 0901234567"
                            />
                        </AddressField>
                        <AddressField label="Tỉnh / Thành phố">
                            <AddressInput
                                value={form.province}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        province: value,
                                    }))
                                }
                                required
                            />
                        </AddressField>
                        <AddressField label="Quận / Huyện">
                            <AddressInput
                                value={form.district}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        district: value,
                                    }))
                                }
                                required
                            />
                        </AddressField>
                        <AddressField label="Phường / Xã">
                            <AddressInput
                                value={form.ward}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        ward: value,
                                    }))
                                }
                                required
                            />
                        </AddressField>
                        <div className="md:col-span-2">
                            <AddressField label="Địa chỉ chi tiết">
                                <AddressInput
                                    value={form.addressLine}
                                    onChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            addressLine: value,
                                        }))
                                    }
                                    required
                                    placeholder="Số nhà, tên đường, tòa nhà..."
                                />
                            </AddressField>
                        </div>
                    </div>
                    <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#5A4850]">
                        <input
                            type="checkbox"
                            checked={Boolean(form.isDefault)}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    isDefault: event.target.checked,
                                }))
                            }
                        />
                        Đặt làm địa chỉ mặc định
                    </label>
                    <div className="mt-5 flex flex-wrap gap-2">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="rounded-xl bg-[#F999B7] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
                            {isSaving ? "Đang lưu..." : "Lưu địa chỉ"}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="rounded-xl border border-[#E8D7DE] px-5 py-3 text-sm font-bold text-[#7A6A70]">
                            Hủy
                        </button>
                    </div>
                </form>
            ) : null}

            {isLoading ? (
                <div className="mt-5 animate-pulse space-y-3">
                    <div className="h-36 rounded-2xl bg-[#FFF0F5]" />
                    <div className="h-36 rounded-2xl bg-[#FFF0F5]" />
                </div>
            ) : addresses.length ? (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {addresses.map((address) => (
                        <article
                            key={address._id}
                            className="rounded-2xl border border-[#F4DEE6] bg-white p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex gap-3">
                                    <span className="rounded-xl bg-[#FFF0F5] p-2 text-[#B14063]">
                                        <MapPin className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="font-bold">{address.label}</h2>
                                            {address.isDefault ? (
                                                <span className="rounded-full bg-[#FFF0F5] px-2 py-1 text-[11px] font-bold text-[#B14063]">
                                                    Mặc định
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="mt-3 font-semibold">
                                            {address.fullName}
                                        </p>
                                        <p className="mt-1 text-sm text-[#7A6A70]">
                                            {address.phone}
                                        </p>
                                        <p className="mt-2 text-sm leading-6 text-[#5A4850]">
                                            {address.addressLine}, {address.ward},{" "}
                                            {address.district}, {address.province}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2 border-t border-[#F7E3EA] pt-4">
                                <button
                                    type="button"
                                    onClick={() => startEdit(address)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-[#F4DEE6] px-3 py-2 text-xs font-bold text-[#B14063]">
                                    <Pencil className="h-3.5 w-3.5" />
                                    Sửa
                                </button>
                                {!address.isDefault ? (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            void setDefaultAddress(address._id)
                                        }
                                        className="rounded-lg border border-[#F4DEE6] px-3 py-2 text-xs font-bold text-[#5A4850]">
                                        Đặt mặc định
                                    </button>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={() => void removeAddress(address._id)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-rose-100 px-3 py-2 text-xs font-bold text-rose-600">
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Xóa
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-[#F4DEE6] bg-[#FFFBFC] px-5 py-10 text-center">
                    <MapPin className="mx-auto h-8 w-8 text-[#F999B7]" />
                    <p className="mt-3 font-bold">Bạn chưa lưu địa chỉ giao hàng.</p>
                    <p className="mt-1 text-sm text-[#7A6A70]">
                        Thêm địa chỉ để thao tác mua sắm thuận tiện hơn.
                    </p>
                </div>
            )}
        </AccountLayout>
    );
}

function AddressField({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#4A3540]">
                {label}
            </span>
            {children}
        </label>
    );
}

function AddressInput({
    value,
    onChange,
    required,
    placeholder,
    inputMode,
}: {
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    placeholder?: string;
    inputMode?: "tel";
}) {
    return (
        <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            required={required}
            inputMode={inputMode}
            placeholder={placeholder}
            className="account-input"
        />
    );
}
