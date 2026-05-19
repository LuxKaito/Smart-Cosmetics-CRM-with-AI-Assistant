"use client";

import Link from "next/link";

export default function VerifyOtpPage() {
    return (
        <div className="auth-page">
            <section className="auth-card" aria-label="Xac thuc tai khoan">
                <div className="auth-header">
                    <p className="auth-eyebrow">SMART COSMETICS</p>
                    <h1>Xac thuc tai khoan</h1>
                    <p className="auth-subtitle">
                        He thong hien tai khong yeu cau OTP. Ban co the dang
                        nhap ngay.
                    </p>
                </div>

                <div className="auth-actions">
                    <Link href="/login" className="auth-submit">
                        Den trang dang nhap
                    </Link>
                    <Link href="/" className="auth-secondary-link">
                        Ve trang chu
                    </Link>
                </div>
            </section>
        </div>
    );
}
