"use client";

import type { ReactNode } from "react";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    isLoading?: boolean;
    extraContent?: ReactNode;
    onConfirm: () => void;
    onClose: () => void;
}

export default function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = "Xác nhận",
    cancelLabel = "H\u1ee7y",
    danger = false,
    isLoading = false,
    extraContent,
    onConfirm,
    onClose,
}: ConfirmDialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B1B24]/35 p-4">
            <div className="w-full max-w-md rounded-3xl border border-[#FFD4E1] bg-white p-6 shadow-[0_24px_52px_rgba(43,27,36,0.22)]">
                <h3 className="text-xl font-semibold text-[#2B1B24]">{title}</h3>
                {description ? (
                    <p className="mt-2 text-sm leading-6 text-[#7A6A70]">
                        {description}
                    </p>
                ) : null}
                {extraContent ? <div className="mt-4">{extraContent}</div> : null}

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="rounded-xl border border-[#FFD4E1] px-4 py-2 text-sm font-semibold text-[#2B1B24] disabled:cursor-not-allowed disabled:opacity-60">
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-65 ${
                            danger
                                ? "bg-[#f27098] hover:bg-[#e85b89]"
                                : "bg-[#F999B7] hover:bg-[#f784a8]"
                        }`}>
                        {isLoading ? "\u0110ang x\u1eed l\u00fd..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
