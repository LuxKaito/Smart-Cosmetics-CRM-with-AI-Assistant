"use client";

import Link from "next/link";

export default function VerifyOtpPage() {
    return (
        <div className="auth-page">
            <section className="auth-card" aria-label="Xác thực tài khoản">
                <div className="auth-header">
                    <p className="auth-eyebrow">SMART COSMETICS</p>
                    <h1>Xác thực tài khoản</h1>
                    <p className="auth-subtitle">
                        Hệ thống hiện tại không yêu cầu OTP. Bạn có thể đăng
                        nhập ngay.
                    </p>
                </div>

                <div className="auth-actions">
                    <Link href="/login" className="auth-submit">
                        Đến trang đăng nhập
                    </Link>
                    <Link href="/" className="auth-secondary-link">
                        Về trang chủ
                    </Link>
                </div>
            </section>
        </div>
    );
}
