"use client";

import {
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
    type FormEvent,
    type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import {
    fetchVietnamAddressDetail,
    fetchVietnamAddressSuggestions,
    type AddressSuggestion,
} from "../../services/locationService";
import {
    createOrder,
    fetchCheckoutSummary,
    type CheckoutSummary,
    type PaymentMethod,
} from "../../services/orderService";
import { getCurrentUser } from "../../utils/user";
import { getErrorMessage } from "../../lib/errors";

type CheckoutForm = {
    fullName: string;
    phone: string;
    email: string;
    province: string;
    district: string;
    ward: string;
    addressLine: string;
    note: string;
};

const defaultForm: CheckoutForm = {
    fullName: "",
    phone: "",
    email: "",
    province: "",
    district: "",
    ward: "",
    addressLine: "",
    note: "",
};

const SHIPPING_RECALCULATE_DEBOUNCE_MS = 400;
const ADDRESS_AUTOCOMPLETE_DEBOUNCE_MS = 350;

const formatCurrency = (value: number) => `${value.toLocaleString("vi-VN")} đ`;

const parseAddressParts = (formattedAddress: string) => {
    const parts = String(formattedAddress || "")
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);

    const province = parts[parts.length - 1] || "";
    const district = parts[parts.length - 2] || "";
    const ward = parts[parts.length - 3] || "";
    const addressLine =
        parts.length > 3
            ? parts.slice(0, Math.max(1, parts.length - 3)).join(", ")
            : parts[0] || "";

    return { province, district, ward, addressLine };
};

const buildAreaText = (province: string, district: string, ward: string) =>
    [province, district, ward].filter(Boolean).join(", ");

