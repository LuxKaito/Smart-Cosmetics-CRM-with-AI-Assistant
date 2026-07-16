# Huong Dan Tich Hop PayOS

Tai lieu nay mo ta cach tich hop thanh toan PayOS cho he thong hien tai trong thu muc `backend/` va `frontend_v2/`.

## 1) Tong quan luong thanh toan

1. Frontend goi API tao don hang: `POST /api/v1/orders` voi `paymentMethod = "PAYOS"`.
2. Backend tao order trang thai `PENDING_PAYMENT`, sau do goi PayOS de tao payment link.
3. Backend tra ve `checkoutUrl` cho frontend.
4. Frontend redirect nguoi dung sang `checkoutUrl` cua PayOS.
5. Sau khi thanh toan:

- PayOS redirect ve backend qua `PAYOS_RETURN_URL` hoac `PAYOS_CANCEL_URL`.
- Backend cap nhat trang thai don hang va redirect ve frontend:
  - thanh cong -> `/checkout/success?orderId=...`
  - that bai/huy -> `/checkout/failed?orderId=...`

6. PayOS goi webhook `POST /api/v1/payments/payos/webhook` de backend xac nhan ket qua thanh toan lan cuoi.

## 2) Bien moi truong bat buoc

Cap nhat file `.env` trong `backend/`:

```env
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key
PAYOS_BASE_URL=https://api-merchant.payos.vn

# Callback tu PayOS ve backend
PAYOS_RETURN_URL=http://localhost:5000/api/v1/payments/payos/return
PAYOS_CANCEL_URL=http://localhost:5000/api/v1/payments/payos/cancel

# Frontend de backend redirect nguoc lai
FRONTEND_BASE_URL=http://localhost:3000
```

Luu y:

- `PAYOS_RETURN_URL` va `PAYOS_CANCEL_URL` phai khai bao dung tren dashboard PayOS.
- Moi truong local can URL public (VD: ngrok/cloudflared) de PayOS webhook goi duoc vao may cua ban.

## 3) Cac API lien quan PayOS (dang co trong code)

### 3.1 Tao don hang + tao link PayOS ngay

`POST /api/v1/orders` (yeu cau auth)

Body mau:

```json
{
  "shippingAddress": {
    "fullName": "Nguyen Van A",
    "phone": "0901234567",
    "province": "Ho Chi Minh",
    "district": "Quan 1",
    "ward": "Ben Nghe",
    "addressLine": "123 Le Loi"
  },
  "paymentMethod": "PAYOS",
  "note": "Giao gio hanh chinh"
}
```

Response data chua:

- `order`
- `checkoutUrl` (URL de redirect sang PayOS)

### 3.2 Tao lai link thanh toan cho don PAYOS

`POST /api/v1/payments/payos/create` (yeu cau auth)

Body:

```json
{
  "orderId": "<mongo_order_id>"
}
```

Dung khi user that bai/huy va bam "thu thanh toan lai".

### 3.3 Webhook tu PayOS

`POST /api/v1/payments/payos/webhook`

- Backend verify chu ky qua `PAYOS_CHECKSUM_KEY`.
- Neu hop le, backend cap nhat trang thai don hang:
  - `PAID` khi thanh cong
  - `FAILED` / `CANCELLED` khi that bai hoac huy

### 3.4 Return/Cancel callback

- `GET /api/v1/payments/payos/return`
- `GET /api/v1/payments/payos/cancel`

Backend se cap nhat order va redirect ve frontend.

## 4) Flow frontend can lam

Trong `frontend_v2/src/app/checkout/page.tsx` da co logic:

1. Goi `createOrder(...)`.
2. Neu `paymentMethod === "PAYOS"` va co `checkoutUrl` -> `window.location.href = checkoutUrl`.
3. PayOS redirect ve backend, backend redirect nguoc lai:

- `/checkout/success` neu thanh cong
- `/checkout/failed` neu that bai/huy

Trang that bai da ho tro goi lai API retry `createPayOSPaymentLink(orderId)`.

## 5) Kiem tra nhanh bang Postman

1. Dang nhap lay `accessToken`.
2. Goi `POST /api/v1/orders` voi `paymentMethod = "PAYOS"`.
3. Copy `checkoutUrl` mo trinh duyet de thanh toan thu.
4. Sau thanh toan, kiem tra:

- `GET /api/v1/orders/:id` -> `paymentStatus`, `orderStatus`
- Redirect trang frontend dung theo ket qua

5. Test retry:

- Goi `POST /api/v1/payments/payos/create` voi `orderId` chua thanh toan thanh cong.

## 6) Che do mock PayOS trong code hien tai

Neu thieu 1 trong 3 bien:

- `PAYOS_CLIENT_ID`
- `PAYOS_API_KEY`
- `PAYOS_CHECKSUM_KEY`

thi backend se chay mock payment link (khong goi that len PayOS). Muc dich de dev local nhanh.

Khuyen nghi:

- UAT/Production: bat buoc set day du key that.
- Local: co the dung mock, nhung can test lai bang key that truoc khi release.

## 7) Checklist truoc khi go-live

1. Da set dung env PayOS va callback URL.
2. Backend public duoc webhook endpoint.
3. Frontend `FRONTEND_BASE_URL` khop domain that.
4. Test day du 3 case:

- thanh toan thanh cong
- huy thanh toan
- thanh toan that bai va retry

5. Xac nhan order status va payment status cap nhat dung tren DB.
