"use client";

interface ToastModel {
    id: string;
    message: string;
    type?: string;
}

interface AdminToastProps {
    toast: ToastModel;
    onClose: () => void;
}

export default function AdminToast({ toast, onClose }: AdminToastProps) {
    return (
        <div className={`admin-toast ${toast.type || "info"}`}>
            <span>{toast.message}</span>
            <button
                type="button"
                onClick={onClose}
                aria-label="Dong">
                ✕
            </button>
        </div>
    );
}
