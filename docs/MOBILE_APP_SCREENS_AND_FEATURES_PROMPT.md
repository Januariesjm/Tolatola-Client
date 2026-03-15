# TOLA Tanzania — Mobile app (Android & iOS): Screens and features prompt

Use this prompt to implement the **React Native** Android and iOS apps so they match the **Tolatola-Client** web app. It lists every screen and feature by user story. Create the mobile project **outside** the API and web client (e.g. sibling directory `Tolatola-Mobile`). Use the **same backend API** and **Supabase** auth.

---

## User roles and post-login routing

| `user_type` | After login redirect |
|-------------|----------------------|
| `admin` | Admin dashboard |
| `vendor` | Vendor dashboard |
| `transporter` | Transporter dashboard |
| `customer` (or default) | Shop (buyer home) |

---

## 1. Guest (no login required)

| # | Screen | Route (web) | Purpose |
|---|--------|-------------|---------|
| 1.1 | **Track order – enter code & phone** | `/track` | Form: tracking code + phone → request OTP (public API `POST tracking/request-otp`). On success → Track verify. |
| 1.2 | **Track order – enter OTP** | `/track/verify` | Form: 6-digit OTP. Uses session/stored tracking_code + phone_number. `POST tracking/verify-otp` → receive token → redirect to status. |
| 1.3 | **Track order – status dashboard** | `/track/status?token=...` | GET status by token. Show: order number, tracking code, status badge, timeline (ORDER_RECEIVED → PAYMENT_SECURED → VENDOR_PREPARING → PICKED_UP → IN_TRANSIT → DELIVERED), delivery details (transporter name, masked phone, ETA), optional map. Actions: Contact Support (link to contact), Raise Complaint (navigate to complaint with token + orderId). |
| 1.4 | **Raise complaint** | `/track/complaint?token=...&orderId=...` | Form: reason (dropdown from COMPLAINT_REASON), description, optional photo. `POST tracking/complaint` (FormData: token, order_id, reason, description, photo). On success → navigate to dispute status or back to track status. |
| 1.5 | **Dispute status** | `/disputes/[id]` | GET dispute by id (public or with token as per backend). Show: dispute id, order id, reason, status (UNDER_REVIEW, RESOLVED, REFUNDED), description, timeline. Link back to Track order. |
| 1.6 | **Home (landing)** | `/` | Promotions carousel, categories, featured products. CTA: Shop, Become a Vendor, Become a Transporter. If user is logged in → redirect to `/shop` (or role dashboard). |
| 1.7 | **Shop (browse)** | `/shop` | Product listing with category filter, search, price/sort. Categories from `GET /categories`. Products from `GET /products` (or filtered). Tapping product → Product detail. Tapping shop → Shop detail. |
| 1.8 | **Product detail** | `/product/[id]` | `GET /products/:id`. Image, name, price, description, shop link, Add to cart, Add to favorites (if logged in). |
| 1.9 | **Shop detail** | `/shop/[id]` | `GET /shops/:id`, `GET /shops/:id/products`. Shop info, address, phone, list of products. |
| 1.10 | **About** | `/about` | Static/info. Optional: WebView or in-app content. |
| 1.11 | **Contact** | `/contact` | Contact form / support. Optional: WebView or in-app form. |
| 1.12 | **FAQ** | `/faq` | FAQ accordion. Optional: WebView or in-app. |
| 1.13 | **Terms / Privacy / Return policy** | `/terms`, `/privacy`, `/return-policy` | Legal. Optional: WebView or deep link to website. |

---

## 2. Auth (all users)

| # | Screen | Route (web) | Purpose |
|---|--------|-------------|---------|
| 2.1 | **Login** | `/auth/login` | Email + password. Optional: Google/Facebook OAuth. On success: fetch profile (user_type), redirect by role (admin → `/admin`, vendor → `/vendor/dashboard`, transporter → `/transporter/dashboard`, else → `/shop`). Support `returnUrl` query. |
| 2.2 | **Sign up** | `/auth/sign-up` | Email, password, user type (customer / vendor / transporter). If vendor: vendor type (producer, manufacturer, supplier, wholesaler, retail_trader). Call backend signup; on success → `/auth/sign-up-success` or redirect. Optional: `?userType=vendor` or `?userType=transporter` pre-fill. |
| 2.3 | **Sign up success** | `/auth/sign-up-success` | Success message + link to Login (with optional returnUrl). |
| 2.4 | **Forgot password** | `/auth/forgot-password` | Email → send reset link. |
| 2.5 | **Reset password** | `/auth/reset-password` | New password (with token from email). On success → redirect to login. |
| 2.6 | **Complete profile** | `/auth/complete-profile` | Shown when user has no user_type (e.g. after OAuth). Form: user type (customer/vendor/transporter), if vendor then vendor type. PATCH user + backend profile. Then redirect by role (vendor → vendor dashboard, transporter → transporter dashboard, else → shop). |
| 2.7 | **Email verified** | `/auth/verified` | Post-email-verification message + link to Login. |
| 2.8 | **Auth error** | `/auth/auth-code-error` | OAuth/error message + links to Login / Sign up. |
| 2.9 | **Logout** | `/auth/logout` | Clear Supabase session, optional backend logout, redirect to home. |