export default function CheckoutPage() {
    const router = useRouter();
    const [summary, setSummary] = useState<CheckoutSummary | null>(null);
    const [form, setForm] = useState<CheckoutForm>(defaultForm);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
    const [status, setStatus] = useState<{
        type: "error" | "success" | "";
        message: string;
    }>({ type: "", message: "" });
    const [isLoading, setIsLoading] = useState(true);
    const [isEstimatingShipping, setIsEstimatingShipping] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bootstrapped, setBootstrapped] = useState(false);

    const [streetQuery, setStreetQuery] = useState("");
    const [streetSuggestions, setStreetSuggestions] = useState<AddressSuggestion[]>(
        [],
    );
    const [streetDropdownOpen, setStreetDropdownOpen] = useState(false);
    const [isSearchingStreet, setIsSearchingStreet] = useState(false);

    const [areaQuery, setAreaQuery] = useState("");
    const [areaSuggestions, setAreaSuggestions] = useState<AddressSuggestion[]>(
        [],
    );
    const [areaDropdownOpen, setAreaDropdownOpen] = useState(false);
    const [isSearchingArea, setIsSearchingArea] = useState(false);

    const [isResolvingAddress, setIsResolvingAddress] = useState(false);

    useEffect(() => {
        const user = getCurrentUser();
        if (!user?._id && !user?.email) {
            router.replace("/login?redirect=/checkout");
            return;
        }

        const draftNote =
            typeof window !== "undefined"
                ? window.localStorage.getItem("checkout_note_draft") || ""
                : "";

        let mounted = true;
        const loadSummary = async () => {
            try {
                const data = await fetchCheckoutSummary();
                if (!mounted) return;
                setSummary(data);
                setPaymentMethod(
                    data.availablePaymentMethods?.includes("COD")
                        ? "COD"
                        : "PAYOS",
                );
                setForm((prev) => ({
                    ...prev,
                    fullName: user?.name || prev.fullName || "",
                    email: user?.email || prev.email || "",
                    note: prev.note || draftNote,
                }));
            } catch (error) {
                if (!mounted) return;
                setStatus({
                    type: "error",
                    message: getErrorMessage(
                        error,
                        "Không tải được thông tin thanh toán.",
                    ),
                });
            } finally {
                if (mounted) {
                    setIsLoading(false);
                    setBootstrapped(true);
                }
            }
        };

        void loadSummary();
        return () => {
            mounted = false;
        };
    }, [router]);

    useEffect(() => {
        if (!bootstrapped) return;

        let cancelled = false;
        const timer = window.setTimeout(async () => {
            setIsEstimatingShipping(true);
            try {
                const data = await fetchCheckoutSummary(form.province.trim());
                if (cancelled) return;
                setSummary(data);
                setStatus((prev) =>
                    prev.type === "error" && prev.message
                        ? { type: "", message: "" }
                        : prev,
                );
            } catch (error) {
                if (cancelled) return;
                setStatus({
                    type: "error",
                    message: getErrorMessage(
                        error,
                        "Không thể cập nhật phí vận chuyển.",
                    ),
                });
            } finally {
                if (!cancelled) setIsEstimatingShipping(false);
            }
        }, SHIPPING_RECALCULATE_DEBOUNCE_MS);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [form.province, bootstrapped]);

    useEffect(() => {
        if (!streetDropdownOpen) return;
        const query = streetQuery.trim();
        if (query.length < 2) {
            setStreetSuggestions([]);
            setIsSearchingStreet(false);
            return;
        }

        let cancelled = false;
        const timer = window.setTimeout(async () => {
            setIsSearchingStreet(true);
            try {
                const suggestions = await fetchVietnamAddressSuggestions(query);
                if (cancelled) return;
                setStreetSuggestions(suggestions);
            } catch (error) {
                if (cancelled) return;
                setStreetSuggestions([]);
                setStatus({
                    type: "error",
                    message: getErrorMessage(
                        error,
                        "Không thể gợi ý địa chỉ lúc này.",
                    ),
                });
            } finally {
                if (!cancelled) setIsSearchingStreet(false);
            }
        }, ADDRESS_AUTOCOMPLETE_DEBOUNCE_MS);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [streetQuery, streetDropdownOpen]);

    useEffect(() => {
        if (!areaDropdownOpen) return;
        const query = areaQuery.trim();
        if (query.length < 2) {
            setAreaSuggestions([]);
            setIsSearchingArea(false);
            return;
        }

        let cancelled = false;
        const timer = window.setTimeout(async () => {
            setIsSearchingArea(true);
            try {
                const suggestions = await fetchVietnamAddressSuggestions(query);
                if (cancelled) return;
                setAreaSuggestions(suggestions);
            } catch (error) {
                if (cancelled) return;
                setAreaSuggestions([]);
                setStatus({
                    type: "error",
                    message: getErrorMessage(
                        error,
                        "Không thể gợi ý Tỉnh/Phường lúc này.",
                    ),
                });
            } finally {
                if (!cancelled) setIsSearchingArea(false);
            }
        }, ADDRESS_AUTOCOMPLETE_DEBOUNCE_MS);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [areaQuery, areaDropdownOpen]);

    const finalTotal = useMemo(() => {
        if (!summary) return 0;
        if (!form.province.trim()) {
            return Math.max(0, summary.subtotal - summary.discount);
        }
        return summary.total;
    }, [summary, form.province]);

    const shippingText = useMemo(() => {
        if (!summary) return "";
        if (!form.province.trim()) {
            return "Nhập địa chỉ để xem phí vận chuyển và ngày giao dự kiến.";
        }
        if (summary.shipping?.estimatedDeliveryText) {
            return `${summary.shipping.estimatedDeliveryText}.`;
        }
        return "Đang tính lịch giao hàng.";
    }, [summary, form.province]);

    const shippingAddressPreview = useMemo(() => {
        const parts = [form.addressLine.trim(), areaQuery.trim()].filter(Boolean);
        return parts.join(", ");
    }, [form.addressLine, areaQuery]);

    const onChange =
        (field: keyof CheckoutForm) =>
        (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const nextValue = event.target.value;
            setForm((prev) => ({ ...prev, [field]: nextValue }));
            if (field === "note" && typeof window !== "undefined") {
                window.localStorage.setItem("checkout_note_draft", nextValue);
            }
        };

    const applyAddressDetail = (
        detail: Awaited<ReturnType<typeof fetchVietnamAddressDetail>>,
        options?: { keepAddressLine?: boolean },
    ) => {
        const fallback = parseAddressParts(detail.formattedAddress || "");
        const province = detail.province || fallback.province;
        const district = detail.district || fallback.district;
        const ward = detail.ward || fallback.ward;
        const addressLine = detail.addressLine || fallback.addressLine;

        setForm((prev) => ({
            ...prev,
            province: province || prev.province,
            district: district || prev.district,
            ward: ward || prev.ward,
            addressLine: options?.keepAddressLine
                ? prev.addressLine
                : addressLine || prev.addressLine,
        }));

        if (!options?.keepAddressLine) {
            setStreetQuery(addressLine || "");
        }
        setAreaQuery(
            buildAreaText(province, district, ward) ||
                detail.formattedAddress ||
                "",
        );
    };

    const handleStreetSuggestionSelect = async (suggestion: AddressSuggestion) => {
        setIsResolvingAddress(true);
        try {
            const detail = await fetchVietnamAddressDetail(suggestion.placeId);
            applyAddressDetail(detail, { keepAddressLine: false });
            setStreetQuery(
                detail.addressLine ||
                    parseAddressParts(detail.formattedAddress || "").addressLine ||
                    suggestion.mainText ||
                    suggestion.description,
            );
            setStreetSuggestions([]);
            setStreetDropdownOpen(false);
            setStatus((prev) =>
                prev.type === "error" ? { type: "", message: "" } : prev,
            );
        } catch (error) {
            setStatus({
                type: "error",
                message: getErrorMessage(
                    error,
                    "Không lấy được chi tiết địa chỉ từ Google Maps.",
                ),
            });
        } finally {
            setIsResolvingAddress(false);
        }
    };

    const handleAreaSuggestionSelect = async (suggestion: AddressSuggestion) => {
        setIsResolvingAddress(true);
        try {
            const detail = await fetchVietnamAddressDetail(suggestion.placeId);
            applyAddressDetail(detail, { keepAddressLine: true });
            setAreaSuggestions([]);
            setAreaDropdownOpen(false);
            setStatus((prev) =>
                prev.type === "error" ? { type: "", message: "" } : prev,
            );
        } catch (error) {
            setStatus({
                type: "error",
                message: getErrorMessage(
                    error,
                    "Không lấy được Tỉnh/Phường từ Google Maps.",
                ),
            });
        } finally {
            setIsResolvingAddress(false);
        }
    };

    const validateForm = () => {
        if (
            !form.fullName.trim() ||
            !form.phone.trim() ||
            !form.province.trim() ||
            !form.district.trim() ||
            !form.ward.trim() ||
            !form.addressLine.trim()
        ) {
            return "Vui lòng nhập đầy đủ thông tin giao hàng.";
        }

        if (!/^0\d{8,14}$/.test(form.phone.trim())) {
            return "Số điện thoại phải bắt đầu bằng số 0.";
        }

        if (
            form.email.trim() &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
        ) {
            return "Email không đúng định dạng.";
        }

        return "";
    };

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!summary || isSubmitting) return;

        const validationError = validateForm();
        if (validationError) {
            setStatus({ type: "error", message: validationError });
            return;
        }

        setIsSubmitting(true);
        setStatus({ type: "", message: "" });

        try {
            const response = await createOrder({
                shippingAddress: {
                    fullName: form.fullName.trim(),
                    phone: form.phone.trim(),
                    province: form.province.trim(),
                    district: form.district.trim(),
                    ward: form.ward.trim(),
                    addressLine: form.addressLine.trim(),
                },
                paymentMethod,
                note: form.note.trim(),
            });

            if (typeof window !== "undefined") {
                window.localStorage.removeItem("checkout_note_draft");
            }

            const orderId = response?.order?.id || response?.order?._id;
            if (paymentMethod === "PAYOS" && response?.checkoutUrl) {
                window.location.href = response.checkoutUrl;
                return;
            }

            if (orderId) {
                router.push(`/checkout/success?orderId=${orderId}`);
                return;
            }

            router.push("/checkout/success");
        } catch (error) {
            const message = getErrorMessage(error, "Đặt hàng thất bại.");
            setStatus({ type: "error", message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FFF7FA] text-[#2B1B24]">
            <Header />
            <main className="mx-auto max-w-6xl px-4 py-8">
                <h1 className="mb-5 text-3xl font-bold">Thanh toán</h1>

                {status.message ? (
                    <div
                        className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
                            status.type === "error"
                                ? "border-[#f0a3b6] bg-[#fff3f7] text-[#b14063]"
                                : "border-[#FFD4E1] bg-[#FFF7FA] text-[#2B1B24]"
                        }`}>
                        {status.message}
                    </div>
                ) : null}

                <form
                    onSubmit={onSubmit}
                    className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                    <section className="space-y-4">
                        <article className="rounded-[24px] border border-[#ECDDE4] bg-white p-5 shadow-[0_10px_30px_rgba(249,153,183,0.12)] md:p-6">
                            <h2 className="text-[1.6rem] font-bold">Thông tin giao hàng</h2>

                            <div className="mt-4 grid gap-3">
                                <Field label="Họ và tên">
                                    <input
                                        value={form.fullName}
                                        onChange={onChange("fullName")}
                                        placeholder="Nhập họ và tên"
                                        className="h-12 w-full rounded-xl border border-[#E4D8DF] px-4 outline-none focus:border-[#F999B7]"
                                    />
                                </Field>

                                <Field label="Số điện thoại">
                                    <div className="relative">
                                        <input
                                            value={form.phone}
                                            onChange={onChange("phone")}
                                            placeholder="Nhập số điện thoại"
                                            className="h-12 w-full rounded-xl border border-[#E4D8DF] px-4 pr-12 outline-none focus:border-[#F999B7]"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">
                                            🇻🇳
                                        </span>
                                    </div>
                                </Field>

                                <Field label="Email (không bắt buộc)">
                                    <input
                                        value={form.email}
                                        onChange={onChange("email")}
                                        placeholder="Nhập email (không bắt buộc)"
                                        className="h-12 w-full rounded-xl border border-[#E4D8DF] px-4 outline-none focus:border-[#F999B7]"
                                    />
                                </Field>

                                <Field label="Quốc gia">
                                    <input
                                        value="Vietnam"
                                        disabled
                                        readOnly
                                        className="h-12 w-full cursor-not-allowed rounded-xl border border-[#E4D8DF] bg-[#F8F5F7] px-4 text-[#4A3A41]"
                                    />
                                </Field>

                                <div className="relative">
                                    <Field label="Địa chỉ, tên đường">
                                        <input
                                            value={streetQuery}
                                            onChange={(event) => {
                                                const value = event.target.value;
                                                setStreetQuery(value);
                                                setForm((prev) => ({
                                                    ...prev,
                                                    addressLine: value,
                                                }));
                                                setStreetDropdownOpen(true);
                                            }}
                                            onFocus={() => setStreetDropdownOpen(true)}
                                            onBlur={() => {
                                                window.setTimeout(
                                                    () => setStreetDropdownOpen(false),
                                                    150,
                                                );
                                            }}
                                            autoComplete="off"
                                            placeholder="Nhập địa chỉ, tên đường"
                                            className="h-12 w-full rounded-xl border border-[#E4D8DF] px-4 outline-none focus:border-[#F999B7]"
                                        />
                                    </Field>

                                    <SuggestionMenu
                                        open={streetDropdownOpen}
                                        suggestions={streetSuggestions}
                                        isSearching={isSearchingStreet}
                                        isResolving={isResolvingAddress}
                                        emptyMessage="Không có gợi ý địa chỉ."
                                        searchingMessage="Đang gợi ý tên đường..."
                                        resolvingMessage="Đang lấy chi tiết địa chỉ..."
                                        onSelect={handleStreetSuggestionSelect}
                                    />
                                </div>

                                <div className="relative">
                                    <Field label="Tỉnh/TP, Phường/Xã">
                                        <input
                                            value={areaQuery}
                                            onChange={(event) => {
                                                const value = event.target.value;
                                                setAreaQuery(value);
                                                setAreaDropdownOpen(true);
                                                if (!value.trim()) {
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        province: "",
                                                        district: "",
                                                        ward: "",
                                                    }));
                                                }
                                            }}
                                            onFocus={() => setAreaDropdownOpen(true)}
                                            onBlur={() => {
                                                window.setTimeout(
                                                    () => setAreaDropdownOpen(false),
                                                    150,
                                                );
                                            }}
                                            autoComplete="off"
                                            placeholder="Tỉnh/TP, Phường/Xã"
                                            className="h-12 w-full rounded-xl border border-[#E4D8DF] px-4 outline-none focus:border-[#F999B7]"
                                        />
                                    </Field>

                                    <SuggestionMenu
                                        open={areaDropdownOpen}
                                        suggestions={areaSuggestions}
                                        isSearching={isSearchingArea}
                                        isResolving={isResolvingAddress}
                                        emptyMessage="Không có gợi ý Tỉnh/Phường."
                                        searchingMessage="Đang gợi ý Tỉnh/TP, Phường/Xã..."
                                        resolvingMessage="Đang lấy khu vực..."
                                        onSelect={handleAreaSuggestionSelect}
                                    />
                                </div>
                            </div>
                        </article>

                        <article className="rounded-[24px] border border-[#ECDDE4] bg-white p-5 shadow-[0_10px_30px_rgba(249,153,183,0.12)] md:p-6">
                            <h3 className="text-2xl font-bold">Phương thức giao hàng</h3>
                            <input
                                value={shippingAddressPreview}
                                readOnly
                                placeholder="Nhập địa chỉ để xem các phương thức giao hàng"
                                className="mt-4 h-12 w-full rounded-xl border border-[#E4D8DF] bg-[#FAF7F9] px-4 text-[#594853] outline-none"
                            />
                            <p className="mt-3 text-sm text-[#7A6A70]">{shippingText}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                                <span className="rounded-full border border-[#ECDDE4] bg-white px-3 py-1">
                                    {summary?.shipping?.method || "Giao hàng tiêu chuẩn"}
                                </span>
                                <span className="rounded-full border border-[#ECDDE4] bg-white px-3 py-1">
                                    {form.province.trim()
                                        ? summary?.shippingFee === 0
                                            ? "Miễn phí ship"
                                            : `Phí ship: ${formatCurrency(summary?.shippingFee || 0)}`
                                        : "Chưa tính phí ship"}
                                </span>
                                {isEstimatingShipping ? (
                                    <span className="text-[#7A6A70]">
                                        Đang cập nhật phí vận chuyển...
                                    </span>
                                ) : null}
                            </div>
                        </article>

                        <article className="rounded-[24px] border border-[#ECDDE4] bg-white p-5 shadow-[0_10px_30px_rgba(249,153,183,0.12)] md:p-6">
                            <Field label="Ghi chú đơn hàng">
                                <textarea
                                    value={form.note}
                                    onChange={onChange("note")}
                                    rows={3}
                                    className="w-full rounded-xl border border-[#E4D8DF] px-4 py-3 outline-none focus:border-[#F999B7]"
                                    placeholder="Ví dụ: giao giờ hành chính..."
                                />
                            </Field>

                            <h2 className="mt-6 text-xl font-bold">Phương thức thanh toán</h2>
                            <div className="mt-4 space-y-3">
                                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#FFD4E1] p-4">
                                    <input
                                        type="radio"
                                        checked={paymentMethod === "COD"}
                                        onChange={() => setPaymentMethod("COD")}
                                    />
                                    <div>
                                        <p className="font-semibold">
                                            COD - Thanh toán khi nhận hàng
                                        </p>
                                        <p className="text-sm text-[#7A6A70]">
                                            Trả tiền mặt khi nhận hàng.
                                        </p>
                                    </div>
                                </label>
                                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#FFD4E1] p-4">
                                    <input
                                        type="radio"
                                        checked={paymentMethod === "PAYOS"}
                                        onChange={() => setPaymentMethod("PAYOS")}
                                    />
                                    <div>
                                        <p className="font-semibold">
                                            PAYOS - Thanh toán online
                                        </p>
                                        <p className="text-sm text-[#7A6A70]">
                                            Chuyển sang cổng thanh toán payOS.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </article>
                    </section>

                    <aside className="h-fit rounded-[24px] bg-white p-5 shadow-[0_10px_30px_rgba(249,153,183,0.15)] md:p-6">
                        <h2 className="text-xl font-bold">Đơn hàng</h2>
                        {isLoading ? (
                            <div className="mt-4 rounded-2xl border border-dashed border-[#FFD4E1] bg-[#FFF7FA] p-6 text-center text-sm text-[#7A6A70]">
                                Đang tải thông tin đơn hàng...
                            </div>
                        ) : null}

                        {!isLoading && summary ? (
                            <>
                                <div className="mt-4 space-y-3">
                                    {summary.items.map((item) => (
                                        <div
                                            key={item.productId}
                                            className="rounded-2xl border border-[#FFD4E1] p-3">
                                            <p className="text-sm font-semibold">{item.name}</p>
                                            <p className="mt-1 text-xs text-[#7A6A70]">
                                                {item.quantity} x {formatCurrency(item.unitPrice)}
                                            </p>
                                            <p className="mt-2 text-sm font-semibold text-[#F999B7]">
                                                {formatCurrency(item.lineTotal)}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-[#7A6A70]">Tạm tính</span>
                                        <strong>{formatCurrency(summary.subtotal)}</strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#7A6A70]">Giảm giá</span>
                                        <strong className="text-[#2b9f6a]">
                                            -{formatCurrency(summary.discount)}
                                        </strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#7A6A70]">Vận chuyển</span>
                                        <strong>
                                            {form.province.trim()
                                                ? summary.shippingFee === 0
                                                    ? "Miễn phí"
                                                    : formatCurrency(summary.shippingFee)
                                                : "Chưa tính"}
                                        </strong>
                                    </div>
                                </div>

                                <div className="mt-4 border-t border-[#FFD4E1] pt-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-base font-semibold">
                                            Tổng cộng
                                        </span>
                                        <strong className="text-2xl text-[#F999B7]">
                                            {formatCurrency(finalTotal)}
                                        </strong>
                                    </div>
                                </div>
                            </>
                        ) : null}

                        <button
                            type="submit"
                            disabled={!summary || isSubmitting}
                            className="mt-5 h-12 w-full rounded-2xl bg-[#F999B7] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                            {isSubmitting ? "Đang xử lý..." : "Đặt hàng"}
                        </button>
                    </aside>
                </form>
            </main>
            <Footer />
        </div>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#3A2A34]">
                {label}
            </span>
            {children}
        </label>
    );
}

function SuggestionMenu({
    open,
    suggestions,
    isSearching,
    isResolving,
    emptyMessage,
    searchingMessage,
    resolvingMessage,
    onSelect,
}: {
    open: boolean;
    suggestions: AddressSuggestion[];
    isSearching: boolean;
    isResolving: boolean;
    emptyMessage: string;
    searchingMessage: string;
    resolvingMessage: string;
    onSelect: (suggestion: AddressSuggestion) => void;
}) {
    if (!open) return null;
    if (!isSearching && !isResolving && suggestions.length === 0) return null;

    return (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-[#F1CFDB] bg-white shadow-[0_10px_24px_rgba(249,153,183,0.18)]">
            {isSearching ? (
                <p className="px-4 py-3 text-sm text-[#7A6A70]">
                    {searchingMessage}
                </p>
            ) : null}
            {isResolving ? (
                <p className="px-4 py-3 text-sm text-[#7A6A70]">
                    {resolvingMessage}
                </p>
            ) : null}
            {!isSearching && !isResolving && suggestions.length === 0 ? (
                <p className="px-4 py-3 text-sm text-[#7A6A70]">{emptyMessage}</p>
            ) : null}
            {!isSearching &&
                !isResolving &&
                suggestions.map((suggestion) => (
                    <button
                        key={suggestion.placeId}
                        type="button"
                        className="w-full border-b border-[#F7E3EA] px-4 py-3 text-left last:border-b-0 hover:bg-[#FFF7FA]"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => onSelect(suggestion)}>
                        <p className="text-sm font-semibold text-[#2B1B24]">
                            {suggestion.mainText || suggestion.description}
                        </p>
                        {suggestion.secondaryText ? (
                            <p className="text-xs text-[#7A6A70]">
                                {suggestion.secondaryText}
                            </p>
                        ) : null}
                    </button>
                ))}
        </div>
    );
}
