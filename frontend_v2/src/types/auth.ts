export type UserRole = "admin" | "staff" | "customer";

export interface ShippingAddress {
    _id: string;
    label: string;
    fullName: string;
    phone: string;
    province: string;
    district: string;
    ward: string;
    addressLine: string;
    isDefault?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface User {
    _id?: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    phone?: string;
    shippingAddresses?: ShippingAddress[];
    savedProductIds?: string[];
    role?: UserRole;
    department?: "sales" | "warehouse" | "support" | "marketing" | "";
    permissions?: string[];
    isBlocked?: boolean;
    emailVerified?: boolean;
    createdAt?: string;
    lastLoginAt?: string;
}

export interface AuthPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    email: string;
    password: string;
    name: string;
}

export interface AuthResult {
    user?: User;
    message?: string;
    mergedFromGuest?: boolean;
}
