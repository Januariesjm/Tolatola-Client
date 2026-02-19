# TOLA Tanzania — Client

Frontend for **TOLA Tanzania** (tolatola.co): marketplace, vendor and transporter dashboards, checkout, orders, and profile management. Built with **Next.js 14** (App Router), **React 18**, **Tailwind CSS**, and **Supabase** for auth.

---

## Table of contents

- [Prerequisites](#prerequisites)
- [Quick start (run locally)](#quick-start-run-locally)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Managing the project](#managing-the-project)
- [Contributing](#contributing)
- [Related documentation](#related-documentation)

---

## Prerequisites

- **Node.js** 18.x or 20.x (LTS recommended)
- **npm** or **yarn**
- A running **backend API** (see your backend repo for how to run it)
- **Supabase** project (for auth and optional DB usage from the client)

---

## Quick start (run locally)

1. **Clone the repo**
   ```bash
   git clone <repository-url>
   cd Tolatola-Client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   - Copy the example env file (if present) or create `.env.local` in the project root.
   - Add at least the [required variables](#environment-variables) below.

4. **Start the dev server**
   ```bash
   npm run dev
   ```
   - App: [http://localhost:3000](http://localhost:3000)
   - The app will call the backend at `NEXT_PUBLIC_API_BASE_URL`; ensure the backend is running.

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

---

## Environment variables

Create a `.env.local` file in the project root. These are the main variables used by the client:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (auth) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key (auth) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server) | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Backend API base URL (e.g. `http://localhost:4000/api`) |
| `NEXT_PUBLIC_APP_URL` | No | App origin for redirects (default: `https://tolatola.co`) |
| `GOOGLE_MAPS_API_KEY` | No | For maps/address autocomplete (optional) |
| `CLICKPESA_API_URL` | No | Payment provider API URL |
| `CLICKPESA_CLIENT_ID` | No | ClickPesa client ID |
| `CLICKPESA_API_KEY` | No | ClickPesa API key |
| `STORAGE_BUCKET` | No | Supabase storage bucket name (default: `uploads`) |
| `ADMIN_SETUP_KEY` | No | Secret for initial admin setup (default value in code) |

- **Never** commit `.env.local` or any file containing real secrets.
- For deployment (Vercel, Docker, etc.), set these in the platform’s environment/config.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server (with DNS order for IPv4) |
| `npm run build` | Production build (output: standalone by default) |
| `npm start` | Run production server (after `build`) |
| `npm run lint` | Run Next.js ESLint |

---

## Project structure

```
Tolatola-Client/
├── app/                    # Next.js App Router
│   ├── auth/               # Login, sign-up, reset password, OAuth callback
│   ├── profile/            # User profile (backend-backed)
│   ├── shop/               # Shop listing and shop detail
│   ├── product/            # Product detail
│   ├── vendor/             # Vendor registration and dashboard
│   ├── transporter/        # Transporter registration and dashboard
│   ├── admin/              # Admin dashboard
│   ├── api/                # Next.js API routes (webhooks, uploads, etc.)
│   └── ...
├── components/             # React components
│   ├── layout/             # Header, footer, shell, nav
│   ├── profile/            # Profile tabs and forms
│   ├── shop/               # Shop and product UI
│   ├── ui/                 # Shared UI (buttons, cards, etc.)
│   └── ...
├── lib/                    # Utilities and shared logic
│   ├── api.ts              # Backend API client (server)
│   ├── api-client.ts       # Backend API client (browser) + profile helpers
│   ├── api-server.ts       # Server-side API with auth
│   ├── supabase/           # Supabase client and middleware
│   └── ...
├── hooks/                  # React hooks
├── public/                 # Static assets
├── next.config.mjs         # Next.js config (standalone, security headers, etc.)
├── middleware.ts           # Auth/session middleware
├── SEO_NEXT_STEPS.md       # SEO and Search Console checklist
├── PERFORMANCE_CHECKLIST.md # Performance and Core Web Vitals
└── README.md               # This file
```

---

## Managing the project

### Branching and releases

- **main** (or **master**) is the default branch; keep it deployable.
- Use **feature branches** for new work (e.g. `feature/checkout-flow`, `fix/profile-avatar`).
- Tag releases if you version the app (e.g. `v1.2.0`).

### Dependencies

- Add dependencies with `npm install <package>`.
- Run `npm run build` and `npm run lint` after changing dependencies to avoid regressions.

### Deployment

- Build output is **standalone** (`next.config.mjs`). Use `npm run build` then run the contents of `.next/standalone` (see Next.js standalone docs).
- For **Docker**, use a multi-stage build that copies the standalone output and runs `node server.js`.
- Set all [environment variables](#environment-variables) in your deployment platform; do not commit secrets.

### Code quality

- Use **TypeScript** for new and updated files.
- Run **lint** before pushing: `npm run lint`.
- Keep **SEO** and **performance** in mind; see [Related documentation](#related-documentation).

---

## Contributing

### 1. Get the code and set up

- Clone the repo, create a branch from **main**, install dependencies, and configure [environment variables](#environment-variables).

### 2. Make changes

- Implement on a **feature or fix branch** (e.g. `git checkout -b feature/your-feature`).
- Follow existing patterns: App Router under `app/`, shared components under `components/`, API helpers in `lib/`.
- Prefer **Server Components** unless you need interactivity; use **client** only where necessary (`"use client"`).
- For **backend calls**, use `serverApiGet` / `serverApiPost` etc. in server code and `clientApiGet` / `clientApiPatch` etc. in client code (see `lib/api-server.ts` and `lib/api-client.ts`).

### 3. Test and lint

- Run the app locally: `npm run dev`.
- Build: `npm run build`.
- Lint: `npm run lint`.

### 4. Commit and open a pull request

- Write clear commit messages (e.g. “Add profile avatar upload to backend API”, “Fix login redirect for transporters”).
- Push your branch and open a **pull request** into **main**.
- In the PR, describe what changed and how to test it. A maintainer will review and merge when ready.

### What to avoid

- Do **not** commit `.env.local` or any file with real API keys or secrets.
- Do **not** push directly to **main** without a review if your team uses PRs.
- Do **not** add large binary assets to the repo; use a CDN or Supabase Storage and reference them by URL.

---

## Related documentation

| Document | Purpose |
|----------|---------|
| [SEO_NEXT_STEPS.md](./SEO_NEXT_STEPS.md) | SEO checklist, Search Console, NAP, sitemap, performance tips |
| [PERFORMANCE_CHECKLIST.md](./PERFORMANCE_CHECKLIST.md) | Next.js performance targets and what’s implemented |
| `public/QUICK_START_GUIDE.md` | Quick start for running and using the app |
| Backend repo | API contract, env vars, and how to run the backend |

---

## License and support

- This project is private. See the repository or your team for license and usage terms.
- For bugs or feature requests, open an issue (or use your team’s process). For security issues, report them privately to the maintainers.
