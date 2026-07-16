export const cleanStaffQuery = <T extends object>(query: T) =>
    Object.fromEntries(
        Object.entries(query as Record<string, unknown>).filter(
            ([, value]) =>
                value !== undefined &&
                value !== null &&
                value !== "" &&
                !(typeof value === "number" && Number.isNaN(value)),
        ),
    );

export const normalizeStaffPagination = (pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
}) => ({
    page: Number(pagination?.page || 1),
    limit: Number(pagination?.limit || 10),
    total: Number(pagination?.total || 0),
    pages: Number(pagination?.pages || 1),
});
