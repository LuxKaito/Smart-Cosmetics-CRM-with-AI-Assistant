interface Coupon {
    code: string;
    text: string;
}

export default function CouponRow({ coupons }: { coupons: Coupon[] }) {
    const loopingCoupons = [...coupons, ...coupons];

    return (
        <section className="coupon-section">
            <div className="coupon-marquee">
                <div className="coupon-grid">
                    {loopingCoupons.map((coupon, index) => (
                        <article
                            key={`${coupon.code}-${index}`}
                            className="coupon-card"
                            aria-hidden={index >= coupons.length}>
                            <div className="coupon-tag">
                                <small>Mã giảm</small>
                                <strong>{coupon.code}</strong>
                            </div>
                            <div className="coupon-body">
                                <h3>Nhập mã: {coupon.code}</h3>
                                <p>{coupon.text}</p>
                                <button
                                    type="button"
                                    tabIndex={index >= coupons.length ? -1 : 0}>
                                    Sao chép mã
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
