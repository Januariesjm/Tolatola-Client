/**
 * @jest-environment node
 */

/**
 * Tests for POST /api/registration-recovery/save.
 *
 * A missing session_id must be rejected with 400 before the backend is ever
 * called -- it's the only required field, and it's how the recovery record is
 * looked up later.
 */

import { POST } from "@/app/api/registration-recovery/save/route"

const jsonRequest = (body: unknown) => ({ json: async () => body }) as never

const ORIGINAL_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

beforeEach(() => {
  jest.clearAllMocks()
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000/api"
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ success: true }) })) as unknown as typeof fetch
})

afterAll(() => {
  if (ORIGINAL_API_BASE === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL
  else process.env.NEXT_PUBLIC_API_BASE_URL = ORIGINAL_API_BASE
})

describe("POST /api/registration-recovery/save", () => {
  it("rejects a body missing session_id with 400, without calling the backend", async () => {
    const response = await POST(jsonRequest({ full_name: "Asha Mwinyi" }))

    expect(response.status).toBe(400)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it("returns 500 rather than reaching the backend when NEXT_PUBLIC_API_BASE_URL is unset", async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL

    const response = await POST(jsonRequest({ session_id: "sess-1" }))

    expect(response.status).toBe(500)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it("forwards a valid body to the backend", async () => {
    const response = await POST(jsonRequest({ session_id: "sess-1", full_name: "Asha Mwinyi" }))

    expect(response.status).toBe(200)
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(url).toContain("/registration-recovery/save")
    expect(JSON.parse(init.body)).toMatchObject({ session_id: "sess-1", full_name: "Asha Mwinyi" })
  })

  it("passes through the backend's status and detail on failure", async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 502, text: async () => "upstream down" })) as unknown as typeof fetch

    const response = await POST(jsonRequest({ session_id: "sess-1" }))

    expect(response.status).toBe(502)
    const body = await response.json()
    expect(body.detail).toBe("upstream down")
  })
})
