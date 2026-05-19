export interface AddressSuggestion {
    provider?: "vietmap";
    placeId: string;
    displayName: string;
    mainText: string;
    secondaryText: string;
    lat: number;
    lon: number;
    address: Record<string, string>;
}

export async function fetchVietnamAddressSuggestions(
    query: string,
): Promise<AddressSuggestion[]> {
    const q = query.trim();
    if (q.length < 3) return [];

    const response = await fetch(`/api/address?q=${encodeURIComponent(q)}`, {
        method: "GET",
        cache: "no-store",
    });

    let payload: unknown = null;
    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    const data = payload as {
        success?: boolean;
        message?: string;
        data?: { suggestions?: AddressSuggestion[] };
    } | null;

    if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Có lỗi khi tìm địa chỉ");
    }

    return data.data?.suggestions || [];
}
