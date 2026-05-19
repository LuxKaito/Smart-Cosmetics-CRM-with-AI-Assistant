# Smart Cosmetics CRM Backend

Backend monolith for cosmetics ecommerce CRM using Clean Architecture, Express, MongoDB, JWT auth, Google OAuth2, RabbitMQ, and Jest/Supertest.

## Important Changes (May 2026)

1. Removed all mock catalog logic.
2. Removed `ENABLE_MOCK_CATALOG` usage.
3. Removed legacy mock routes:
   - `GET /api/products?limit=36&category=&subcategory=`
   - `GET /api/products/search?q=serum&limit=20`
   - `GET /api/products/:id`
   - `GET /api/categories`
4. Product and category APIs now read from MongoDB only.
5. Added guest cart flow using httpOnly cookie `cart_token` for users without login.
6. Added change password API.
7. Added staff granular permissions API.
8. Added Google login aliases and merge guest cart after Google login.

## Tech Stack

- Node.js, Express.js
- MongoDB, Mongoose
- JWT (access + refresh)
- Google OAuth2 ID Token verification
- RabbitMQ producer/consumer
- Jest + Supertest

## Project Structure

```txt
backend/
├── src/
│   ├── application/
│   ├── config/
│   ├── domain/
│   ├── infrastructure/
│   ├── presentation/
│   ├── scripts/
│   ├── app.js
│   └── server.js
├── tests/
├── data/Hasaki_Data_Clean.xlsx
└── README.md
```

## Environment

Copy `.env.example` to `.env`.

```env
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1
MONGO_URI=mongodb://localhost:27017/smart_cosmetics_crm
JWT_SECRET=replace_with_a_long_random_access_token_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=replace_with_a_long_random_refresh_token_secret
JWT_REFRESH_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_USER_REGISTERED_QUEUE=user.registered
RABBITMQ_PRODUCT_UPDATED_QUEUE=product.updated
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

For Google login end-to-end, use the same Google Web Client ID on frontend (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`).

## Run

```bash
npm install
npm run dev
```

Health check:

```txt
GET http://localhost:5000/health
```

Base prefix:

```txt
/api/v1
```

## Seed Data (MongoDB)

