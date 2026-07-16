"use client";

import Image from "next/image";
import {
    Edit3,
    Lock,
    MoreVertical,
    Unlock,
} from "lucide-react";
import type { AdminUser } from "../../types/admin";

interface AccountTableProps {
    users: AdminUser[];
    loading?: boolean;
    onToggleBlock?: (user: AdminUser) => void;
}

const formatDate = (value?: string) =>
    value
        ? new Date(value).toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
          })
        : "--";

const avatarFor = (user: AdminUser, index: number) =>
    `https://i.pravatar.cc/96?img=${index + (user.role === "admin" ? 5 : 18)}`;

const text = {
    account: "T\u00e0i kho\u1ea3n",
    role: "Vai tr\u00f2",
    status: "Tr\u1ea1ng th\u00e1i",
    createdAt: "Ng\u00e0y t\u1ea1o",
    lastLogin: "\u0110\u0103ng nh\u1eadp cu\u1ed1i",
    action: "Thao t\u00e1c",
    loading: "\u0110ang t\u1ea3i danh s\u00e1ch t\u00e0i kho\u1ea3n...",
    empty: "Ch\u01b0a c\u00f3 t\u00e0i kho\u1ea3n ph\u00f9 h\u1ee3p.",
    admin: "Qu\u1ea3n tr\u1ecb vi\u00ean",
    staff: "Nh\u00e2n vi\u00ean",
    active: "\u0110ang ho\u1ea1t \u0111\u1ed9ng",
    blocked: "\u0110\u00e3 kh\u00f3a",
    you: "B\u1ea1n",
};

export default function AccountTable({
    users,
    loading = false,
    onToggleBlock,
}: AccountTableProps) {
    return (
        <div className="overflow-hidden rounded-[20px] border border-[#FFE3EC] bg-white shadow-[0_16px_38px_rgba(43,27,36,0.04)]">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                    <thead className="bg-[#FFF7FA] text-xs uppercase text-[#7A6A70]">
                        <tr>
                            <th className="w-12 px-5 py-4">
                                <input type="checkbox" className="h-4 w-4 rounded border-[#E8D6DE]" />
                            </th>
                            <th className="px-5 py-4">{text.account}</th>
                            <th className="px-5 py-4">{text.role}</th>
                            <th className="px-5 py-4">{text.status}</th>
                            <th className="px-5 py-4">{text.createdAt}</th>
                            <th className="px-5 py-4">{text.lastLogin}</th>
                            <th className="px-5 py-4 text-right">{text.action}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5E5EC]">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-5 py-12 text-center text-[#7A6A70]">
                                    {text.loading}
                                </td>
                            </tr>
                        ) : users.length ? (
                            users.map((user, index) => (
                                <tr
                                    key={String(user._id || user.email)}
                                    className="transition hover:bg-[#FFF9FB]">
                                    <td className="px-5 py-4">
                                        <input type="checkbox" className="h-4 w-4 rounded border-[#E8D6DE]" />
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <Image
                                                src={avatarFor(user, index)}
                                                alt={user.name || user.email}
                                                width={42}
                                                height={42}
                                                className="h-10 w-10 rounded-full object-cover"
                                            />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-[#2B1B24]">
                                                        {user.name || "Admin"}
                                                    </p>
                                                    {user.role === "admin" ? (
                                                        <span className="rounded-md bg-[#FFE3EC] px-2 py-0.5 text-[11px] font-semibold text-[#F92B73]">
                                                            {text.you}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <p className="text-xs text-[#7A6A70]">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span
                                            className={
                                                user.role === "admin"
                                                    ? "rounded-md bg-[#FFE3EC] px-3 py-1 text-xs font-semibold text-[#F92B73]"
                                                    : "rounded-md bg-[#F1E9FF] px-3 py-1 text-xs font-semibold text-[#7C3AED]"
                                            }>
                                            {user.role === "admin" ? text.admin : text.staff}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span
                                            className={
                                                user.isBlocked
                                                    ? "inline-flex items-center gap-2 text-[#F92B73]"
                                                    : "inline-flex items-center gap-2 text-[#16A34A]"
                                            }>
                                            <span className="h-2 w-2 rounded-full bg-current" />
                                            {user.isBlocked ? text.blocked : text.active}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-[#2B1B24]">
                                        {formatDate(user.createdAt)}
                                    </td>
                                    <td className="px-5 py-4 text-[#2B1B24]">
                                        {formatDate(user.lastLoginAt)}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button className="rounded-xl border border-[#FFE3EC] p-2 text-[#F92B73] hover:bg-[#FFF0F5]" type="button">
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                className="rounded-xl border border-[#FFE3EC] p-2 text-[#F92B73] hover:bg-[#FFF0F5]"
                                                type="button"
                                                disabled={user.role === "admin"}
                                                onClick={() => onToggleBlock?.(user)}>
                                                {user.isBlocked ? <Unlock size={16} /> : <Lock size={16} />}
                                            </button>
                                            <button className="rounded-xl p-2 text-[#7A6A70] hover:bg-[#FFF0F5]" type="button">
                                                <MoreVertical size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-5 py-12 text-center text-[#7A6A70]">
                                    {text.empty}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
