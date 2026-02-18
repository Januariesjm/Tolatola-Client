# Backend Implementation & Verification Prompt (Tolatola Marketplace)

Use this prompt in your **backend** repo (or with your backend AI) to implement and verify all APIs, escrow logic, SMS, OTP, and admin flows that the frontend expects. The frontend (Tolatola-Client) is already built against these contracts.

---

## 1. Database schema

Implement or align your schema with the following.

### Orders
- `id` (uuid, PK)
- `order_number` (unique, format: **TOLA-YYYY-XXXXXXXX** e.g. TOLA-2025-00001A2B)
- `tracking_code` (unique, format: **TDX-XXXXX-XXXX** e.g. TDX-12345-6789)
- `customer_id`, `status`, `payment_status`, `escrow_status`, `total_amount`, `delivery_fee`, `subtotal`, `shipping_address` (jsonb), `payment_method`, `transport_method_id`, `clickpesa_transaction_id`, `paid_at`, `created_at`, `updated_at`
- **Order status enum:** `ORDER_RECEIVED` | `PAYMENT_SECURED` | `VENDOR_PREPARING` | `PICKED_UP` | `IN_TRANSIT` | `DELIVERED` (map from existing statuses if you use different names)

### Escrows
- `id`, `order_id`, `shop_id`, `amount`, `status`, `created_at`, `updated_at`
- **Escrow status enum:** `HELD` | `FROZEN` | `RELEASED` | `REFUNDED`

### Trackings (for public track-by-code flow)
- `id`, `order_id`, `tracking_code` (unique), `phone_number` (indexed for lookup), `created_at`

### OTPs (for tracking verification)
- `id`, `tracking_code`, `phone_number`, `otp_hash` (store bcrypt/hash only, never plain OTP), `expires_at`, `attempt_count`, `created_at`
- Expiry: **5 minutes**. Max **5 attempts** per (tracking_code, phone_number) before requiring a new OTP.

### Tracking sessions (after OTP verify)
- `id`, `token` (uuid or secure random), `order_id`, `phone_number`, `expires_at`, `created_at`
- Token expiry: e.g. 24 hours for viewing status.

### Disputes
- `id`, `dispute_id` (unique, format: **DSP-YYYY-XXXXX**), `order_id`, `customer_id`, `reason` (e.g. Damaged, Not Delivered, Wrong Item), `description`, `photo_url` (optional), `status`, `created_at`, `updated_at`
- **Dispute status enum:** `UNDER_REVIEW` | `RESOLVED` | `REFUNDED`
- **Timeline/audit:** store status change events (action, at timestamp) for dispute timeline.

### Vendors / Shops / Transporters
- Existing tables; ensure orders can be joined to shops (via order_items.shop_id), and to transporter_assignments (transporter_id, order_id, status: assigned | accepted | picked_up | in_transit | delivered).

---

## 2. API routes the frontend calls

Implement these endpoints so the client works without changes.

### Payment success & webhook
- **On payment success (e.g. ClickPesa webhook):**
  1. Set `payment_status = 'ESCROW_HELD'` (or `paid` and ensure escrow is HELD).
  2. Set order `status` to your equivalent of `PAYMENT_SECURED` (e.g. `confirmed` or `ORDER_RECEIVED` → `PAYMENT_SECURED`).
  3. Generate and persist `tracking_code` (format TDX-XXXXX-XXXX) and ensure `order_number` is TOLA-YYYY-XXXXXXXX.
  4. Create/update escrow rows for the order with `status = 'HELD'`.
  5. **Send SMS to customer** with: tracking link (e.g. `https://tolatola.co/track`), order number, tracking code.

### Tracking (public, no auth)

