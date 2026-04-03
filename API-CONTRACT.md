## Tolatola Product, Shop & Cart API Contract

This document describes the **canonical JSON shapes and HTTP endpoints** that the Tolatola website currently uses for products, shops, and cart-like state, so the TolatolaMobile app can align with the same data.

Where the live backend deviates from the desired mobile contract, the differences and mapping rules are called out explicitly so mobile and backend teams can converge on a shared contract.

---

## 1. Base configuration

- **Base URL (web)**: `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:4000/api` in development).
- All paths below are **relative to** that base, e.g. `GET /products` is implemented as `GET ${NEXT_PUBLIC_API_BASE_URL}/products`.
- Authenticated requests include `Authorization: Bearer <supabase_access_token>`; anonymous requests omit the header.

---

## 2. Canonical JSON shapes

### 2.1 Product

Canonical logical shape the **mobile app should target**:

- **Product**
  - `id: string` – canonical product ID, used everywhere (web & mobile).
  - `name: string`
  - `price?: number`
  - `description?: string`
  - `image_url?: string | null` – primary image URL (optional convenience field).
  - `images?: (string | { url: string })[] | null` – all images.
  - `primary_image_url?: string | null` – optional alias for the primary image.
  - `shop_id?: string`
  - `location?: string`
  - `moq?: string | number`
  - `delivery_available?: boolean`
  - `is_vendor_verified?: boolean`
  - `currency?: string`
  - `discount?: number`
  - `stock?: number` – used to determine “sold out”.
  - `status?: "active" | "sold_out" | "archived"` – optional status flag if used.
  - `shop?: Shop | null` – optional denormalised shop object.
  - `category?: { id: string; name: string } | null`
  - Additional optional fields used by the web client:
    - `stock_quantity?: number` – current implementation field for inventory.
    - `compare_at_price?: number`
    - `quality_grade?: string`
    - `unit?: string`
    - `distance_km?: number`
    - `sales_count?: number`
    - `sku?: string`

**Current backend/web JSON (what the website actually consumes):**

- `GET /products` and `GET /products/{id}` currently return objects with at least:
  - `id: string`
  - `name: string`
  - `price: number`
  - `description?: string`
  - `image_url?: string | null`
  - `images?: string[] | { url: string }[]`
  - `stock_quantity: number`
  - `shops?: { id: string; name: string; logo_url?: string | null; phone?: string | null; region?: string | null; district?: string | null }`
  - `categories?: { id: string; name: string }`
  - plus optional commercial fields (`compare_at_price`, `quality_grade`, `moq`, `unit`, `delivery_available`, `distance_km`, `sales_count`, `sku`, `created_at`, etc.).

**Mapping notes for mobile:**

- **ID**: `product.id` is already the canonical identifier and is used as `product_id` in cart items on web.
- **Images**:
  - Web supports both `string[]` and `{ url: string }[]` for `images`.
  - Mobile should treat `images` as `(string | { url: string })[]` and resolve the primary image as:
    - `primary_image_url ?? image_url ?? images[0]` (normalised to a string URL).
- **Stock / sold-out**:
  - Current web uses `product.stock_quantity` everywhere.
  - **Canonical rule**: `stock = stock_quantity` and a product is **sold out** when `stock_quantity <= 0`.
  - Recommended backend change: expose both `stock_quantity` (internal) and `stock` (mobile-friendly alias) for a transition period. Until then, mobile should read `stock_quantity` if `stock` is missing.
- **Status / visibility**:
  - Product listing logic only shows approved/active rows (via database filters), so hidden or rejected products are effectively filtered out server-side.
  - If a JSON `status` field is introduced, both web and mobile should treat `"archived"` as hidden and `"sold_out"` as not orderable.

### 2.2 Shop

- **Shop**
  - `id: string`
  - `name: string`
  - `description?: string`
  - `address?: string`
  - `phone?: string`
  - Additional optional fields used on web:
    - `email?: string`
    - `logo_url?: string`
    - `region?: string`
    - `district?: string`

**Current backend/web JSON (what the website actually consumes):**

- `GET /shops/{id}` returns:
  - `id: string`
  - `name: string`
  - `description?: string`
  - `address?: string`
  - `phone?: string`
  - `email?: string`
  - `logo_url?: string | null`
  - `region?: string`
  - `district?: string`
  - other optional internal metadata.

### 2.3 CartItem

The website **currently keeps the cart entirely client-side in `localStorage`** and does **not** call any cart HTTP endpoints yet. The in-browser JSON shape is:

- **CartItem (web localStorage shape)**
  - `product_id: string`
  - `quantity: number`
  - `product: Product` – snapshot of the product at the time of adding to cart, including:
    - `product.id`
    - `product.name`
    - `product.price`
    - `product.images` (string URLs)
    - `product.stock_quantity`
    - `product.shops` (denormalised shop in some cases)
    - `product.categories` (optional)

**Canonical cart contract (recommended for shared backend route):**

Backend and mobile teams should standardise on:

- **CartItem (API)**
  - `id: string` – cart line item ID.
  - `product_id: string`
  - `quantity: number`
  - `product?: Product` – optional embedded product for display.

---

## 3. HTTP endpoints in use

All endpoints are relative to `APP_API_URL + "/api"` on mobile and `NEXT_PUBLIC_API_BASE_URL` on web. The following are **actually used by the website today** for products and shops:

### 3.1 Products

