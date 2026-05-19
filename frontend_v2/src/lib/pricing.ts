type PriceLike = {
    price?: unknown;
    sale_price?: unknown;
    salePrice?: unknown;
    original_price?: unknown;
    originalPrice?: unknown;
    oldPrice?: unknown;
};

const toNonNegative = (value: unknown, fallback = 0): number => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) return fallback;
    return numeric;
};

const toOptionalPositive = (value: unknown): number | null => {
    if (value === undefined || value === null || value === "") return null;
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return null;
    return numeric;
};

export const getSalePrice = (item: PriceLike, fallback = 0): number =>
    toNonNegative(item?.sale_price ?? item?.salePrice ?? item?.price, fallback);

export const getOriginalPrice = (
    item: PriceLike,
    salePrice = getSalePrice(item),
): number | null => {
    const hasExplicitSale =
        (item?.sale_price !== undefined &&
            item?.sale_price !== null &&
            item?.sale_price !== "") ||
        (item?.salePrice !== undefined &&
            item?.salePrice !== null &&
            item?.salePrice !== "");
    const fallbackOriginalFromPrice =
        hasExplicitSale && toOptionalPositive(item?.price)
            ? toOptionalPositive(item?.price)
            : null;

    const candidates = [
        item?.original_price,
        item?.originalPrice,
        item?.oldPrice,
        fallbackOriginalFromPrice,
    ]
        .map((value) => toOptionalPositive(value))
        .filter((value): value is number => value !== null);

    if (candidates.length === 0) return null;
    const original = Math.max(...candidates);
    return original > salePrice ? original : null;
};

export const getDiscountPercent = (
    item: PriceLike,
    salePrice = getSalePrice(item),
    originalPrice = getOriginalPrice(item, salePrice),
): number => {
    if (!originalPrice || originalPrice <= salePrice) return 0;
    return Math.max(
        0,
        Math.round(((originalPrice - salePrice) / originalPrice) * 100),
    );
};