- **POST /api/tracking/request-otp**  
  Body: `{ "tracking_code": "TDX-12345-6789", "phone_number": "+255712345678" }`  
  - Validate tracking code exists and phone number matches the order’s shipping/customer phone (normalize format).
  - Rate limit by IP and by (tracking_code, phone) (e.g. 1 request per 60s per pair).
  - Generate 6-digit OTP, store **hashed** OTP with `expires_at = now + 5 minutes`, reset attempt_count.
  - Send OTP via SMS.
  - Response: `{ "success": true, "message": "OTP sent" }` or 400 with error (e.g. "Tracking code not found" / "Phone does not match order").

- **POST /api/tracking/verify-otp**  
  Body: `{ "tracking_code": "...", "phone_number": "...", "otp": "123456" }`  
  - Find OTP record by tracking_code + phone_number, check not expired, increment attempt_count.
  - If attempt_count > 5: return 400 "Max attempts exceeded".
  - Verify OTP hash; if invalid return 400 "Invalid or expired code".
  - On success: create tracking session (token, order_id, phone, expiry), return `{ "success": true, "token": "<session_token>" }`.

- **GET /api/tracking/status?token=<session_token>**  
  - Public; no auth. Validate token and expiry.
  - Return order tracking payload expected by frontend:
    ```json
    {
      "data": {
        "order": {
          "id": "...",
          "order_number": "TOLA-2025-00001A2B",
          "tracking_code": "TDX-12345-6789",
          "status": "IN_TRANSIT",
          "payment_status": "ESCROW_HELD",
          "escrow_status": "HELD",
          "estimated_arrival": "2025-02-20T14:00:00Z",
          "shipping_address": { ... }
        },
        "transporter": {
          "name": "Driver Name",
          "phone_masked": "+2547****123"
        },
        "timeline": [
          { "status": "ORDER_RECEIVED", "label": "Order Received", "completed_at": "..." },
          { "status": "PAYMENT_SECURED", "label": "Payment Secured", "completed_at": "..." },
          ...
        ]
      }
    }
    ```
  - Map your internal order status to the 6-step timeline: Order Received → Payment Secured → Vendor Preparing → Picked Up → In Transit → Delivered.

- **POST /api/tracking/complaint**  
  Body: form-data or JSON with `token`, `order_id`, `reason` (Damaged | Not Delivered | Wrong Item), `description`, optional `photo` (file).  
  - Verify token, resolve order_id.
  - **System actions:**
    1. Set all escrows for this order to `escrow_status = 'FROZEN'`.
    2. Generate `dispute_id` (format DSP-YYYY-XXXXX), create dispute record (reason, description, photo_url if uploaded), status = UNDER_REVIEW.
    3. Notify admin, vendor(s), transporter (email/in-app/SMS as you have).
  - Return `{ "dispute_id": "DSP-2025-00001", ... }` so frontend can redirect to `/disputes/:id`.

### Disputes
- **GET /api/disputes/:id**  
  - Public or token-scoped: return dispute by id (or dispute_id). Include timeline of actions (status changes).  
  - Response: `{ "data": { "dispute_id", "order_id", "reason", "status", "description", "created_at", "updated_at", "timeline": [ { "action": "...", "at": "..." } ] } }`.

### Vendor / Transporter (authenticated)
- **PATCH /api/vendors/orders/:orderId/status**  
  Body: `{ "status": "processing" | "ready_for_pickup" | ... }`  
  - Update order status; sync to your order_status enum (e.g. VENDOR_PREPARING, then ready_for_pickup). Ensure customer-facing timeline updates when vendor moves stage.

- **PATCH /api/assignments/:assignmentId**  
  Body: `{ "status": "accepted" | "picked_up" | "in_transit" | "delivered", "picked_up_at"?, "delivered_at"?: ISO date }`  
  - **On picked_up:** Mark “Picked Up”; consider risk transferred (per spec).  
  - **On delivered:** Mark “Delivered”; **trigger escrow release** (set escrow status to RELEASED, vendor payout logic).

