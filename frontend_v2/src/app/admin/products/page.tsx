"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, EyeOff, PackageOpen, Plus, RotateCcw, Search, Star, Store, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import AdminFilterBar from "../../../components/admin/AdminFilterBar";
import AdminPagination from "../../../components/admin/AdminPagination";
import ConfirmDialog from "../../../components/admin/ConfirmDialog";
import ProductForm from "../../../components/admin/ProductForm";
import StatCard from "../../../components/admin/StatCard";
import StatusBadge from "../../../components/admin/StatusBadge";
import { adminProductService, type AdminProductQuery } from "../../../services/adminProductService";
import type { AdminProductPayload } from "../../../types/admin";
import type { Pagination } from "../../../types/api";
import type { Product } from "../../../types/product";

const emptyPagination: Pagination = { page: 1, limit: 10, total: 0, pages: 1 };
const emptyStats = { total: 0, active: 0, hidden: 0, lowStock: 0, outOfStock: 0, bestseller: 0 };
const emptyFilters = { categories: [] as string[], brands: [] as string[] };
const money = (value?: number | null) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;
const LOW_STOCK_THRESHOLD = 20;
const TOAST_OPTIONS = { duration: 1000 };

type StatusFilter = "all" | "active" | "hidden";

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [pagination, setPagination] = useState<Pagination>(emptyPagination);
    const [stats, setStats] = useState(emptyStats);
    const [filters, setFilters] = useState(emptyFilters);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [query, setQuery] = useState<AdminProductQuery>({ page: 1, limit: 10, sort: "-createdAt" });
    const [searchText, setSearchText] = useState("");
    const [status, setStatus] = useState<StatusFilter>("all");
    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [confirmTarget, setConfirmTarget] = useState<Product | null>(null);
    const [saving, setSaving] = useState(false);

    const loadProducts = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const response = await adminProductService.list(query);
            setProducts(response.items || []);
            setPagination(response.pagination || emptyPagination);
            setStats(response.stats || emptyStats);
            setFilters(response.filters || emptyFilters);
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Không tải được sản phẩm.");
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [query]);

    useEffect(() => {
        void loadProducts();
    }, [loadProducts]);

    const applyFilters = () => {
        setQuery((prev) => ({
            ...prev,
            page: 1,
            search: searchText.trim() || undefined,
            isActive: status === "all" ? undefined : status === "active",
        }));
    };

    const resetFilters = () => {
        setSearchText("");
        setStatus("all");
        setQuery({ page: 1, limit: pagination.limit || 10, sort: "-createdAt" });
    };

    const submitProduct = async (payload: AdminProductPayload) => {
        try {
            if (formMode === "create") {
                await adminProductService.create(payload);
                toast.success("Đã thêm sản phẩm.", TOAST_OPTIONS);
            } else if (selectedProduct?._id || selectedProduct?.id) {
                await adminProductService.update(String(selectedProduct._id || selectedProduct.id), payload);
                toast.success("Đã cập nhật sản phẩm.", TOAST_OPTIONS);
            }
            setFormOpen(false);
            await loadProducts();
        } catch (requestError) {
            toast.error(
                requestError instanceof Error ? requestError.message : "Không lưu được sản phẩm.",
                TOAST_OPTIONS,
            );
            throw requestError;
        }
    };

    const toggleProductVisibility = async () => {
        if (!confirmTarget?._id && !confirmTarget?.id) return;
        try {
            setSaving(true);
            const id = String(confirmTarget._id || confirmTarget.id);
            if (confirmTarget.isActive === false) await adminProductService.restore(id);
            else await adminProductService.disable(id);
            toast.success(
                confirmTarget.isActive === false ? "Đã hiện lại sản phẩm." : "Đã ẩn sản phẩm.",
                TOAST_OPTIONS,
            );
            setConfirmTarget(null);
            await loadProducts();
        } catch (requestError) {
            toast.error(
                requestError instanceof Error ? requestError.message : "Không cập nhật được trạng thái sản phẩm.",
                TOAST_OPTIONS,
            );
        } finally {
            setSaving(false);
        }
    };

    const categoryOptions = useMemo(() => filters.categories || [], [filters.categories]);
    const brandOptions = useMemo(() => filters.brands || [], [filters.brands]);

    return (
        <div className="min-w-0 space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#2B1B24]">Sản phẩm</h1>
                    <p className="mt-2 text-sm text-[#7A6A70]">Quản lý và theo dõi tất cả sản phẩm trong cửa hàng</p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setSelectedProduct(null);
                        setFormMode("create");
                        setFormOpen(true);
                    }}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#F999B7] px-6 font-semibold text-white shadow-[0_12px_24px_rgba(249,153,183,0.24)]">
                    <Plus size={18} />
                    Thêm sản phẩm
                </button>
            </div>

            {error ? <p className="rounded-2xl border border-[#FFD4E1] bg-white p-4 text-sm text-[#E11D48]">{error}</p> : null}

            <section className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                <StatCard label="Tổng sản phẩm" value={String(stats.total)} icon={PackageOpen} />
                <StatCard label="Đang kinh doanh" value={String(stats.active)} icon={Store} />
                <StatCard label="Đã ẩn" value={String(stats.hidden)} icon={EyeOff} />
                <StatCard label="Sắp hết hàng" value={String(stats.lowStock)} icon={TriangleAlert} />
                <StatCard label="Bestseller" value={String(stats.bestseller)} icon={Star} />
            </section>

            <AdminFilterBar>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A6A70]" size={17} />
                    <input
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") applyFilters();
                        }}
                        className="admin-input has-left-icon"
                        placeholder="Tìm theo tên sản phẩm hoặc SKU..."
                    />
                </div>
                <select
                    value={query.category || ""}
                    onChange={(event) => setQuery((prev) => ({ ...prev, page: 1, category: event.target.value || undefined }))}
                    className="admin-input">
                    <option value="">Tất cả danh mục</option>
                    {categoryOptions.map((category) => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>
                <select
                    value={query.brand || ""}
                    onChange={(event) => setQuery((prev) => ({ ...prev, page: 1, brand: event.target.value || undefined }))}
                    className="admin-input">
                    <option value="">Tất cả thương hiệu</option>
                    {brandOptions.map((brand) => (
                        <option key={brand} value={brand}>
                            {brand}
                        </option>
                    ))}
                </select>
                <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} className="admin-input">
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang kinh doanh</option>
                    <option value="hidden">Đã ẩn</option>
                </select>
                <button type="button" onClick={applyFilters} className="h-12 rounded-xl bg-[#F999B7] px-3 font-semibold text-white">
                    Lọc
                </button>
                <button type="button" onClick={resetFilters} className="h-12 rounded-xl border border-[#F999B7] bg-white px-3 font-semibold text-[#F999B7]">
                    Bỏ lọc
                </button>
            </AdminFilterBar>

            <section className="overflow-hidden rounded-[20px] border border-[#FFE3EC] bg-white shadow-[0_16px_38px_rgba(43,27,36,0.04)]">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1280px] table-fixed text-left text-sm">
                        <colgroup>
                            <col style={{ width: "320px" }} />
                            <col style={{ width: "140px" }} />
                            <col style={{ width: "140px" }} />
                            <col style={{ width: "120px" }} />
                            <col style={{ width: "100px" }} />
                            <col style={{ width: "100px" }} />
                            <col style={{ width: "160px" }} />
                            <col style={{ width: "200px" }} />
                        </colgroup>
                        <thead className="bg-[#FFF7FA] text-xs uppercase text-[#7A6A70]">
                            <tr>
                                <th className="px-3 py-4">Sản phẩm</th>
                                <th className="px-3 py-4">Danh mục</th>
                                <th className="px-3 py-4">Thương hiệu</th>
                                <th className="px-3 py-4">Giá bán</th>
                                <th className="px-3 py-4">Tồn kho</th>
                                <th className="px-3 py-4">Đã bán</th>
                                <th className="px-3 py-4">Trạng thái</th>
                                <th className="px-3 py-4 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F5E5EC]">
                            {loading ? (
                                <tr><td colSpan={8} className="py-12 text-center text-[#7A6A70]">Đang tải sản phẩm...</td></tr>
                            ) : products.length ? (
                                products.map((product) => {
                                    const id = String(product._id || product.id || "");
                                    const image = product.image || product.image_url || product.imageUrl || (Array.isArray(product.images) ? product.images[0] : "");
                                    const stock = Number(product.stock || 0);
                                    return (
                                        <tr key={id || product.slug || product.name} className="hover:bg-[#FFF9FB]">
                                            <td className="px-3 py-4">
                                                <div className="flex items-center gap-3">
                                                    {image ? (
                                                        <Image src={image} alt={product.name} width={48} height={48} className="h-12 w-12 rounded-xl object-cover" />
                                                    ) : (
                                                        <div className="h-12 w-12 rounded-xl bg-[#FFF0F5]" />
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="max-w-[320px] truncate font-semibold text-[#2B1B24]" title={product.name}>{product.name}</p>
                                                        <p className="text-xs text-[#7A6A70]">SKU: {product.sku || id.slice(-8).toUpperCase() || "--"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="truncate px-3 py-4" title={product.category_level_2 || product.category_level_1 || "--"}>{product.category_level_2 || product.category_level_1 || "--"}</td>
                                            <td className="truncate px-3 py-4" title={product.brand || "--"}>{product.brand || "--"}</td>
                                            <td className="truncate px-3 py-4 font-bold text-[#F999B7]" title={money(product.sale_price || product.price)}>{money(product.sale_price || product.price)}</td>
                                            <td className="px-3 py-4 whitespace-nowrap">{stock}</td>
                                            <td className="px-3 py-4 whitespace-nowrap">{Number(product.soldCount || 0)}</td>
                                            <td className="px-3 py-4 whitespace-nowrap">{renderProductStatus(product)}</td>
                                            <td className="px-3 py-4">
                                                <div className="flex gap-2">
                                                    <button type="button" onClick={() => { setSelectedProduct(product); setFormMode("edit"); setFormOpen(true); }} className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-xl border border-[#EADDE2] px-3 font-semibold text-[#2B1B24]">
                                                        <Edit3 size={14} /> Sửa
                                                    </button>
                                                    <button type="button" onClick={() => setConfirmTarget(product)} className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-xl bg-[#FFF0F5] px-3 font-semibold text-[#F999B7]">
                                                        {product.isActive === false ? <RotateCcw size={15} /> : <EyeOff size={15} />}
                                                        {product.isActive === false ? "Hiện lại" : "Ẩn"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan={8} className="py-12 text-center text-[#7A6A70]">Chưa có sản phẩm phù hợp.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <AdminPagination
                    pagination={pagination}
                    onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))}
                    onLimitChange={(limit) => setQuery((prev) => ({ ...prev, page: 1, limit }))}
                />
            </section>

            <ProductForm open={formOpen} mode={formMode} initialValue={selectedProduct} onClose={() => setFormOpen(false)} onSubmit={submitProduct} />
            <ConfirmDialog
                open={Boolean(confirmTarget)}
                title={confirmTarget?.isActive === false ? "Hiện lại sản phẩm" : "Ẩn sản phẩm"}
                description={`Sản phẩm "${confirmTarget?.name || ""}" sẽ được cập nhật trạng thái.`}
                confirmLabel={confirmTarget?.isActive === false ? "Hiện lại" : "Ẩn"}
                danger={confirmTarget?.isActive !== false}
                isLoading={saving}
                onClose={() => setConfirmTarget(null)}
                onConfirm={() => void toggleProductVisibility()}
            />
        </div>
    );
}

function renderProductStatus(product: Product) {
    const stock = Number(product.stock || 0);
    if (product.isActive === false) return <StatusBadge tone="gray">Đã ẩn</StatusBadge>;
    if (stock <= 0) return <StatusBadge tone="red">Hết hàng</StatusBadge>;
    if (stock <= LOW_STOCK_THRESHOLD) return <StatusBadge tone="orange">Sắp hết hàng</StatusBadge>;
    return <StatusBadge tone="green">Đang kinh doanh</StatusBadge>;
}
