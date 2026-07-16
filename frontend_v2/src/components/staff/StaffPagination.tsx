"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Pagination } from "../../types/api";

interface StaffPaginationProps {
    pagination: Pagination;
    onPageChange: (page: number) => void;
    onLimitChange?: (limit: number) => void;
}

export default function StaffPagination({
    pagination,
    onPageChange,
    onLimitChange,
}: StaffPaginationProps) {
    const page = pagination.page || 1;
    const pages = pagination.pages || 1;

    return (
        <div className="flex flex-col gap-3 border-t border-[#F5E5EC] px-5 py-4 text-sm text-[#7A6A70] md:flex-row md:items-center md:justify-between">
            <span>
                Trang {page}/{pages}, tổng {pagination.total} bản ghi
            </span>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EADDE2] text-[#2B1B24] disabled:opacity-45">
                    <ChevronLeft size={16} />
                </button>
                <span className="min-w-9 rounded-xl border border-[#F999B7] px-3 py-2 text-center font-semibold text-[#F999B7]">
                    {page}
                </span>
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