---

## 3. Buyer / Customer (logged in, user_type customer or default)

| # | Screen | Route (web) | Purpose |
|---|--------|-------------|---------|
| 3.1 | **Home** | `/` | If logged-in buyer → redirect to `/shop`. So buyer “home” is Shop. |
| 3.2 | **Shop** | `/shop` | Same as guest Shop but with profile; cart/favorites in header. |
| 3.3 | **Product detail** | `/product/[id]` | Same as guest + Add to cart, Favorites (and like-status API if used). |
| 3.4 | **Cart** | `/cart` | Cart from local storage (or sync). List items, quantities, total. Edit quantity, remove. CTA: Checkout. |
| 3.5 | **Checkout** | `/checkout` | Delivery address (Tanzania address form; optional map), phone, payment method (e.g. M-Pesa, Tigo Pesa, card, cash-on-delivery). Create order via API; on success → Payment screen with orderId. |
| 3.6 | **Payment** | `/payment/[orderId]` | Order summary, payment method. If mobile money: phone input, initiate payment (ClickPesa/USSD). If COD: confirm. On payment success: show success message, order number, tracking code, “Track Order” button → `/track`, “My Orders” → `/orders`. **Confirm delivery** action (for delivered orders): `POST /orders/:id/confirm-delivery`. |
| 3.7 | **Orders list** | `/orders` | List user’s orders (from API or Supabase as in web). Each row: order number, status, date. Tap → Order detail. |
| 3.8 | **Order detail** | `/orders/[id]` | Order info, items, status, shipping address, delivery/transporter details. Actions: Track order (→ track flow with code/phone or token), Confirm delivery (if applicable). |
| 3.9 | **Favorites** | `/favorites` | Saved products (from API or local). Remove, Add to cart. |
| 3.10 | **Profile** | `/profile` | Tabbed: Personal Info, KYC, Order history, Transactions, Support tickets, Settings. |
| 3.11 | **Profile – Personal info** | (tab) | GET /profile. Editable: full name, phone, avatar (PATCH /profile with { full_name?, phone? }; POST /profile/avatar with { image } base64/data URL). Read-only: email, user type, address (if shown). |
| 3.12 | **Profile – KYC verification** | (tab) | KYC status (pending/approved/rejected). Upload documents, submit (API as in web). |
| 3.13 | **Profile – Order history** | (tab) | Same as Orders list (user’s orders). |
| 3.14 | **Profile – Transactions** | (tab) | List transactions (wallet/payment history). |
| 3.15 | **Profile – Support tickets** | (tab) | List support tickets; create new. |
| 3.16 | **Profile – Account settings** | (tab) | Account actions (e.g. delete account, change password if backend supports). |
| 3.17 | **Messages** | `/messages` | Conversations list (buyer–vendor). Tap → chat. Optional: voice/video (if in web). |

**Buyer bottom nav (web):** Home, Favorites, Cart (+ Categories sheet). Header: Search, Favorites, Cart, Notifications, Profile menu (Dashboard for vendor/admin, Profile, Orders, Logout).

---

## 4. Vendor (user_type vendor)

