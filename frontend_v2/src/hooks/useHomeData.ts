import {
    bestSellers,
    brandShowcase,
    brands,
    coupons,
    flashDeals,
    featureIcons,
    homeProducts,
    newsList,
    topSearches,
    topCategories,
} from "../data/homeData";

export function useHomeData() {
    return {
        bestSellers,
        brands,
        brandShowcase,
        coupons,
        flashDeals,
        featureIcons,
        homeProducts,
        newsList,
        topSearches,
        topCategories,
    };
}
