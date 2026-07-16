import { apiRequest } from "../lib/apiClient";

export interface ProductReview {
    _id: string;
    userName: string;
    userEmail: string;
    rating: number;
    comment?: string;
    verifiedPurchase?: boolean;
    createdAt?: string;
}

export interface ReviewEligibility {
    canReview: boolean;
    reason: "AUTH_REQUIRED" | "CUSTOMER_REQUIRED" | "REVIEW_ALREADY_EXISTS" | "REVIEW_PURCHASE_REQUIRED" | null;
}

export interface ProductReviewList {
    items: ProductReview[];
    eligibility: ReviewEligibility;
}

export async function addReview(
    productId: string,
    payload: { rating: number; comment: string },
): Promise<{ review: ProductReview; summary: { rating: number; reviewCount: number } }> {
    return apiRequest({
        url: `/reviews/products/${productId}`,
        method: "POST",
        data: payload,
    });
}

export async function fetchReviews(productId: string): Promise<ProductReviewList> {
    return apiRequest<ProductReviewList>({
        url: `/reviews/products/${productId}`,
    });
}