| # | Screen | Route (web) | Purpose |
|---|--------|-------------|---------|
| 4.1 | **Vendor dashboard** | `/vendor/dashboard` | Tabs: Overview/Products, Orders, Wallet, Subscription, Shop. Require login + vendor profile; if no shop → prompt Create shop. |
| 4.2 | **Vendor – Overview / Products** | (tab) | Shop summary, product cards (image, name, price, stock, status approved/pending/rejected). Actions: Add product, Edit product, Toggle out of stock, Delete product. |
| 4.3 | **Vendor – Orders** | (tab) | `GET /shops/:shopId/orders`. List orders (new, preparing, ready, completed). Filters/tabs by status. Tap → order detail (vendor view). |
| 4.4 | **Vendor – Wallet** | (tab) | Balance, pending balance, payouts list. Request payout (with payment details e.g. phone). |
| 4.5 | **Vendor – Subscription** | (tab) | `GET /vendors/:id/subscription`, `GET /subscriptions/plans`. Current plan, upgrade/pay (e.g. ClickPesa mobile money). |
| 4.6 | **Vendor – Shop** | (tab) | Shop name, description, address. Button: Edit shop → Shop edit screen. |
| 4.7 | **Create shop** | `/vendor/shop/create` | Form: shop name, description, location/address. Submit → create shop API → dashboard. |
| 4.8 | **Edit shop** | `/vendor/shop/edit` | Form: same as create. Save → update shop API. |
| 4.9 | **Add product** | (modal/dialog) | Form: name, description, price, category (GET /categories), images. Submit → product create API. |
| 4.10 | **Edit product** | (modal/dialog) | Same as add, pre-filled. Update/delete via API. |
| 4.11 | **Vendor registration** | `/vendor/register` | Full vendor signup: business details, TIN, NIDA, business license upload. KYC. On success → login → vendor dashboard or KYC pending. |
| 4.12 | **Vendor KYC pending** | `/vendor/kyc-pending` | Message: “Under review”. Link to dashboard when approved. |
| 4.13 | **Vendor KYC rejected** | `/vendor/kyc-rejected` | Message: rejected; contact support or re-submit. |

---

## 5. Transporter (user_type transporter)

| # | Screen | Route (web) | Purpose |
|---|--------|-------------|---------|
| 5.1 | **Transporter dashboard** | `/transporter/dashboard` | Tabs: Assignments, Payments, Withdrawals, Membership (subscription), Profile. |
| 5.2 | **Transporter – Assignments** | (tab) | List assignments (available, accepted, in transit, completed). Accept assignment, update status (picked up, in transit, delivered). Show shop address, delivery address, customer phone. |
| 5.3 | **Transporter – Payments** | (tab) | Payments list, available vs pending balance. |
| 5.4 | **Transporter – Withdrawals** | (tab) | Request withdrawal (payment method, phone/account). |
| 5.5 | **Transporter – Subscription** | (tab) | `GET /subscriptions/plans?type=transporter`. Current plan, upgrade/pay. |
| 5.6 | **Transporter – Profile** | (tab) | Edit: full name, phone (PATCH /profile only these), address; business name, vehicle type, license plate (transporters API). Avatar upload (profile/avatar or upload-image as in web). |
| 5.7 | **Transporter registration** | `/transporter/register` | Business name, vehicle type, license plate, documents upload. On success → login → transporter dashboard or KYC pending. |
| 5.8 | **Transporter KYC pending** | `/transporter/kyc-pending` | “Under review”. |
| 5.9 | **Transporter KYC rejected** | `/transporter/kyc-rejected` | Rejected message. |
| 5.10 | **Update location** | (in dashboard) | Button: Update my location. Geolocation → `PUT /transporters/me/location` { latitude, longitude }. |

---

## 6. Admin (user_type admin)

| # | Screen | Route (web) | Purpose |
|---|--------|-------------|---------|
| 6.1 | **Admin dashboard** | `/admin` | Tabbed. Require admin role. |
| 6.2 | **Analytics** | (tab) | Stats, charts (orders, revenue, vendors, etc.). |
| 6.3 | **Vendor KYC approval** | (tab) | Pending vendor KYC list. Approve/reject. |
| 6.4 | **Transporter KYC approval** | (tab) | Pending transporter KYC. Approve/reject. |
| 6.5 | **Customer KYC approval** | (tab) | Pending customer KYC. Approve/reject. |
| 6.6 | **Product approval** | (tab) | Pending products. Approve/reject. |
| 6.7 | **Orders management** | (tab) | All orders; filters; view detail. |
| 6.8 | **Transactions** | (tab) | All transactions. |
| 6.9 | **Payout approval** | (tab) | Pending payouts. Approve/reject. |
| 6.10 | **Support tickets** | (tab) | List tickets; respond/close. |
| 6.11 | **Promotions** | (tab) | Create/edit hero promotions (image, title, link, order). Upload image. |
| 6.12 | **Vendor management** | (tab) | List vendors; view/edit/suspend. |
| 6.13 | **Transporter management** | (tab) | List transporters; view/edit. |
| 6.14 | **Customer management** | (tab) | List customers. |
| 6.15 | **Vendor subscriptions** | (tab) | View vendor subscription status. |
| 6.16 | **Admin users** | (tab) | Manage admin roles/users (if permission `manage_admins`). |
| 6.17 | **Admin verify** | `/admin/verify` | Admin role verification (e.g. after invite). |
| 6.18 | **Setup admin** | `/setup/admin` | One-time setup: create first admin (with setup key). |

