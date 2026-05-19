import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MIN_QUERY_LENGTH = 3;
const MAX_RESULTS = 5;
const REQUEST_TIMEOUT_MS = 2500;
const VIETMAP_AUTOCOMPLETE_URL = "https://maps.vietmap.vn/api/autocomplete/v4";
const DEFAULT_FOCUS = "10.776889,106.700806"; // HCM City center

type AddressRecord = Record<string, string>;

type Suggestion = {
    provider: "vietmap";
    placeId: string;
    displayName: string;
    mainText: string;
    secondaryText: string;
    lat: number;
    lon: number;
    address: AddressRecord;
};

const toText = (value: unknown) => {
    if (typeof value === "string") return value.trim();
    if (typeof value === "number") return String(value);
    return "";
};

const pickText = (...values: unknown[]) => {
    for (const value of values) {
        const text = toText(value);
        if (text) return text;
    }
    return "";
};

const toNumber = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const toObject = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
};

const normalizeText = (value: unknown) =>
    toText(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\u0111/g, "d")
        .replace(/\u0110/g, "D")
        .toLowerCase();

const extractHouseNumber = (value: unknown) => {
    const match = toText(value).match(/\b(\d+[a-zA-Z0-9/-]*)\b/);
    return match ? match[1].toLowerCase() : "";
};

const splitDisplayName = (displayName: string) => {
    const parts = displayName
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);

    return {
        mainText: parts[0] || displayName,
        secondaryText: parts.slice(1).join(", "),
    };
};

const getCoordinates = (item: Record<string, unknown>) => {
    const geometry = item.geometry as Record<string, unknown> | undefined;
    const coordinates = Array.isArray(geometry?.coordinates)
        ? (geometry?.coordinates as unknown[])
        : [];

    const lat = toNumber(
        item.lat ??
            item.latitude ??
            (item.location as Record<string, unknown> | undefined)?.lat ??
            coordinates[1],
    );
    const lon = toNumber(
        item.lng ??
            item.lon ??
            item.longitude ??
            (item.location as Record<string, unknown> | undefined)?.lng ??
            (item.location as Record<string, unknown> | undefined)?.lon ??
            coordinates[0],
    );

    return { lat, lon };
};

const mapVietmapItem = (item: Record<string, unknown>, index: number): Suggestion => {
    const properties = toObject(item.properties);
    const source: Record<string, unknown> = {
        ...properties,
        ...item,
    };
    const rawAddress = toObject(source.address);
    const { lat, lon } = getCoordinates(item);
    const displayNameFromAddress = pickText(
        rawAddress.display_name,
        rawAddress.formatted,
        rawAddress.label,
    );
    const displayName = pickText(
        source.display,
        source.description,
        source.full_name,
        source.fullAddress,
        typeof source.address === "string" ? source.address : "",
        displayNameFromAddress,
        source.name,
    );
    const { mainText, secondaryText } = splitDisplayName(displayName);

    const address: AddressRecord = {
        house_number: pickText(
            source.house_number,
            source.housenumber,
            rawAddress.house_number,
        ),
        road: pickText(
            source.street,
            source.road,
            rawAddress.road,
            rawAddress.street,
            source.name,
        ),
        suburb: pickText(
            source.ward,
            source.suburb,
            rawAddress.suburb,
            rawAddress.ward,
            rawAddress.neighbourhood,
        ),
        district: pickText(
            source.district,
            source.county,
            rawAddress.district,
            rawAddress.county,
            rawAddress.city_district,
        ),
        city: pickText(source.city, rawAddress.city, rawAddress.town),
        state: pickText(
            source.state,
            source.province,
            rawAddress.state,
            rawAddress.province,
            rawAddress.region,
        ),
        country: pickText(source.country, rawAddress.country),
        formatted: displayName,
    };

    const fallbackDisplayName = [
        [address.house_number, address.road].filter(Boolean).join(" ").trim(),
        address.suburb,
        address.district || address.city,
        address.state,
        address.country,
    ]
        .filter(Boolean)
        .join(", ");
    const resolvedDisplayName = displayName || fallbackDisplayName;
    const resolvedText = splitDisplayName(resolvedDisplayName);

    const placeId = toText(source.ref_id ?? source.place_id ?? source.id) ||
        `LL:${lat}:${lon}:${index}`;

    return {
        provider: "vietmap",
        placeId,
        displayName: resolvedDisplayName,
        mainText: resolvedText.mainText,
        secondaryText: resolvedText.secondaryText,
        lat,
        lon,
        address,
    };
};