1. Create admin:

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=Admin@123456 npm run seed:admin
```

2. Import products from `data/Hasaki_Data_Clean.xlsx`:

```bash
npm run seed:products
```

3. Insert sample users + carts for API tests (products must exist first):

```bash
npm run seed:samples
```

This script creates/updates:

- customer: `customer1@example.com` / `Customer@123`
- staff: `staff1@example.com` / `Staff@123`
- sample staff permissions: `product:create`, `product:update`
- customer cart with 1 existing product
- guest cart with `guest-demo-0001`

## Standard Response

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

## Roles and Permissions

Role values:

- `user` (customer)
- `staff`
- `admin`

Staff permission keys:

- `dashboard:view`
- `product:create`
- `product:update`
- `product:delete`
- `user:list`
- `user:block`
- `user:assign-role`
- `user:assign-permission`

## Authentication APIs

Public:

```txt
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/google
POST /api/v1/auth/refresh
```

Authenticated:

```txt
POST /api/v1/auth/logout
POST /api/v1/auth/change-password
GET  /api/v1/auth/me
```

Register payload:

```json
{
  "email": "customer1@example.com",
  "password": "Customer@123",
  "name": "Customer Demo"
}
```

Login payload:

```json
{
  "email": "customer1@example.com",
  "password": "Customer@123"
}
```

Google login payload:

```json
{
  "idToken": "google_id_token"
}
```

Notes:

- `idToken` must be generated from Google Identity Services on frontend with the same `GOOGLE_CLIENT_ID` configured in backend.
- Google login now also supports guest cart merge via `cart_token` cookie (same behavior as email/password login).

Use access token:

```txt
Authorization: Bearer <accessToken>
```

## Product APIs (MongoDB)

Public:

```txt
GET /api/v1/products
GET /api/v1/products/search
GET /api/v1/products/:id
GET /api/v1/products/categories
GET /api/v1/products/categories/:category/products
```

Query supported:

- `q` or `search`
- `category`
- `subcategory`
- `brand`
- `skin_type`
- `minPrice`
- `maxPrice`
- `page`, `limit`
- `sort`: `price`, `-price`, `sale_price`, `-sale_price`, `rating`, `-rating`, `createdAt`, `-createdAt`, `soldCount`, `-soldCount`

Admin or authorized staff:

```txt
POST   /api/v1/products
PATCH  /api/v1/products/:id
DELETE /api/v1/products/:id
```

Product detail response includes business fields:

- `product_name_vn`
- `product_name_en`
- `image_url`
- `sale_price`
- `original_price`
- `skin_type`
- `volume`
- `brand`
- `origin`
- `rating`
- `review_count`
- `qa_count`
- `description`

## Cart APIs (Guest + Customer, MongoDB)

User without login:

- call cart APIs normally without Authorization
- backend auto-creates cookie `cart_token` if missing
- cart data is persisted in MongoDB by hashed `cart_token`

Routes:

```txt
GET    /api/v1/cart
POST   /api/v1/cart/items
PATCH  /api/v1/cart/items/:productId
DELETE /api/v1/cart/items/:productId
```

Payload add item:

```json
{
  "productId": "<mongo_product_id>",
  "quantity": 1
}
```

## Admin APIs

```txt
GET   /api/v1/admin/dashboard
GET   /api/v1/admin/users
PATCH /api/v1/admin/users/:id/block
PATCH /api/v1/admin/users/:id/role
PATCH /api/v1/admin/users/:id/permissions
```

Account management supported:

- manage customers (`role=user`)
- manage staff (`role=staff`)
- assign role
- assign granular permissions for staff

## Postman Test Guide

### 1. Register customer

- `POST /api/v1/auth/register`
- response only returns success message, no access token
- verify email from link in mailbox before login

### 2. Login customer

- `POST /api/v1/auth/login`
- save new access token

### 2.1 Login with Google

- `POST /api/v1/auth/google`
- body:

```json
{
  "idToken": "google_id_token"
}
```

### 3. Customer change password

- `POST /api/v1/auth/change-password`
- header: `Authorization: Bearer <accessToken>`
- body:

```json
{
  "currentPassword": "Customer@123",
  "newPassword": "Customer@12345"
}
```

### 4. Product search and detail

- `GET /api/v1/products/search?q=serum&limit=20`
- `GET /api/v1/products/<productId>`
- `GET /api/v1/products/categories`

### 5. Guest cart flow

1. `POST /api/v1/cart/items` with body `{ "productId": "<id>", "quantity": 1 }`
2. Keep the `cart_token` cookie for next requests.
3. Continue guest cart APIs:
   - `GET /api/v1/cart`
   - `PATCH /api/v1/cart/items/<productId>`
   - `DELETE /api/v1/cart/items/<productId>`

### 6. Customer cart flow (logged-in)

- same cart endpoints, but with `Authorization: Bearer <accessToken>`
- no need `x-guest-id`

### 7. Admin/staff permission flow

1. Login admin.
2. `PATCH /api/v1/admin/users/:id/role` body `{ "role": "staff" }`
3. `PATCH /api/v1/admin/users/:id/permissions` body:

```json
{
  "permissions": ["product:create", "product:update"]
}
```

4. Login as staff and test:
   - allowed: create/update product
   - forbidden (403): delete product if `product:delete` not assigned

## RabbitMQ Events

Queues:

- `user.registered`
- `product.updated`

Published when:

- register success
- product create/update/delete success

## Security

- Helmet
- CORS allow-list
- Mongo sanitize
- Input sanitization
- bcrypt password hashing
- Refresh token hash storage + invalidation on logout/password change

## Testing Status

Automated tests executed:

```bash
npm test
```

Result:

- 5 test suites passed
- 6 tests passed

Notes from current local environment during manual runtime check:

- Docker engine is not running in this machine session.
- `mongosh` command is not installed in this machine session.
- Because of that, live Postman calls were documented and prepared, while automated route/service tests were executed successfully.
