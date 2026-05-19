"use client";

interface AdminConfirmModalProps {
    open: boolean;
    title: string;
    description: string;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function AdminConfirmModal({
    open,
    title,
    description,
    onCancel,
    onConfirm,
}: AdminConfirmModalProps) {
    if (!open) return null;
    return (
        <div className="admin-modal-backdrop">
            <div className="admin-modal">
                <div className="admin-modal-head">
                    <h3>{title}</h3>
                    <button type="button" onClick={onCancel} aria-label="Dong">
                        ✕
                    </button>
                </div>
                <p>{description}</p>
                <div className="admin-modal-actions">
                    <button
                        type="button"
                        className="admin-btn ghost"
                        onClick={onCancel}>
                        Huy
                    </button>
                    <button
                        type="button"
                        className="admin-btn danger"
                        onClick={onConfirm}>
                        Xac nhan
                    </button>
                </div>
            </div>
        </div>
    );
}
