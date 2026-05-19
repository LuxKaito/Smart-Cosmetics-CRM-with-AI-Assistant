export class ApiError extends Error {
    status?: number;
    data?: unknown;

    constructor(message: string, status?: number, data?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.data = data;
    }
}

export function getErrorMessage(
    error: unknown,
    fallback = "Request failed",
): string {
    if (error instanceof Error) return error.message || fallback;
    return fallback;
}
