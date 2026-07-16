# Smart Cosmetics Commerce Backend

Backend API for the LuxBerry cosmetics ecommerce platform. It uses Clean
Architecture-style layering with Express, MongoDB, JWT authentication, Google
OAuth, guest carts, PayOS payments, RabbitMQ events, and Jest/Supertest tests.

> CRM note: this backend currently supports ecommerce operations plus admin and
> staff sales management. A full CRM module for lead pipelines, support tickets,
> campaigns, segmentation, and lifecycle automation is not implemented yet.

## What This Backend Provides

- Customer auth: register, verify email, login, Google login, refresh token,
  logout, profile, shipping addresses, password change, and favorite products.
- Product catalog backed by MongoDB only, with Excel import from
  `data/Hasaki_Data_Final.xlsx`.
- Guest and authenticated customer carts using an httpOnly `cart_token` cookie.
- Checkout summary, order creation, customer order history, order detail, and
  customer cancellation.
- PayOS payment-link creation, webhook, return, and cancel handlers.
- Review creation with verified-purchase rules.
- Voucher listing, saving, and admin voucher management.
- Admin operations for dashboard overview, statistics, products, users, roles,
  blocking users, and vouchers.
- Staff sales workspace for order and customer operations.
- RabbitMQ events for auth, cart, order, payment, and product changes.
- Shared MongoDB product collection for `../RAG_LANGCHAIN_V4`.

## Tech Stack

- Node.js, Express.js
- MongoDB, Mongoose
- JWT access and refresh tokens
- Google OAuth2 ID token verification
- PayOS payment integration
- RabbitMQ producer/consumer
- Helmet, CORS allow-list, Mongo sanitize, input sanitization
- Jest + Supertest

## Project Structure

```txt
backend/
├── src/
│   ├── application/       # DTOs and use-case services
│   ├── config/            # env, database, dependency container
│   ├── domain/            # entities and repository contracts
│   ├── infrastructure/    # MongoDB, RabbitMQ, PayOS, Google OAuth, email
│   ├── presentation/      # routes, controllers, middlewares
│   ├── scripts/           # seed/import/admin helper scripts
│   ├── app.js
│   └── server.js
├── tests/
│   ├── api/
│   └── unit/
├── data/Hasaki_Data_Final.xlsx
├── docker-compose.yml
└── README.md
```

## Environment

Copy `.env.example` to `.env` before running.

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Important groups in `.env`:

```env
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1
FRONTEND_BASE_URL=http://localhost:3000

MONGO_URI=mongodb://mongo:27017/smart_cosmetics_crm

JWT_SECRET=replace_with_a_long_random_access_token_secret
JWT_REFRESH_SECRET=replace_with_a_long_random_refresh_token_secret
EMAIL_VERIFICATION_TOKEN_TTL_MINUTES=60
GUEST_CART_COOKIE_NAME=cart_token
GUEST_CART_TTL_DAYS=30

GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key
PAYOS_RETURN_URL=http://localhost:5000/api/v1/payments/payos/return
PAYOS_CANCEL_URL=http://localhost:5000/api/v1/payments/payos/cancel

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM=no-reply@luxberry.vn

RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

When running outside Docker, change MongoDB and RabbitMQ hosts to localhost, for
example `mongodb://localhost:27017/smart_cosmetics_crm` and
`amqp://guest:guest@localhost:5672`.

For Google login end-to-end, use the same Google Web Client ID in the frontend
environment variable `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

## Run With Docker

```bash
docker compose up -d --build
```

Services:

| Service | URL |
|---|---|
| Backend API | `http://localhost:5000` |
| Health check | `http://localhost:5000/health` |
| MongoDB | `localhost:27017` |
| Mongo Express | `http://localhost:8081` |
| RabbitMQ AMQP | `localhost:5672` |
| RabbitMQ Management | `http://localhost:15672` |

Seed products after the containers are up:

```bash
docker compose exec backend npm run seed:products
docker compose exec backend npm run seed:admin
```

## Run Locally

Start MongoDB and RabbitMQ separately, update `.env` to use localhost hosts,
then run:

