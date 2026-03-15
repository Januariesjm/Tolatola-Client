# Prompt: Create React Native (Android & iOS) app directory for TOLA Tanzania

Use this prompt when creating the **React Native** mobile app for TOLA Tanzania. The app should be a **separate project** (its own directory) **outside** the existing API and web client repos, so it lives alongside them—not inside Tolatola-Client or the backend.

---

## 1. Where to create the mobile app

- **Location:** Create the React Native project **outside** the current API and web client.
- **Suggested layout:**
  ```
  TolaTola/                          # or your parent folder name
  ├── Tolatola-Client/               # existing Next.js web app (this repo)
  ├── <your-backend-repo>/            # existing backend API
  └── Tolatola-Mobile/               # NEW: React Native app (Android + iOS)
  ```
- **Directory name:** Use a clear name, e.g. `Tolatola-Mobile` or `tolatola-native`. Do **not** create it inside `Tolatola-Client` or inside the backend repo.
- **How to create:** From the **parent folder** (e.g. `TolaTola`), run your React Native or Expo init command so that the new project is a sibling of `Tolatola-Client` and the API, e.g.:
  ```bash
  cd /path/to/TolaTola
  npx create-expo-app@latest Tolatola-Mobile
  # or: npx react-native@latest init TolatolaMobile
  ```

---

## 2. What the web app does (align the mobile app with this)

The **Tolatola-Client** (Next.js) app is the reference. The mobile app should use the **same backend API** and **same auth** (Supabase) and mirror the main user flows.

### Backend API

- **Base URL:** Configured via `NEXT_PUBLIC_API_BASE_URL` in the web app (e.g. `https://your-api.example.com/api` or `http://localhost:4000/api`). The mobile app must use the **same** base URL (e.g. via env or config).
- **Auth:** Every authenticated request sends `Authorization: Bearer <access_token>`. The access token comes from **Supabase Auth** (session).
- **Content-Type:** `application/json` for request bodies.
- **Main API surface used by the web client:**
  - **Auth / profile:** `GET /profile`, `PATCH /profile` (body: `{ full_name?, phone? }`), `POST /profile/avatar` (body: `{ image }` base64 or data URL).
  - **Catalog:** `GET /categories`, `GET /products` (query: category, search, minPrice, maxPrice, sort), `GET /products/:id`, `GET /shops/:id`, `GET /shops/:id/products`, `GET /promotions`.
  - **Cart / checkout / orders:** Cart is client-side (web uses localStorage); orders are created via API (see backend docs). Endpoints used: orders creation, order detail, confirm delivery, etc.
  - **Vendor:** `GET /profile` (user_type), vendor registration flow, `GET /vendors/:id/subscription`, `GET /subscriptions/plans`, shops, products CRUD, shop orders, wallet, payouts.
  - **Transporter:** Transporter registration, `GET /subscriptions/plans?type=transporter`, assignments, payments.
  - **Tracking (guest):** Public endpoints for order tracking (e.g. request OTP, verify OTP, get status by token)—no auth.
  - **Disputes:** `GET /disputes/:id` (with auth or token as per backend).

### Auth (Supabase)

- **Supabase** is used for authentication (email/password, and optionally OAuth).
- Web app uses: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The mobile app needs the same Supabase project (same URL and anon key).
- After login, the app gets the Supabase session and uses `session.access_token` for the backend API.
- **User types:** `customer`, `vendor`, `transporter`, `admin`. The backend and web redirect/dashboard by `user_type`; the mobile app should do the same (e.g. different home or tabs per role).

### Main screens / flows to mirror (priority)

1. **Auth:** Login, Sign up, Forgot password, (optional) OAuth, Post-login redirect by user type.
2. **Buyer:** Home (promotions, categories, products), Shop listing (filters, search), Product detail, Shop detail, Cart (local then API for checkout), Checkout, Payment (e.g. ClickPesa / mobile money), Order list, Order detail, Track order (tracking code + phone, OTP, status).
3. **Profile:** View profile (GET /profile), Edit name/phone (PATCH /profile), Avatar (POST /profile/avatar), (optional) KYC, Orders, Transactions, Support.
4. **Vendor (if user_type vendor):** Dashboard, Products, Orders, Wallet, Subscription (plans, pay).
5. **Transporter (if user_type transporter):** Dashboard, Assignments, Payments, Subscription.
6. **Guest:** Order tracking (tracking code + phone → OTP → status), no login required.
7. **Static/info (optional in v1):** About, Contact, FAQ, Terms, Privacy (can be in-app WebView or deep link to website).

### Branding and product

- **Product name:** TOLA Tanzania (tolatola.co).
- **Tagline / positioning:** Online marketplace and ecommerce for Tanzania; verified vendors; M-Pesa / Tigo Pesa; secure escrow.
- Use the same logo and primary colors as the website where possible (e.g. from Tolatola-Client `public/` or design assets).

---

## 3. What to create first (directory and scaffold)

1. **Create the project directory** in the right place (sibling to Tolatola-Client and API, as in section 1).
2. **Scaffold** a React Native project (Expo or bare React Native) with:
   - TypeScript.
   - Navigation (e.g. React Navigation) with stacks/tabs for: Auth, Main (Home, Shop, Cart, Profile), and role-specific flows (Vendor, Transporter).
   - Environment config for API base URL and Supabase URL/anon key (e.g. `.env` or `app.config.js` with env vars).
   - A simple API client that:
     - Uses the same base URL as the web app’s backend.
     - Sends `Authorization: Bearer <access_token>` when the user is logged in (Supabase session).
     - Sends `Content-Type: application/json` and parses JSON.
   - Supabase Auth integration (login, signup, session, logout) and persistence of session for mobile.
3. **README** in the new repo explaining:
   - That this is the TOLA Tanzania Android & iOS app.
   - That it uses the same backend API and Supabase project as the web app (Tolatola-Client).
   - How to set env vars (API base URL, Supabase URL, Supabase anon key).
   - How to run on Android and iOS (`npx expo start`, or `react-native run-android` / `run-ios`).

---

## 4. Out of scope for this prompt

- Backend or API changes.
- Changes inside Tolatola-Client or the API repo (only use them as reference).
- Exact UI/UX design (use the website and brand as reference; implement screens step by step).

---

## 5. Checklist before you start

- [ ] Parent folder exists (e.g. `TolaTola`) and contains `Tolatola-Client` (and optionally the API repo).
- [ ] You will create the new app **outside** both the API and Tolatola-Client (e.g. `Tolatola-Mobile`).
- [ ] You have the backend API base URL and Supabase URL + anon key (same as web app).
- [ ] You have Node and npm/yarn (and for Android: Android Studio / SDK; for iOS: Xcode on macOS) for running the app.

---

Use this prompt when asking an assistant or team to create the React Native app directory and initial scaffold so the mobile app aligns with the existing website and backend and lives in the correct place outside the API and client repos.
