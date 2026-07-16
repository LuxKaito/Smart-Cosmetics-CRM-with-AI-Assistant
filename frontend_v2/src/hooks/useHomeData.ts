import {
    bestSellers,
    brandShowcase,
    brands,
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
        flashDeals,
        featureIcons,
        homeProducts,
        newsList,
        topSearches,
        topCategories,
    };
}
