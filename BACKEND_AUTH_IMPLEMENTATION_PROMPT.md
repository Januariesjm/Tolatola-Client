# Backend Auth Implementation & Update Prompt (TolaTola)

Use this prompt in your **backend** repo to make sure all frontend auth pages work end-to-end:

- `/auth/login`
- `/auth/sign-up`
- `/auth/forgot-password`
- `/auth/reset-password?token=...`
- `/auth/logout`

The frontend already calls your API; you just need to ensure these endpoints exist and behave as described.

---

## 1. Existing endpoints (for context)

The frontend already assumes:

- `POST /auth/login`  
  Body: `{ email, password }`  
  Returns: `{ user, session }` where `session` contains `access_token` and `refresh_token` compatible with Supabase `auth.setSession`.

- `POST /auth/signup`  
  Body: `{ email, password, fullName, userType: "customer" | "vendor" | "transporter", vendorType? }`  
  Returns: `{ user, session }` (same shape as login).

- `POST /auth/logout`  
  Body: none (or auth token from header).  
  Used to invalidate backend sessions; the frontend **also signs out Supabase locally.**

Make sure these three behave consistently with whatever you already have deployed.

---

## 2. New required endpoints

### 2.1 Forgot password

**Endpoint:** `POST /auth/forgot-password`  
Used by `/auth/forgot-password` page.

#### Request

```json
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com",
  "returnUrl": "/optional/next/path"
}
```

- `email`: address user typed.
- `returnUrl` (optional): when present, include it in the reset link so after resetting you can redirect the user back to a specific area.

#### Behavior

1. **Look up user by email**, but never leak whether the user exists.
2. Generate a **one-time reset token**:
   - At least 32 random bytes, base64/URL-safe encoded.
   - Store only a **hash** (`SHA-256` or HMAC) in DB with:
     - `user_id`
     - `token_hash`
     - `expires_at` (e.g. now + 30 minutes)
     - `used` flag
3. Email the user a link:

   - `https://tolatola.co/auth/reset-password?token=<rawToken>&next=<returnUrl>`  
     (`next` is optional, only if provided).

4. Apply **rate limiting** per email + IP to prevent abuse (e.g. max 5/hour).

#### Response

- Always respond `200` with a generic message **even if the email does not exist**:

```json
{ "success": true, "message": "If an account exists with that email, we've sent a reset link." }
```

This matches the copy used in the frontend.

### 2.2 Reset password

**Endpoint:** `POST /auth/reset-password`  
Used by `/auth/reset-password?token=...` page.

#### Request

```json
POST /auth/reset-password
Content-Type: application/json

{
  "token": "<raw_reset_token_from_email>",
  "password": "new-strong-password"
}
```

#### Behavior

1. Hash the incoming `token` with the same algorithm used in `forgot-password`.
2. Look up reset record by `token_hash` and ensure:
   - Not expired (`expires_at > now`).
   - Not used.
3. If invalid, return `400`:

```json
{ "error": "Invalid or expired reset link." }
```

4. If valid:
   - Update the user’s password (hash according to your normal auth scheme).
   - Mark reset record as **used** (and/or delete it).
   - **Invalidate existing sessions / refresh tokens** for that user so old sessions cannot be reused.

#### Response

```json
{ "success": true }
```

The frontend will then redirect the user back to `/auth/login?reset=success` (or login with `returnUrl`).

### 2.3 Logout (confirm)

**Endpoint:** `POST /auth/logout`  
Already used from:

- `/auth/logout` page
- Account settings logout
- Vendor / transporter dashboards

Make sure this endpoint:

1. Accepts the access token (e.g. `Authorization: Bearer` header) and/or refresh token.
2. Invalidates the session on server side (e.g. revokes refresh token, deletes session row).
3. Returns:

```json
{ "success": true }
```

The frontend does not need more than this.

---

## 3. Security notes to follow

- **Token secrets**
  - Never store raw reset tokens, only hashes.
  - Use HTTPS only; do not send tokens over unsecured channels.

- **Expiry & reuse**
  - Token lifetime: **max 30 minutes**.
  - One-time use only; mark as used when password is changed.

- **Brute force & enumeration**
  - In `/auth/forgot-password`, use the same success message whether or not the email exists.
  - Rate-limit attempts per email and IP.

- **Session handling**
  - After password reset, **invalidate all old sessions** for that user.
  - On `/auth/logout`, revoke refresh tokens / server-side sessions.

---

## 4. Frontend–backend contract summary

| Frontend page                        | Backend endpoint                    | Notes |
|--------------------------------------|-------------------------------------|-------|
| `/auth/login`                        | `POST /auth/login`                 | Returns `{ user, session }` for Supabase. |
| `/auth/sign-up`                      | `POST /auth/signup`                | Returns `{ user, session }` after creation. |
| `/auth/forgot-password`             | `POST /auth/forgot-password`       | Emails reset link; always returns generic success. |
| `/auth/reset-password?token=...`    | `POST /auth/reset-password`        | Validates token, updates password, invalidates sessions. |
| `/auth/logout` + in-app logout flows | `POST /auth/logout`                 | Revokes server sessions; frontend also signs out locally. |

Use this spec to implement any missing auth routes on the backend and align existing ones so all the new frontend auth pages work reliably.