---

## 7. Shared / global

| # | Feature | Purpose |
|---|---------|---------|
| 7.1 | **Search** | Product search (header or dedicated). Query `GET /products` or search API. |
| 7.2 | **Categories** | List from `GET /categories`. Filter shop by category. |
| 7.3 | **Notifications** | In-app list (and optional push). Mark read. |
| 7.4 | **Language** | Optional: en / sw (or more). Use same i18n keys as web if possible. |
| 7.5 | **Deep links** | Support: tolatola.co/track, tolatola.co/product/:id, tolatola.co/shop/:id, etc. for sharing and web→app. |

---

## 8. API and auth summary (for mobile)

- **Base URL:** Same as web `NEXT_PUBLIC_API_BASE_URL` (e.g. `https://api.tolatola.co/api`).
- **Auth:** Supabase (same project: URL + anon key). Send `Authorization: Bearer <access_token>` (Supabase session) on all authenticated requests.
- **Profile:** `GET /profile` → { profile, editableFields?, readOnlyFields? }. Update: `PATCH /profile` with only `{ full_name?, phone? }`. Avatar: `POST /profile/avatar` with `{ image }` (base64 or data URL).
- **Tracking (guest):** `POST /tracking/request-otp`, `POST /tracking/verify-otp`, `GET /tracking/status?token=...`, `POST /tracking/complaint` (FormData).
- **Disputes:** `GET /disputes/:id`.
- **Cart:** Client-side (AsyncStorage or similar); checkout creates order via API.
- **Payments:** ClickPesa (or same provider as web); mobile money phone input, initiate, poll or webhook for success.

### Products and product images (Android/iOS)

Use these endpoints so product images from the DB are fetched correctly. All URLs are relative to the same **Base URL** above (e.g. `https://api.tolatola.co/api`).

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/products` | List products. Optional query: `category`, `search`, `minPrice`, `maxPrice`, `sortBy`, `userLat`, `userLng`. Response: `{ data: Product[] }`. |
| `GET` | `/products/:id` | Single product. Response: `{ data: Product }`. |
| `GET` | `/shops/:id/products` | Products for a shop. Response: `{ data: Product[] }`. |
| `GET` | `/categories` | Categories (for filters). Response: `{ data: Category[] }`. |

**Image fields on each product (use in this order):**

- `product.images` — array of image URLs. May be `string[]` or `Array<{ url: string }>`.
- `product.image_url` — single primary image URL (fallback).
- `product.primary_image_url` — alternative primary URL (e.g. in order line items).

**Resolving the display image URL on mobile:**

- Primary: `product.images?.[0]` (if string) or `product.images?.[0]?.url` (if object).
- Fallback: `product.image_url` or `product.primary_image_url`.

These values are **full URLs** (e.g. Supabase Storage or CDN). Use them directly in your image component (e.g. React Native `Image` with `source={{ uri: imageUrl }}`). No extra image endpoint is required; the backend returns image URLs in the product payload.

---

## 9. Implementation checklist (by user story)

Use this to tick off screens as you build.

- **Guest:** Track (enter code/phone) → Verify OTP → Status dashboard → Raise complaint → Dispute status. Home, Shop, Product detail, Shop detail. Optional: About, Contact, FAQ, Terms, Privacy.
- **Auth:** Login, Sign up, Sign up success, Forgot password, Reset password, Complete profile, Verified, Auth error, Logout.
- **Buyer:** Shop, Product detail, Cart, Checkout, Payment (with confirm delivery), Orders list, Order detail, Favorites, Profile (all tabs), Messages.
- **Vendor:** Dashboard (all tabs), Create/Edit shop, Add/Edit product, Vendor register, KYC pending/rejected.
- **Transporter:** Dashboard (all tabs), Transporter register, KYC pending/rejected, Update location.
- **Admin:** Dashboard (all tabs), Admin verify, Setup admin.
- **Shared:** Search, Categories, Notifications, Language, Deep links.

---

## 10. Where to create the app

Create the React Native project **outside** the API and web client, e.g.:

```
TolaTola/
├── Tolatola-Client/     # this repo (Next.js)
├── <backend-repo>/
└── Tolatola-Mobile/     # NEW: React Native (Android + iOS)
```

From the parent folder: `npx create-expo-app@latest Tolatola-Mobile` (or `react-native init`). Use this document as the single source of truth for screens and features when building the Android and iOS apps.
