import { apiRequest } from "../lib/apiClient";
import type { StaffOverview } from "../types/staff";

export const staffService = {
    async overview(): Promise<StaffOverview> {
        return apiRequest<StaffOverview>({ url: "/staff/overview" });
    },
};

export { staffOrderService } from "./staffOrderService";
export { staffCustomerService } from "./staffCustomerService";