- **List products**
  - **Method**: `GET`
  - **URL (web)**: `/products`
  - **Web response handling**:
    - Expected shape: `{ data: Product[] }` **or** raw `Product[]`.
    - The web code treats the response as `{ data: any[] }` and falls back to `[]` if missing.
  - **Supported query params** (all optional):
    - `category: string` – category ID.
    - `search: string` – search term.
    - `minPrice: number`
    - `maxPrice: number`
    - `userLat: number` – user latitude for distance-based sorting.
    - `userLng: number` – user longitude.
    - `sortBy: "closest"` – priority sorting by proximity when present.

- **Get single product**
  - **Method**: `GET`
  - **URL (web)**: `/products/{id}`
  - **Web response handling**:
    - Expected shape: `{ data: Product }` **or** raw `Product`.
    - Product detail page extracts `productRes.data` and treats missing `data` as `null`.
  - **Related endpoints:**
    - `GET /products/{id}/reviews` → `{ data: Review[] }` (website only; mobile can ignore or adopt later).
    - `GET /products/{id}/like-status` → `{ liked: boolean }` (website only for favorites).

### 3.2 Shops

- **Get shop detail**
  - **Method**: `GET`
  - **URL (web)**: `/shops/{id}`
  - **Web response handling**:
    - Expected shape: `{ shop: Shop }`.
    - If `shop` is `null` or missing, the page returns 404.

- **Get products for a shop**
  - **Method**: `GET`
  - **URL (web)**: `/shops/{id}/products`
  - **Web response handling**:
    - Expected shape: `{ data: Product[] }` **or** raw `Product[]`.

### 3.3 Categories

- **List categories**
  - **Method**: `GET`
  - **URL (web)**: `/categories`
  - **Web response handling**:
    - Expected shape: `{ data: { id: string; name: string; slug?: string }[] }`.
    - The web client also expects a `slug` on categories to support URL-based filtering.

### 3.4 Cart (current + recommended)

**Current state (website):**

- The website **does not** call any backend cart endpoints.
- Cart operations are handled via `localStorage`:
  - Add/update/remove items via:
    - `components/shop/shop-content.tsx`
    - `components/shop/shop-detail-content.tsx`
    - `components/home/home-products-section.tsx`
    - `components/product/product-detail-content.tsx`
    - `components/cart/cart-content.tsx`
    - `components/layout/cart-popover.tsx`
  - Event `window.dispatchEvent(new Event("cartUpdated"))` is emitted whenever cart contents change.

**Recommended canonical cart API (for both web & mobile):**

These routes match the mobile app expectations and should be implemented once the backend is ready. The website can then migrate from `localStorage` to these endpoints.

- `GET /cart` → `{ items: CartItem[] }`
- `POST /cart/items` → body `{ product_id: string; quantity: number }`
- `DELETE /cart/items/{id}`
- `POST /cart/items/{id}/quantity` → body `{ quantity: number }`
- `DELETE /cart`

**Error handling recommendation when adding to cart or creating orders:**

- On stock issues, backend should respond with:
  - `409 Conflict` and body like `{ code: "OUT_OF_STOCK", message: "This item is sold out." }`.
  - Both web and mobile can show the same user-facing message based on this error.

---

## 4. Sold-out and availability rules

### 4.1 Web behaviour today

Across the website, **sold-out** is determined by the `stock_quantity` field:

- **Product cards & grids**:
  - Products show a “Sold Out” ribbon and the primary action button is disabled when `product.stock_quantity === 0`.
- **Product detail page**:
  - The quantity selector is capped at `product.stock_quantity`.
  - The “Add to Cart / Initiate Purchase” button is disabled and shows a sold-out message when `product.stock_quantity === 0`.
- **Cart & Cart popover**:
  - Quantity increment buttons are disabled when `item.quantity >= item.product.stock_quantity`.

**Canonical rule (for both web & mobile):**

- A product is **available** when `stock_quantity > 0` (or equivalently `stock > 0` once that alias exists).
- A product is **sold out** when `stock_quantity <= 0` (or `stock <= 0`).

If a `status` field is present, then:

- `status === "sold_out"` implies `stock === 0`.
- `status === "archived"` means the product should not be listed in `/products` or `/shops/{id}/products`.

---

## 5. Alignment guidance for TolatolaMobile

To ensure the mobile app and website show **exactly the same products, prices, availability, and sold-out states**, the mobile app should:

- Use the **same endpoints** as listed here:
  - `GET /products`
  - `GET /products/{id}`
  - `GET /shops/{id}`
  - `GET /shops/{id}/products`
  - `GET /categories`
  - (Cart routes once implemented).
- Accept both wrapped and raw responses:
  - `{ data: Product[] }` **or** `Product[]` for lists.
  - `{ data: Product }` **or** `Product` for single objects.
- Treat `stock_quantity` as the source of truth for stock until the backend exposes a dedicated `stock` alias field.
- Use the same sold-out rule as the website:
  - Sold out if `stock <= 0` or `stock_quantity <= 0`.
- Resolve primary images exactly as the website does:
  - Prefer `images[0].url`, fall back to `images[0]` when it is a string, then `image_url`, then `/logo-new.png` or a similar placeholder.

---

## 6. Follow-up / implementation notes

- **Backend team**:
  - Ensure the REST API at `APP_API_URL + "/api"` exports `Product`, `Shop`, and `CartItem` shapes consistent with this document.
  - Prefer adding a `stock` alias in responses where `stock_quantity` is currently used, to exactly match the mobile contract.
  - Implement the shared cart routes listed in section 3.4 if they do not yet exist.
- **Mobile team**:
  - Point TolatolaMobile’s `APP_API_URL` at the same backend base URL as `NEXT_PUBLIC_API_BASE_URL` for the website.
  - Use the endpoints and fields documented here, preferring `stock` but falling back to `stock_quantity` when necessary during migration.

