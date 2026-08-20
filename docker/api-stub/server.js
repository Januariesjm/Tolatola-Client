/**
 * Minimal stand-in for the Tolatola backend API.
 *
 * Exists so `docker compose up` brings the client up on its own, with no real
 * backend, Supabase project or third-party account. It answers every route with
 * an empty-but-well-shaped payload, which is enough for the UI to render its
 * loading and empty states.
 *
 * This is a development fixture. It is not a mock of the real API's behavior --
 * see API-CONTRACT.md for that.
 */

const http = require("http")

const PORT = Number(process.env.PORT || 4000)

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
}

/**
 * Endpoints whose shape the UI actually reads. Anything unmatched falls back to
 * `{ data: [] }`, which every list view tolerates.
 */
function bodyFor(method, pathname) {
  if (pathname === "/health" || pathname === "/api/health") {
    return { status: "ok", stub: true }
  }

  if (method !== "GET") {
    return { success: true, message: "Stubbed response from the API stub." }
  }

  if (pathname.endsWith("/stats")) {
    return {
      stats: {
        totalAgents: 0,
        activeAgents: 0,
        suspendedAgents: 0,
        totalRegistrations: 0,
        totalCommission: 0,
      },
    }
  }

  return { data: [] }
}

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, `http://localhost:${PORT}`)

  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS)
    res.end()
    return
  }

  const payload = JSON.stringify(bodyFor(req.method, pathname))

  // eslint-disable-next-line no-console
  console.log(`[api-stub] ${req.method} ${pathname} -> 200`)

  res.writeHead(200, { ...CORS_HEADERS, "Content-Type": "application/json" })
  res.end(payload)
})

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[api-stub] listening on http://0.0.0.0:${PORT}`)
})