const scoreSuggestion = (query: string, suggestion: Suggestion) => {
    const normalizedQuery = normalizeText(query);
    const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
    const queryHouseNumber = extractHouseNumber(query);
    const suggestionHouseNumber = extractHouseNumber(
        suggestion.address.house_number ||
            suggestion.mainText ||
            suggestion.displayName,
    );
    const normalizedMain = normalizeText(suggestion.mainText);
    const normalizedDisplay = normalizeText(suggestion.displayName);

    let score = 0;

    if (queryHouseNumber && suggestionHouseNumber) {
        score += queryHouseNumber === suggestionHouseNumber ? 100 : 30;
    }
    if (queryHouseNumber && !suggestionHouseNumber) score -= 40;

    const matchedTokens = queryTokens.filter(
        (token) =>
            normalizedMain.includes(token) || normalizedDisplay.includes(token),
    ).length;
    score += matchedTokens * 10;

    if (normalizedMain.startsWith(normalizedQuery)) score += 20;
    if (normalizedDisplay.startsWith(normalizedQuery)) score += 10;
    if (normalizedDisplay.includes(normalizedQuery)) score += 6;

    return score;
};

const dedupeAndRank = (query: string, suggestions: Suggestion[]) => {
    const deduped = new Map<string, Suggestion>();
    for (const suggestion of suggestions) {
        if (!suggestion.placeId) continue;
        const key = `${suggestion.placeId}|${suggestion.lat.toFixed(6)}|${suggestion.lon.toFixed(6)}`;
        if (!deduped.has(key)) deduped.set(key, suggestion);
    }

    return [...deduped.values()]
        .map((item) => ({ item, score: scoreSuggestion(query, item) }))
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.item)
        .slice(0, MAX_RESULTS);
};

const extractItems = (payload: unknown) => {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];

    const dataPayload = payload as Record<string, unknown>;
    const candidates = [
        dataPayload.data,
        dataPayload.results,
        dataPayload.items,
        dataPayload.predictions,
        dataPayload.features,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) return candidate;
    }

    return [];
};

export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get("q")?.trim() || "";
    if (query.length < MIN_QUERY_LENGTH) {
        return NextResponse.json(
            { success: true, data: { suggestions: [] } },
            { status: 200 },
        );
    }

    const apiKey =
        process.env.VIETMAP_API_KEY ||
        process.env.VIETMAP_AUTOCOMPLETE_API_KEY ||
        process.env.NEXT_PUBLIC_VIETMAP_API_KEY ||
        "";
    if (!apiKey) {
        return NextResponse.json(
            {
                success: false,
                message:
                    "VIETMAP_API_KEY chua duoc cau hinh tren frontend_v2/.env",
            },
            { status: 500 },
        );
    }

    const params = new URLSearchParams({
        apikey: apiKey,
        text: query,
        focus: process.env.VIETMAP_AUTOCOMPLETE_FOCUS || DEFAULT_FOCUS,
        limit: String(MAX_RESULTS + 3),
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
        response = await fetch(`${VIETMAP_AUTOCOMPLETE_URL}?${params.toString()}`, {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
        });
    } catch {
        clearTimeout(timeoutId);
        return NextResponse.json(
            { success: true, data: { suggestions: [] } },
            { status: 200 },
        );
    } finally {
        clearTimeout(timeoutId);
    }

    let payload: unknown = null;
    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    if (!response.ok) {
        // Provider fail/limit: do not bubble 502 to UI autocomplete loop.
        return NextResponse.json(
            { success: true, data: { suggestions: [] } },
            { status: 200 },
        );
    }

    const items = extractItems(payload);
    const suggestions = dedupeAndRank(
        query,
        items
            .filter((item): item is Record<string, unknown> => {
                return Boolean(item && typeof item === "object");
            })
            .map((item, index) => mapVietmapItem(item, index))
            .filter((item) => Boolean(item.displayName.trim())),
    );

    return NextResponse.json(
        { success: true, data: { suggestions } },
        { status: 200 },
    );
}
