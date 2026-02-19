# Next.js performance checklist (pro / 2026-style)

This maps the pro performance checklist to this repo: what’s done, what’s minimal to add, and what’s optional for scale.

---

## Done in this repo

| Area | Item | Status |
|------|------|--------|
| **Rendering** | Server Components by default (App Router) | ✅ |
| **Rendering** | `force-dynamic` only where needed (auth, user-specific) | ✅ |
| **Bundle** | Automatic code splitting (Next.js default) | ✅ |
| **Bundle** | Dynamic import for heavy UI (support widget, cookie banner) | ✅ |
| **Bundle** | `optimizePackageImports: ["lucide-react"]` | ✅ |
| **Images** | `next/image` with `priority` on LCP (hero), lazy below fold | ✅ |
| **Fonts** | `next/font` with `display: "swap"` | ✅ |
| **Data** | Server-side fetch; request deduplication (Next.js) | ✅ |
| **Data** | Cache + revalidate for public GETs (homepage, shop categories) | ✅ |
| **Data** | Parallel data loading on homepage (categories, promotions, products) | ✅ |
| **API** | Compression (gzip/Brotli) in Next.js | ✅ |
| **Caching** | Long cache for `_next/static` (immutable) | ✅ |
| **Caching** | Data cache with revalidate for public API GETs | ✅ |
| **Security** | Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) | ✅ |

---

## Optional / when you’re ready

- **Images:** Turn off `images.unoptimized` and use Next.js image optimization (and CDN) when your deployment allows. Add `remotePatterns` if you use external image hosts.
- **Bundle analyzer:** `npm i -D @next/bundle-analyzer`, wrap config with `withBundleAnalyzer`, run `ANALYZE=true npm run build` to keep first-load JS under ~150KB.
- **Edge:** Use Edge runtime for a few latency-sensitive routes (e.g. auth/session) if you need &lt;200ms TTFB globally.
- **Lighthouse CI:** Add a `lighthouserc.json` and run Lighthouse in CI on key URLs (e.g. `/`, `/shop`) to enforce LCP &lt; 2.5s, CLS &lt; 0.1.
- **RUM:** Use Vercel Analytics or similar for real-user LCP, INP, CLS and alert on regressions.
- **CDN / edge:** Deploy behind a global CDN (e.g. Vercel Edge) and rely on existing static asset caching.

---

## Targets (2026-style)

| Metric | Target |
|--------|--------|
| LCP | &lt; 2.5s |
| INP | &lt; 200ms |
| CLS | &lt; 0.1 |
| TTFB | &lt; 800ms |
| First load JS | &lt; 150KB (ideal) |

Monitor these in production (e.g. Search Console Core Web Vitals, or RUM) and fix pages that miss targets.

---

## Reference: full pro checklist (summary)

1. **Rendering:** Server Components default; static/ISR for public pages; streaming + Suspense for slow data; edge where needed; avoid unnecessary client components.
2. **Bundle:** Code splitting; dynamic import heavy components; tree-shaking; analyze bundle regularly.
3. **Images:** `next/image`; modern formats; explicit dimensions; lazy below fold; CDN; blur/skeleton.
4. **CDN / edge:** Global CDN; cache static assets and HTML where safe; regional edge.
5. **Data:** Server fetch; dedupe; cache + revalidate; parallel loading; pagination/cursor.
6. **API:** Server actions where appropriate; small payloads; compression; connection pooling; cache layer; rate limit.
7. **Client:** Minimize hydration; avoid huge global state; memoization; debounce; Web Workers for heavy work.
8. **CSS:** Atomic/modules; remove unused; avoid runtime CSS-in-JS; critical CSS; minimize CLS.
9. **Fonts:** `next/font`; self-host; subsets; preload; avoid layout shift.
10. **Caching:** Browser (long for static); server (response + data cache); edge (HTML/geo).
11. **Core Web Vitals:** Monitor LCP, INP, CLS, TTFB; RUM + synthetic; performance budgets in CI.
12. **Testing:** Lighthouse CI; load tests; bundle size regression; memory checks.
13. **Security:** HTTP/3, TLS 1.3; security headers; rate limiting; edge firewall.
14. **Infra:** Auto-scale; cold-start tuning; DB indexing; read replicas; background jobs.
15. **Mobile:** Test on slow 3G; reduce JS time; light animations; touch latency.
16. **DevEx:** Fast builds (e.g. Turbopack); parallel type check; CI cache; incremental builds.

For more detail, see your internal “Next.js Performance Optimization Checklist (Pro Level — 2026+)” doc.
