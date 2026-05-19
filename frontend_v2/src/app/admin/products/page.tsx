"use client";

import { useCallback, useEffect, useState } from "react";
import AdminProductModal from "../../../components/admin/AdminProductModal";
import AdminConfirmModal from "../../../components/admin/AdminConfirmModal";
import AdminToast from "../../../components/admin/AdminToast";
import {
    createProduct,
    deleteProduct,
    fetchProducts,
    updateProduct,
} from "../../../services/productService";
import { getErrorMessage } from "../../../lib/errors";
import type { Pagination } from "../../../types/api";
import type { Product } from "../../../types/product";

type ToastType = "info" | "success" | "error";

interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
}

interface ModalState {
    open: boolean;
    mode: "create" | "edit";
    product: Product | null;
}

interface ConfirmState {
    open: boolean;
    product: Product | null;
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        pages: 1,
        total: 0,
        limit: 20,
    });
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [modalState, setModalState] = useState<ModalState>({
        open: false,
        mode: "create",
        product: null,
    });
    const [confirmState, setConfirmState] = useState<ConfirmState>({
        open: false,
        product: null,
    });
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const pushToast = (message: string, type: ToastType = "info") => {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 3200);
    };

    const loadProducts = useCallback(
        async (page = pagination.page) => {
            setIsLoading(true);
            try {
                const data = await fetchProducts({
                    page,
                    limit: 20,
                    search: search || undefined,
                    sort: "-createdAt",
                });
                setProducts(data.items || []);
                setPagination(
                    data.pagination || {
                        page: 1,
                        pages: 1,
                        total: 0,
                        limit: 20,
                    },
                );
            } catch (error) {
                pushToast(
                    getErrorMessage(error, "Khong tai duoc san pham."),
                    "error",
                );
            } finally {
                setIsLoading(false);
            }
        },
        [pagination.page, search],
    );

    useEffect(() => {
        loadProducts(1);
    }, [loadProducts]);

    const handleSave = async (formData: FormData) => {
        try {
            if (modalState.mode === "edit" && modalState.product) {
                const productId =
                    modalState.product._id || modalState.product.id;
                if (!productId) {
                    pushToast("Khong tim thay ma san pham.", "error");
                    return;
                }
                await updateProduct(productId, formData);
                pushToast("Cap nhat san pham thanh cong.", "success");
            } else {
                await createProduct(formData);
                pushToast("Tao san pham moi thanh cong.", "success");
            }
            setModalState({ open: false, mode: "create", product: null });
            loadProducts(pagination.page || 1);
        } catch (error) {
            pushToast(
                getErrorMessage(error, "Khong the luu san pham."),
                "error",
            );
        }
    };

    const handleDelete = async () => {
        if (!confirmState.product) return;
        try {
            const productId =
                confirmState.product._id || confirmState.product.id;
            if (!productId) {
                pushToast("Khong tim thay ma san pham.", "error");
                return;
            }
            await deleteProduct(productId);
            pushToast("Da xoa san pham.", "success");
            setConfirmState({ open: false, product: null });
            loadProducts(pagination.page || 1);
        } catch (error) {
            pushToast(
                getErrorMessage(error, "Khong the xoa san pham."),
                "error",
            );
        }
    };

    return (
        <div className="admin-section">
            <div className="admin-section-head">
                <div>
                    <h2>Quan ly san pham</h2>
                    <p>Cap nhat danh muc san pham va gia ban</p>
                </div>
                <button
                    type="button"
                    className="admin-btn"
                    onClick={() =>
                        setModalState({
                            open: true,
                            mode: "create",
                            product: null,
                        })
                    }>
                    + Tao moi
                </button>
            </div>

            <div className="admin-toolbar">
                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Tim theo ten san pham"
                />
                <button
                    type="button"
                    onClick={() => loadProducts(1)}
                    className="admin-btn ghost">
                    Tim kiem
                </button>
            </div>

            <div className="admin-table-card">
                {isLoading ? (
                    <div className="table-skeleton" />
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>San pham</th>
                                <th>Thuong hieu</th>
                                <th>Gia</th>
                                <th>Ton kho</th>
                                <th>Danh gia</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product._id}>
                                    <td>
                                        <div className="admin-product-cell">
                                            <span
                                                className="admin-product-thumb"
                                                style={
                                                    product.image ||
                                                    product.images?.[0]
                                                        ? {
                                                              backgroundImage: `url(${product.image || product.images?.[0] || ""})`,
                                                          }
                                                        : undefined
                                                }
                                            />
                                            <div>
                                                <strong>{product.name}</strong>
                                                <span>
                                                    {product.categories?.[0] ||
                                                        product.category ||
                                                        "--"}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{product.brand || "--"}</td>
                                    <td>
                                        {Number(
                                            product.price || 0,
                                        ).toLocaleString("vi-VN")}{" "}
                                        d
                                    </td>
                                    <td>{product.stock ?? 0}</td>
                                    <td>{product.rating ?? 0}</td>
                                    <td className="admin-actions">
                                        <button
                                            type="button"
                                            className="admin-btn ghost"
                                            onClick={() =>
                                                setModalState({
                                                    open: true,
                                                    mode: "edit",
                                                    product,
                                                })
                                            }>
                                            Sua
                                        </button>
                                        <button
                                            type="button"
                                            className="admin-btn danger"
                                            onClick={() =>
                                                setConfirmState({
                                                    open: true,
                                                    product,
                                                })
                                            }>
                                            Xoa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {pagination.pages > 1 ? (
                <div className="admin-pagination">
                    {Array.from({ length: pagination.pages }).map(
                        (_, index) => {
                            const page = index + 1;
                            return (
                                <button
                                    key={page}
                                    type="button"
                                    className={`page-number${pagination.page === page ? " is-active" : ""}`}
                                    onClick={() => loadProducts(page)}>
                                    {page}
                                </button>
                            );
                        },
                    )}
                </div>
            ) : null}

            <AdminProductModal
                open={modalState.open}
                mode={modalState.mode}
                product={modalState.product}
                onClose={() =>
                    setModalState({
                        open: false,
                        mode: "create",
                        product: null,
                    })
                }
                onSave={handleSave}
            />

            <AdminConfirmModal
                open={confirmState.open}
                title="Xoa san pham"
                description="Ban chac chan muon xoa san pham nay?"
                onCancel={() => setConfirmState({ open: false, product: null })}
                onConfirm={handleDelete}
            />

            {toasts.length > 0 ? (
                <div className="admin-toast-stack">
                    {toasts.map((toast) => (
                        <AdminToast
                            key={toast.id}
                            toast={toast}
                            onClose={() =>
                                setToasts((prev) =>
                                    prev.filter((item) => item.id !== toast.id),
                                )
                            }
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}
