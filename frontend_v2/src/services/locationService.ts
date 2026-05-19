import { apiRequest } from "../lib/apiClient";

export interface AddressSuggestion {
    placeId: string;
    description: string;
    mainText: string;
    secondaryText: string;
}

export interface AddressDetail {
    placeId: string;
    formattedAddress: string;
    province: string;
    district: string;
    ward: string;
    addressLine: string;
    location: {
        lat: number;
        lng: number;
    };
}

export async function fetchVietnamAddressSuggestions(
    query: string,
): Promise<AddressSuggestion[]> {
    const q = query.trim();
    if (q.length < 2) return [];

    const data = await apiRequest<{ suggestions: AddressSuggestion[] }>({
        url: "/checkout/address/suggest",
        params: { q },
    });

    return data?.suggestions || [];
}

export async function fetchVietnamAddressDetail(
    placeId: string,
): Promise<AddressDetail> {
    const data = await apiRequest<{ address: AddressDetail }>({
        url: "/checkout/address/detail",
        params: { placeId },
    });

    return data.address;
}