```bash
npm install
npm run dev
```

Production-style start:

```bash
npm start
```

## Scripts

```bash
npm run dev                 # nodemon src/server.js
npm start                   # node src/server.js
npm run seed:products       # import data/Hasaki_Data_Final.xlsx
npm run seed:admin          # seed admin data from env/defaults
npm run seed:samples        # sample customers, staff, carts, orders
npm run seed:clear-catalog  # clear imported catalog data
npm test                    # jest --runInBand
npm run test:watch
```

`seed:samples` expects products to exist first.

## Standard Response Shape

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Errors use the same response helper with localized message support where
implemented.

## Roles

- `customer`
- `staff`
- `admin`

Admin routes require `admin`. Staff routes require `staff`. Customer order,
checkout, address, favorite, voucher-save, review-create, and PayOS create flows
require an authenticated user.

## Main API Prefix

```txt
/api/v1
```

## Authentication APIs

Public:

```txt
POST /api/v1/auth/register
GET  /api/v1/auth/verify-email
POST /api/v1/auth/resend-verification-email
POST /api/v1/auth/login
POST /api/v1/auth/google
POST /api/v1/auth/refresh
```

Authenticated:

```txt
POST   /api/v1/auth/logout
POST   /api/v1/auth/change-password
PATCH  /api/v1/auth/profile
POST   /api/v1/auth/addresses
PATCH  /api/v1/auth/addresses/:addressId
DELETE /api/v1/auth/addresses/:addressId
GET    /api/v1/auth/favorites
POST   /api/v1/auth/favorites/:productId
DELETE /api/v1/auth/favorites/:productId
GET    /api/v1/auth/me
```

Use access tokens as:

```txt
Authorization: Bearer <accessToken>
```

## Product APIs

Public:

```txt
GET /api/v1/products
GET /api/v1/products/search
GET /api/v1/products/categories
GET /api/v1/products/categories/:category/products
GET /api/v1/products/slug/:slug
GET /api/v1/products/:slug
```

Supported query fields include:

- `q` or `search`
- `category`
- `subcategory`
- `brand`
- `skin_type`
- `minPrice`
- `maxPrice`
- `page`, `limit`
- `sort`: `sale_price`, `-sale_price`, `rating`, `-rating`, `createdAt`,
  `-createdAt`, `soldCount`, `-soldCount`

Admin-only product write APIs:

```txt
POST   /api/v1/products
PATCH  /api/v1/products/:id
DELETE /api/v1/products/:id
```

Product writes support uploaded product images through `multer`; uploaded files
are exposed under `/uploads/products/...`.

Important product fields:

- `product_name_vn`
- `product_name_en`
- `image_url`
- `images`
- `sale_price`
- `original_price`
- `discount_percent`
- `brand`
- `origin`
- `skin_type`
- `volume`
- `rating`
- `review_count`
- `qa_count`
- `description`
- `category_level_1`
- `category_level_2`
- `benefits`
- `product_type`
- `ingredients`
- `usage_instructions`

Public product responses also include compatibility aliases such as `category`,
`subcategory`, `categories`, `name`, and `usageInstructions`.

## Cart APIs

Guest users can call cart APIs without Authorization. The backend creates an
httpOnly `cart_token` cookie and persists the guest cart by a hashed token.

Routes:

```txt
GET    /api/v1/cart
POST   /api/v1/cart/items
PATCH  /api/v1/cart/items/:productId
DELETE /api/v1/cart/items/:productId
DELETE /api/v1/cart/clear
POST   /api/v1/cart/merge
```

`POST /api/v1/cart/merge` requires login and merges a guest cart into the user
cart.

## Checkout, Orders, and Payments

Checkout:

```txt
GET /api/v1/checkout/summary
```

Orders:

```txt
POST  /api/v1/orders
GET   /api/v1/orders/my
GET   /api/v1/orders/:id
PATCH /api/v1/orders/:id/cancel
```

PayOS:

