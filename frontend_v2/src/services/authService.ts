import { apiRequest } from "../lib/apiClient";
import type {
    AuthPayload,
    AuthResult,
    RegisterPayload,
    ShippingAddress,
    User,
} from "../types/auth";
import { setStoredUser, clearAuthStorage } from "../utils/authStorage";
import { clearCart } from "../utils/cart";
import { useAuthStore } from "../stores/authStore";
import { useCartStore } from "../stores/cartStore";

export async function registerUser(
    payload: RegisterPayload,
): Promise<AuthResult> {
    const data = await apiRequest<AuthResult>({
        url: "/auth/register",
        method: "POST",
        data: payload,
    });

    return data;
}

export async function resendVerificationEmail(payload: {
    email: string;
}): Promise<{ message?: string }> {
    return apiRequest<{ message?: string }>({
        url: "/auth/resend-verification-email",
        method: "POST",
        data: payload,
    });
}

export async function verifyEmailToken(payload: {
    token: string;
}): Promise<{ verified: boolean }> {
    return apiRequest<{ verified: boolean }>({
        url: "/auth/verify-email",
        method: "GET",
        params: { token: payload.token },
    });
}

export async function loginUser(payload: AuthPayload): Promise<AuthResult> {
    const data = await apiRequest<AuthResult>({
        url: "/auth/login",
        method: "POST",
        data: payload,
    });

    if (data?.user) {
        setStoredUser(data.user);
        useAuthStore.getState().setUser(data.user);
    }

    return data;
}

export async function loginWithGoogle(payload: {
    idToken: string;
}): Promise<AuthResult> {
    const data = await apiRequest<AuthResult>({
        url: "/auth/google",
        method: "POST",
        data: payload,
    });

    if (data?.user) {
        setStoredUser(data.user);
        useAuthStore.getState().setUser(data.user);
    }

    return data;
}

export async function fetchMe(): Promise<{ user: User }> {
    const data = await apiRequest<{ user: User }>({ url: "/auth/me" });
    if (data?.user) {
        setStoredUser(data.user);
        useAuthStore.getState().setUser(data.user);
    }
    return data;
}

export async function logoutUser(): Promise<void> {
    clearAuthStorage();
    useAuthStore.getState().clear();
    try {
        await apiRequest<void>({ url: "/auth/logout", method: "POST" });
    } finally {
        clearAuthStorage();
        useAuthStore.getState().clear();
        clearCart();
        useCartStore.getState().reset();
        await useCartStore.getState().refresh();
    }
}

export async function changePassword(payload: {
    currentPassword: string;
    newPassword: string;
}): Promise<void> {
    await apiRequest<void>({
        url: "/auth/change-password",
        method: "POST",
        data: payload,
    });
}

export async function updateProfile(payload: {
    name: string;
    phone?: string;
}): Promise<User> {
    const data = await apiRequest<{ user: User }>({
        url: "/auth/profile",
        method: "PATCH",
        data: payload,
    });
    setStoredUser(data.user);
    useAuthStore.getState().setUser(data.user);
    return data.user;
}

export type ShippingAddressPayload = Omit<
    ShippingAddress,
    "_id" | "createdAt" | "updatedAt"
>;

export async function createShippingAddress(
    payload: ShippingAddressPayload,
): Promise<ShippingAddress[]> {
    const data = await apiRequest<{ addresses: ShippingAddress[] }>({
        url: "/auth/addresses",
        method: "POST",
        data: payload,
    });
    await fetchMe();
    return data.addresses;
}

export async function updateShippingAddress(
    addressId: string,
    payload: Partial<ShippingAddressPayload>,
): Promise<ShippingAddress[]> {
    const data = await apiRequest<{ addresses: ShippingAddress[] }>({
        url: `/auth/addresses/${addressId}`,
        method: "PATCH",
        data: payload,
    });
    await fetchMe();
    return data.addresses;
}

export async function deleteShippingAddress(
    addressId: string,
): Promise<ShippingAddress[]> {
    const data = await apiRequest<{ addresses: ShippingAddress[] }>({
        url: `/auth/addresses/${addressId}`,
        method: "DELETE",
    });
    await fetchMe();
    return data.addresses;
}
