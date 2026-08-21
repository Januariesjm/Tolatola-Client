/**
 * Tests for lib/support/support-endpoints.ts.
 *
 * The widget tries these URLs in order and keeps the first that answers, so the
 * ordering is behaviour: putting the production host before the configured base
 * would send a staging deployment's support traffic to production.
 *
 * NEXT_PUBLIC_API_URL is read at call time, so each test sets it and the
 * original is restored afterwards.
 */

import { SUPPORT_API_FALLBACK_HOST, buildSupportEndpoints, supportApiBase } from "@/lib/support/support-endpoints"

const ORIGINAL = process.env.NEXT_PUBLIC_API_URL

afterEach(() => {
  if (ORIGINAL === undefined) {
    delete process.env.NEXT_PUBLIC_API_URL
  } else {
    process.env.NEXT_PUBLIC_API_URL = ORIGINAL
  }
})

describe("supportApiBase", () => {
  it("uses the configured base", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://staging.tolatola.co"

    expect(supportApiBase()).toBe("https://staging.tolatola.co")
  })

  it("strips a trailing slash so paths do not double up", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://staging.tolatola.co/"

    expect(supportApiBase()).toBe("https://staging.tolatola.co")
  })

  it("falls back to the production host when unset", () => {
    delete process.env.NEXT_PUBLIC_API_URL

    expect(supportApiBase()).toBe(SUPPORT_API_FALLBACK_HOST)
  })

  it("falls back when the value is empty", () => {
    process.env.NEXT_PUBLIC_API_URL = ""

    expect(supportApiBase()).toBe(SUPPORT_API_FALLBACK_HOST)
  })
})

describe("buildSupportEndpoints", () => {
  it("tries the configured base before the production fallback", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://staging.tolatola.co"

    expect(buildSupportEndpoints("ai-chat")).toEqual([
      "https://staging.tolatola.co/api/support/ai-chat",
      "https://staging.tolatola.co/support/ai-chat",
      `${SUPPORT_API_FALLBACK_HOST}/api/support/ai-chat`,
      `${SUPPORT_API_FALLBACK_HOST}/support/ai-chat`,
    ])
  })

  it("tries the /api prefix before the bare path", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://staging.tolatola.co"
    const [first, second] = buildSupportEndpoints("tickets")

    expect(first).toContain("/api/support/")
    expect(second).not.toContain("/api/support/")
  })

  it("de-duplicates when the configured base is already the fallback host", () => {
    process.env.NEXT_PUBLIC_API_URL = SUPPORT_API_FALLBACK_HOST

    expect(buildSupportEndpoints("ai-chat")).toEqual([
      `${SUPPORT_API_FALLBACK_HOST}/api/support/ai-chat`,
      `${SUPPORT_API_FALLBACK_HOST}/support/ai-chat`,
    ])
  })

  it("de-duplicates a configured base that differs only by a trailing slash", () => {
    process.env.NEXT_PUBLIC_API_URL = `${SUPPORT_API_FALLBACK_HOST}/`

    expect(buildSupportEndpoints("tickets")).toHaveLength(2)
  })

  it("never produces a doubled slash in the path", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://staging.tolatola.co/"

    for (const url of buildSupportEndpoints("/ai-chat")) {
      expect(url.replace("https://", "")).not.toContain("//")
    }
  })

  it("tolerates a leading slash on the path", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://staging.tolatola.co"

    expect(buildSupportEndpoints("/tickets")[0]).toBe("https://staging.tolatola.co/api/support/tickets")
  })

  it("builds distinct lists for distinct paths", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://staging.tolatola.co"

    expect(buildSupportEndpoints("ai-chat")).not.toEqual(buildSupportEndpoints("tickets"))
  })
})
