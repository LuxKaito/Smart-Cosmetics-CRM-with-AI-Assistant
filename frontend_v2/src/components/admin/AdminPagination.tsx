"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Pagination } from "../../types/api";

interface AdminPaginationProps {
    pagination: Pagination;
    onPageChange: (page: number) => void;
    onLimitChange?: (limit: number) => void;
}

export default function AdminPagination({
    pagination,
    onPageChange,
    onLimitChange,
}: AdminPaginationProps) {
    const page = pagination.page || 1;
    const pages = pagination.pages || 1;
    const numbers = createPageNumbers(page, pages);

    return (
        <div className="flex flex-col gap-3 border-t border-[#F5E5EC] px-5 py-4 text-sm text-[#7A6A70] md:flex-row md:items-center md:justify-between">
            <span>
                Hiển thị trang {page}/{pages} trong tổng số {pagination.total} bản ghi
            </span>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EADDE2] text-[#2B1B24] disabled:opacity-45">
                    <ChevronLeft size={16} />
                </button>
                {numbers.map((item, index) =>
                    item === "..." ? (
                        <span key={`${item}-${index}`} className="px-1">
                            ...
                        </span>
                    ) : (
                        <button
                            key={item}
                            type="button"
                            onClick={() => onPageChange(item)}
                            className={`h-9 min-w-9 rounded-xl border px-3 font-semibold ${
                                item === page
                                    ? "border-[#F999B7] text-[#F999B7]"
                                    : "border-[#EADDE2] text-[#2B1B24]"
                            }`}>
                            {item}
                        </button>
                    ),
                )}
                <button
                    type="button"
                    disabled={page >= pages}
                    onClick={() => onPageChange(page + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EADDE2] text-[#2B1B24] disabled:opacity-45">
                    <ChevronRight size={16} />
                </button>
                {onLimitChange ? (
                    <select
                        value={pagination.limit}
                        onChange={(event) => onLimitChange(Number(event.target.value))}
                        className="ml-2 h-9 rounded-xl border border-[#EADDE2] bg-white px-3 text-[#2B1B24]">
                        {[10, 20, 30, 50].map((limit) => (
                            <option key={limit} value={limit}>
                                {limit} / trang
                            </option>
                        ))}
                    </select>
                ) : null}
            </div>
        </div>
    );
}

const createPageNumbers = (currentPage: number, totalPages: number): Array<number | "..."> => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
    const result: Array<number | "..."> = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    if (start > 2) result.push("...");
    for (let page = start; page <= end; page += 1) result.push(page);
    if (end < totalPages - 1) result.push("...");
    result.push(totalPages);
    return result;
};
