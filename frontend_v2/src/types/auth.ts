export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export type UserRole = "admin" | "user";

export interface User {
    _id?: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    isBlocked?: boolean;
    emailVerified?: boolean;
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
    tokens?: AuthTokens;
    message?: string;
    mergedFromGuest?: boolean;
}
