export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <section>
          <h3>TK Beauty</h3>
          <p>Mỹ phẩm chính hãng, tư vấn theo tình trạng da và giao nhanh toàn quốc.</p>
          <p>150/8 Nguyễn Duy Cung, Phường 12, TP.HCM</p>
          <p>Hotline: 19006750</p>
          <p>Email: support@tkbeauty.vn</p>
        </section>

        <section>
          <h3>Mua sắm</h3>
          <ul>
            <li>Chăm sóc da</li>
            <li>Trang điểm</li>
            <li>Nước hoa</li>
            <li>Thiết bị làm đẹp</li>
          </ul>
        </section>

        <section>
          <h3>Hỗ trợ</h3>
          <ul>
            <li>Hướng dẫn đặt hàng</li>
            <li>Chính sách giao hàng</li>
            <li>Chính sách đổi trả</li>
            <li>Bảo mật thông tin</li>
          </ul>
        </section>

        <section>
          <h3>Nhận tin ưu đãi</h3>
          <p>Cập nhật routine mới, voucher và sản phẩm phù hợp với bạn.</p>
          <div className="newsletter">
            <input type="email" placeholder="Nhập địa chỉ email" />
            <button type="button">Đăng ký</button>
          </div>
        </section>
      </div>
      <p className="copyright container">© 2026 TK Beauty. All rights reserved.</p>
    </footer>
  );
}
