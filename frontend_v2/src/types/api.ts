export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}
