"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getErrorMessage } from "../../lib/errors";
import { loginWithGoogle } from "../../services/authService";
import { mergeGuestCartApi } from "../../services/cartService";
import type { AuthResult } from "../../types/auth";

const GOOGLE_IDENTITY_SCRIPT = "https://accounts.google.com/gsi/client?hl=vi";

interface GoogleSignInButtonProps {
    text?: "signin_with" | "signup_with" | "continue_with" | "signin";
    onLoginSuccess?: (result: AuthResult) => Promise<void> | void;
    onLoginError?: (message: string) => void;
    className?: string;
}

interface GoogleCredentialResponse {
    credential: string;
    select_by?: string;
}

function loadGoogleScript(): Promise<void> {
    if (typeof window === "undefined") return Promise.resolve();
    const google = (window as any).google;
    if (google?.accounts?.id) return Promise.resolve();

    return new Promise((resolve, reject) => {
        const existing = document.querySelector(
            `script[src="${GOOGLE_IDENTITY_SCRIPT}"]`,
        ) as HTMLScriptElement | null;

        if (existing) {
            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener(
                "error",
                () =>
                    reject(
                        new Error(
                            "Không tải được thư viện đăng nhập Google.",
                        ),
                    ),
                { once: true },
            );
            return;
        }

        const script = document.createElement("script");
        script.src = GOOGLE_IDENTITY_SCRIPT;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () =>
            reject(new Error("Không tải được thư viện đăng nhập Google."));
        document.head.appendChild(script);
    });
}

export default function GoogleSignInButton({
    text = "signin_with",
    onLoginSuccess,
    onLoginError,
    className = "",
}: GoogleSignInButtonProps) {
    const buttonRef = useRef<HTMLDivElement | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

    const handleCredentialResponse = useCallback(
        async (response: GoogleCredentialResponse) => {
            if (!response?.credential) {
                const message = "Không nhận được thông tin xác thực từ Google.";
                onLoginError?.(message);
                toast.error(message);
                return;
            }

            setIsLoading(true);
            try {
                const result = await loginWithGoogle({
                    idToken: response.credential,
                });

                try {
                    await mergeGuestCartApi();
                } catch {
                    // Keep login success even if merge cart fails.
                }

                await onLoginSuccess?.(result);
                toast.success("Đăng nhập Google thành công.");
            } catch (error) {
                const message = getErrorMessage(
                    error,
                    "Đăng nhập Google thất bại.",
                );
                onLoginError?.(message);
                toast.error(message);
            } finally {
                setIsLoading(false);
            }
        },
        [onLoginError, onLoginSuccess],
    );

    useEffect(() => {
        let active = true;

        if (!googleClientId) {
            setIsReady(false);
            return undefined;
        }

        const renderGoogleButton = () => {
            const google = (window as any).google;
            if (!active || !buttonRef.current || !google?.accounts?.id) {
                return;
            }

            google.accounts.id.initialize({
                client_id: googleClientId,
                callback: handleCredentialResponse,
                ux_mode: "popup",
                cancel_on_tap_outside: true,
            });

            buttonRef.current.innerHTML = "";
            const width = Math.max(
                220,
                Math.min(
                    400,
                    Math.floor(buttonRef.current.getBoundingClientRect().width),
                ),
            );

            google.accounts.id.renderButton(buttonRef.current, {
                theme: "outline",
                size: "large",
                text,
                shape: "rectangular",
                logo_alignment: "left",
                locale: "vi",
                width,
            });

            setIsReady(true);
        };

        loadGoogleScript()
            .then(renderGoogleButton)
            .catch((error) => {
                const message = getErrorMessage(
                    error,
                    "Không thể khởi tạo đăng nhập Google.",
                );
                onLoginError?.(message);
                toast.error(message);
            });

        return () => {
            active = false;
        };
    }, [googleClientId, handleCredentialResponse, onLoginError, text]);

    if (!googleClientId) {
        return (
            <button
                type="button"
                disabled
                className={`mx-auto h-12 w-full max-w-[400px] rounded-2xl border border-[#FFD4E1] bg-white px-4 text-sm font-semibold text-[#7A6A70] opacity-70 ${className}`}>
                Đăng nhập Google chưa được cấu hình
            </button>
        );
    }

    return (
        <div
            className={`relative mx-auto min-h-12 w-full max-w-[400px] ${className}`}>
            <div
                ref={buttonRef}
                className="h-12 w-full overflow-hidden rounded-2xl"
            />
            {(!isReady || isLoading) && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl border border-[#FFD4E1] bg-white/85 text-sm font-medium text-[#7A6A70]">
                    {isLoading
                        ? "Đang xử lý Google..."
                        : "Đang tải đăng nhập Google..."}
                </div>
            )}
        </div>
    );
}