### Admin
- **GET /api/admin/disputes** (or similar) – list disputes.
- **PATCH /api/admin/disputes/:id** – update dispute status (UNDER_REVIEW | RESOLVED | REFUNDED).
- **Release/refund escrow:** When admin resolves:
  - If **refund:** set escrow status REFUNDED, trigger customer refund.
  - If **valid delivery:** set escrow status RELEASED, pay vendor (existing payout flow).
- **GET /api/admin/orders/:id/timeline** – order timeline history (audit log of status changes).

---

## 3. Escrow engine (core logic)

- **Payment received** → create/update escrow rows for order, `status = HELD`.
- **Pickup confirmed** (transporter marks “Picked Up”) → risk transferred (no escrow state change required; just business rule).
- **Delivery confirmed** (transporter marks “Delivered”) → set escrow `status = RELEASED`, run vendor payout.
- **Complaint raised** → set escrow `status = FROZEN` for that order.
- **Admin resolution:**
  - Refund → escrow `REFUNDED`, credit customer.
  - Valid delivery → escrow `RELEASED`, pay vendor.

Ensure every status change is **audit-logged** (order/escrow/dispute history).

---

## 4. SMS service

- Integrate a provider (e.g. Africa’s Talking, Twilio, Infobip).
- **Send SMS:**
  - After payment success: tracking link + order number + tracking code.
  - On request-otp: 6-digit OTP (and optionally “valid for 5 minutes”).
- **Rate limiting:** throttle request-otp per phone and per IP to prevent abuse.

---

## 5. Security checklist

- OTP: store only **hashed** value; compare with bcrypt or equivalent.
- SMS: rate limit request-otp (e.g. 5/minute per phone, 10/minute per IP).
- Vendor/transporter endpoints: **authenticated** (JWT/session), authorize by shop_id / transporter_id.
- File upload (complaint photo): validate type (image), size limit, virus scan if possible; store in object storage and save URL in dispute.
- Input: sanitize and validate all inputs (tracking_code, phone_number, reason, description).
- Audit log: record every order status change, escrow status change, dispute status change.

---

## 6. Frontend–backend contract summary

| Frontend action              | Backend endpoint / behavior |
|-----------------------------|-----------------------------|
| Payment success page        | Order has order_number (TOLA-YYYY-XXXXXXXX), tracking_code (TDX-XXXXX-XXXX), payment_status ESCROW_HELD; SMS sent. |
| Track order: Send OTP       | POST /tracking/request-otp → validate code + phone, send OTP SMS. |
| Track verify OTP            | POST /tracking/verify-otp → return token. |
| Order status dashboard      | GET /tracking/status?token= → order + transporter (phone_masked) + timeline. |
| Raise complaint             | POST /tracking/complaint (token, order_id, reason, description, photo) → freeze escrow, create dispute, notify. |
| Dispute status page         | GET /disputes/:id → dispute + timeline. |
| Vendor update stage         | PATCH /vendors/orders/:id/status. |
| Transporter accept / pickup / deliver | PATCH /assignments/:id → on delivered release escrow. |
| Admin resolve dispute       | PATCH admin dispute → release or refund escrow. |

---

## 7. What to verify

1. **Schema:** Orders have order_number + tracking_code; escrows table with status; OTP table (hashed); disputes table with dispute_id and timeline.
2. **APIs:** All routes above return status codes and JSON shapes the frontend expects (see client code in `app/track/*`, `app/disputes/*`, `lib/api-client.ts`, `lib/types.ts`).
3. **Escrow:** HELD on payment; FROZEN on complaint; RELEASED on delivery (or admin “valid delivery”); REFUNDED on admin refund.
4. **SMS:** Sent on payment success and on request-otp; rate limited.
5. **OTP:** Hashed, 5-min expiry, max 5 attempts.
6. **Audit:** Order and escrow status changes logged for admin/timeline.

Use this document to implement missing pieces and to regression-test the backend so the frontend flows work end-to-end.