```txt
POST /api/v1/payments/payos/create
POST /api/v1/payments/payos/webhook
GET  /api/v1/payments/payos/return
GET  /api/v1/payments/payos/cancel
```

`return` and `cancel` may redirect to frontend URLs when the payment service
returns a redirect target.

## Voucher APIs

Public/customer:

```txt
GET  /api/v1/vouchers
GET  /api/v1/vouchers/my
POST /api/v1/vouchers/:code/save
```

Admin voucher APIs are listed in the Admin section.

## Review APIs

```txt
GET  /api/v1/reviews/products/:productId
POST /api/v1/reviews/products/:productId
```

Creating a review requires an authenticated customer account. The backend
accepts one review per customer and product, and only after a delivered order
contains that product. Product `rating` and `review_count` are recalculated
after creation.

## Admin APIs

```txt
GET    /api/v1/admin/overview
GET    /api/v1/admin/statistics
GET    /api/v1/admin/products
POST   /api/v1/admin/products
PATCH  /api/v1/admin/products/:id
DELETE /api/v1/admin/products/:id
GET    /api/v1/admin/users
POST   /api/v1/admin/users
PATCH  /api/v1/admin/users/:id
PATCH  /api/v1/admin/users/:id/block
PATCH  /api/v1/admin/users/:id/role
GET    /api/v1/admin/vouchers
POST   /api/v1/admin/vouchers
PATCH  /api/v1/admin/vouchers/:id
DELETE /api/v1/admin/vouchers/:id
```

Admin user management supports creating staff/customer accounts, updating user
profile fields, assigning roles, and blocking/unblocking users.

## Staff Sales APIs

```txt
GET   /api/v1/staff/overview
GET   /api/v1/staff/orders
GET   /api/v1/staff/orders/:id
PATCH /api/v1/staff/orders/:id/status
PATCH /api/v1/staff/orders/:id/confirm
PATCH /api/v1/staff/orders/:id/cancel
GET   /api/v1/staff/customers
GET   /api/v1/staff/customers/:id
GET   /api/v1/staff/customers/:id/orders
```

The older `/api/v1/admin/orders*` and `/api/v1/admin/customers*` routes are not
exposed; staff sales operations live under `/api/v1/staff`.

## RabbitMQ Events

Queues are configured through `.env` and asserted on startup:

- `user.registered`
- `email.verification.requested`
- `user.email.verified`
- `cart.merged`
- `order.created`
- `order.cancelled`
- `payment.pending`
- `payment.success`
- `payment.failed`
- `product.created`
- `product.updated`
- `product.deleted`

If RabbitMQ is unavailable during startup, the API continues running and logs a
warning, but async messaging and email dispatch will not be available until the
queue service is reachable.

## Shared MongoDB for RAG

`../RAG_LANGCHAIN_V4` reads the same `smart_cosmetics_crm.products` collection.
Start this backend Compose stack first so it creates
`cosmetics_shared_network`, import products, then start the RAG Compose stack:

```bash
cd backend
docker compose up -d --build
docker compose exec backend npm run seed:products

cd ../RAG_LANGCHAIN_V4
docker compose up -d --build
docker compose exec app uv run python scripts/build_embeddings.py
```

The runtime chat path does not read the Excel file directly; it reads MongoDB
and Qdrant after the import/reindex pipeline.

## Testing

Run the backend test suite:

```bash
npm test
```

Current test folders:

- `tests/api`
- `tests/unit`

The test command is intentionally documented without a fixed pass count so the
README does not go stale when new tests are added.

## Related Docs

- Admin guide: [`HD_Admin.md`](HD_Admin.md)
- PayOS integration: [`HD_TichHop_PayOS.md`](HD_TichHop_PayOS.md)
- Map/location integration: [`huongdan_tichhop_map.md`](huongdan_tichhop_map.md)
- Feature notes: [`chucnang.md`](chucnang.md)

## Security Notes

- Do not commit real `.env` secrets.
- Rotate JWT, Google OAuth, PayOS, SMTP, and database credentials before
  deployment.
- Keep MongoDB, RabbitMQ, and admin dashboards behind private networking in
  production.
