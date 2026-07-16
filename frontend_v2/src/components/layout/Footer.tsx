import Link from "next/link";

export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="container footer-grid">
                <section>
                    <h3>LuxBerry Beauty</h3>
                    <p>
                        Mỹ phẩm chính hãng, tư vấn theo tình trạng da và giao
                        nhanh toàn quốc.
                    </p>
                    <p>
                        225 Đ. Phạm Văn Chiêu, An Hội Tây, Hồ Chí Minh, Vietnam
                    </p>
                    <p>Hotline: 19006750</p>
                    <p>Email: support@luxberry.vn</p>
                </section>

                <section>
                    <h3>Chăm sóc khách hàng</h3>
                    <ul>
                        <li>
                            <Link href="/chinh-sach-doi-tra">
                                Chính sách đổi trả
                            </Link>
                        </li>
                        <li>
                            <Link href="/he-thong-cua-hang">
                                Hệ thống cửa hàng
                            </Link>
                        </li>
                        <li>
                            <Link href="/products">Sản phẩm LuxBerry</Link>
                        </li>
                    </ul>
                </section>

                <section>
                    <h3>Góc làm đẹp</h3>
                    <ul>
                        <li>
                            <Link href="/review-my-pham">Review mỹ phẩm</Link>
                        </li>
                        <li>
                            <Link href="/tin-tuc-luxberry">
                                Tin tức LuxBerry
                            </Link>
                        </li>
                        <li>
                            <Link href="/account/orders">Đơn hàng của tôi</Link>
                        </li>
                    </ul>
                </section>

                <section>
                    <h3>Nhận tin ưu đãi</h3>
                    <p>
                        Cập nhật routine mới, voucher và sản phẩm phù hợp với
                        bạn.
                    </p>
                    <div className="newsletter">
                        <input type="email" placeholder="Nhập địa chỉ email" />
                        <button type="button">Đăng ký</button>
                    </div>
                </section>
            </div>
            <p className="copyright container">
                © 2026 LuxBerry Beauty. All rights reserved.
            </p>
        </footer>
    );
}
