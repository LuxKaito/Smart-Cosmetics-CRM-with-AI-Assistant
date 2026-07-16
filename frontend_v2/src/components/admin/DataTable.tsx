"use client";

import type { ReactNode } from "react";
import type { Pagination } from "../../types/api";

export interface DataTableColumn<T> {
    key: string;
    header: string;
    className?: string;
    render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
    title: string;
    description?: string;
    rows: T[];
    columns: DataTableColumn<T>[];
    rowKey: (row: T, index: number) => string;
    loading?: boolean;
    error?: string | null;
    emptyMessage?: string;
    searchValue?: string;
    searchPlaceholder?: string;
    onSearchValueChange?: (value: string) => void;
    onSearch?: () => void;
    filters?: ReactNode;
    addLabel?: string;
    onAdd?: () => void;
    pagination?: Pagination;
    onPageChange?: (page: number) => void;
    onLimitChange?: (limit: number) => void;
}

export default function DataTable<T>({
    title,
    description,
    rows,
    columns,
    rowKey,
    loading = false,
    error = null,
    emptyMessage = "Không có dữ liệu.",
    searchValue = "",
    searchPlaceholder = "Tìm kiếm...",
    onSearchValueChange,
    onSearch,
    filters,
    addLabel = "Th\u00eam m\u1edbi",
    onAdd,
    pagination,
    onPageChange,
    onLimitChange,
}: DataTableProps<T>) {
    const page = pagination?.page || 1;
    const pages = pagination?.pages || 1;
    const canPrev = page > 1;
    const canNext = page < pages;

    const pageNumbers = createPageNumbers(page, pages);

    return (
        <section className="rounded-3xl border border-[#FFD4E1] bg-white p-5 shadow-[0_16px_35px_rgba(249,153,183,0.12)]">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-[#2B1B24]">{title}</h2>
                    {description ? (
                        <p className="mt-1 text-sm text-[#7A6A70]">{description}</p>
                    ) : null}
                </div>
                {onAdd ? (
                    <button
                        type="button"
                        onClick={onAdd}
                        className="h-11 rounded-2xl bg-[#F999B7] px-5 text-sm font-semibold text-white transition hover:brightness-95">
                        {addLabel}
                    </button>
                ) : null}
            </div>

            <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(250px,1fr)_auto_auto]">
                <div className="flex gap-2">
                    <input
                        value={searchValue}
                        onChange={(event) =>
                            onSearchValueChange?.(event.target.value)
                        }
                        onKeyDown={(event) => {
                            if (event.key === "Enter") onSearch?.();
                        }}
                        placeholder={searchPlaceholder}
                        className="h-11 w-full rounded-2xl border border-[#FFD4E1] bg-[#FFF7FA] px-4 text-sm outline-none placeholder:text-[#b59aa4] focus:border-[#F999B7]"
                    />
                    <button
                        type="button"
                        onClick={onSearch}
                        className="rounded-2xl border border-[#FFD4E1] px-4 text-sm font-semibold text-[#2B1B24]">
                        Tìm
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">{filters}</div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#FFD4E1]">
                <table className="min-w-full border-collapse">
                    <thead className="bg-[#FFF7FA]">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-[#7A6A70] ${
                                        column.className || ""
                                    }`}>
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-4 py-10 text-center text-sm text-[#7A6A70]">
                                    {"\u0110ang t\u1ea3i d\u1eef li\u1ec7u..."}
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-4 py-10 text-center text-sm text-[#c25879]">
                                    {error}
                                </td>
                            </tr>
                        ) : rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-4 py-10 text-center text-sm text-[#7A6A70]">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            rows.map((row, rowIndex) => (
                                <tr
                                    key={rowKey(row, rowIndex)}
                                    className="border-t border-[#f8e8ee] align-top">
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className={`px-4 py-3 text-sm text-[#2B1B24] ${
                                                column.className || ""
                                            }`}>
                                            {column.render(row)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && pages > 0 ? (
                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-[#7A6A70]">
                        Hiển thị trang {page}/{pages} - tổng {pagination.total} bản ghi
                    </p>
                    <div className="flex items-center gap-2">
                        {onLimitChange ? (
                            <select
                                value={pagination.limit}
                                onChange={(event) =>
                                    onLimitChange(Number(event.target.value))
                                }
                                className="h-10 rounded-xl border border-[#FFD4E1] bg-[#FFF7FA] px-3 text-sm text-[#2B1B24]">
                                {[10, 20, 30, 50].map((value) => (
                                    <option key={value} value={value}>
                                        {value} / trang
                                    </option>
                                ))}
                            </select>
                        ) : null}

                        <button
                            type="button"
                            onClick={() => canPrev && onPageChange?.(page - 1)}
                            disabled={!canPrev}
                            className="h-10 rounded-xl border border-[#FFD4E1] px-3 text-sm font-semibold text-[#2B1B24] disabled:cursor-not-allowed disabled:opacity-50">
                            Trước
                        </button>

                        {pageNumbers.map((item, index) =>
                            item === "..." ? (
                                <span
                                    key={`${item}-${index}`}
                                    className="px-1 text-sm text-[#7A6A70]">
                                    ...
                                </span>
                            ) : (
                                <button
                                    key={`page-${item}`}
                                    type="button"
                                    onClick={() => onPageChange?.(item)}
                                    className={`h-10 min-w-10 rounded-xl border px-3 text-sm font-semibold ${
                                        item === page
                                            ? "border-[#F999B7] bg-[#F999B7] text-white"
                                            : "border-[#FFD4E1] text-[#2B1B24]"
                                    }`}>
                                    {item}
                                </button>
                            ),
                        )}

                        <button
                            type="button"
                            onClick={() => canNext && onPageChange?.(page + 1)}
                            disabled={!canNext}
                            className="h-10 rounded-xl border border-[#FFD4E1] px-3 text-sm font-semibold text-[#2B1B24] disabled:cursor-not-allowed disabled:opacity-50">
                            Sau
                        </button>
                    </div>
                </div>
            ) : null}
        </section>
    );
}

const createPageNumbers = (
    currentPage: number,
    totalPages: number,
): Array<number | "..."> => {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages: Array<number | "..."> = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i += 1) pages.push(i);
    if (end < totalPages - 1) pages.push("...");

    pages.push(totalPages);
    return pages;
};
