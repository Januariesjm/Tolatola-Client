/**
 * Shared test fixtures.
 *
 * NOT a test file -- excluded via testPathIgnorePatterns in jest.config.js.
 *
 * These exist so no individual test has to hand-roll a Supabase client or a
 * fetch stub, and so no test can accidentally reach a live service. The global
 * Supabase mock in jest.setup.ts is built from `createSupabaseClientMock`;
 * import it here when a test needs a client that behaves differently (a
 * rejecting session lookup, a realtime channel, seeded query results).
 */

/** A chainable Supabase realtime channel that does nothing. */
export function createChannelMock() {
  const channel: Record<string, unknown> = {}
  channel.on = () => channel
  channel.subscribe = () => channel
  channel.unsubscribe = () => channel
  return channel
}

export interface SupabaseClientMockOptions {
  /** Session returned by auth.getSession(). Defaults to no session. */
  session?: { access_token?: string } | null
  /** User returned by auth.getUser(). Defaults to no user. */
  user?: { id: string; email?: string } | null
  /** Rows returned by any `from(...).select(...)` chain. */
  rows?: unknown[]
  /** Error returned alongside `rows`. */
  error?: unknown
}

/**
 * Minimal Supabase client double.
 *
 * Covers the surface this app actually touches: auth session/user/signOut,
 * a chainable query builder that resolves to `rows`, and realtime channels.
 * Every method is a jest.fn so tests can assert on calls.
 */
export function createSupabaseClientMock(options: SupabaseClientMockOptions = {}) {
  const { session = null, user = null, rows = [], error = null } = options

  const result = { data: rows, error }

  // Every terminal method resolves to the same result, and every intermediate
  // method returns the builder, so any chain length works.
  const builder: Record<string, unknown> = {}
  const terminal = () => Promise.resolve(result)
  for (const method of [
    "select",
    "insert",
    "update",
    "upsert",
    "delete",
    "eq",
    "neq",
    "in",
    "is",
    "order",
    "range",
    "match",
    "filter",
    "not",
    "or",
  ]) {
    builder[method] = jest.fn(() => builder)
  }
  for (const method of ["single", "maybeSingle", "limit", "then"]) {
    builder[method] = jest.fn(terminal)
  }

  return {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session }, error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => builder),
    channel: jest.fn(() => createChannelMock()),
    removeChannel: jest.fn(),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: { path: "test/path" }, error: null }),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: "https://example.test/file" } })),
      })),
    },
  }
}

export interface FetchRoute {
  /** Return true to serve this route. */
  match: (url: string, method: string) => boolean
  ok?: boolean
  status?: number
  body?: unknown
}

/**
 * Builds a `global.fetch` replacement that routes by URL and method.
 *
 * Routes are tried in order; the first match wins. Anything unmatched resolves
 * to `{ ok: true, status: 200 }` with `fallbackBody`, so a test only declares
 * the calls it cares about.
 */
export function createFetchMock(routes: FetchRoute[] = [], fallbackBody: unknown = {}) {
  return jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const method = (init?.method || "GET").toUpperCase()
    const route = routes.find((r) => r.match(url, method))

    const ok = route?.ok ?? true
    return {
      ok,
      status: route?.status ?? (ok ? 200 : 500),
      json: async () => route?.body ?? fallbackBody,
      text: async () => JSON.stringify(route?.body ?? fallbackBody),
    } as Response
  })
}

/** Installs a fetch mock on `global` and returns it. */
export function installFetchMock(routes: FetchRoute[] = [], fallbackBody: unknown = {}) {
  const mock = createFetchMock(routes, fallbackBody)
  global.fetch = mock as unknown as typeof fetch
  return mock
}
