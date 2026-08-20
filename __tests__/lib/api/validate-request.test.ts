/**
 * @jest-environment node
 */

/**
 * Tests for the API body validator (lib/api/validate-request.ts).
 *
 * This sits in front of every route handler that accepts a body, so its
 * contract matters: a valid body yields typed data, anything else yields a 400
 * that says which fields failed — and never echoes the submitted values back.
 */

import { z } from "zod"
import { validateRequestBody } from "@/lib/api/validate-request"
import { setErrorReporter } from "@/lib/logger"

const schema = z.object({
  userId: z.string().min(1, "userId is required"),
  amount: z.number().positive("amount must be greater than 0"),
})

/** Minimal Request stand-in carrying a JSON body. */
function req(body: unknown) {
  return { json: async () => body } as Request
}

/** A Request whose body is not JSON at all. */
function brokenReq() {
  return {
    json: async () => {
      throw new Error("Unexpected token < in JSON")
    },
  } as unknown as Request
}

beforeEach(() => {
  jest.spyOn(console, "warn").mockImplementation(() => {})
  setErrorReporter(null)
})

afterEach(() => jest.restoreAllMocks())

describe("validateRequestBody", () => {
  it("returns typed data for a valid body", async () => {
    const result = await validateRequestBody(req({ userId: "u-1", amount: 500 }), schema)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toEqual({ userId: "u-1", amount: 500 })
    }
  })

  it("returns a 400 when a field is missing", async () => {
    const result = await validateRequestBody(req({ amount: 500 }), schema)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(400)
      await expect(result.response.json()).resolves.toMatchObject({ error: "Invalid request body" })
    }
  })

  it("names the failing field in the issues list", async () => {
    const result = await validateRequestBody(req({ userId: "", amount: 500 }), schema)

    if (!result.ok) {
      const body = await result.response.json()
      expect(body.issues).toEqual(["userId: userId is required"])
    }
  })

  it("reports every failing field, not just the first", async () => {
    const result = await validateRequestBody(req({ userId: "", amount: -5 }), schema)

    if (!result.ok) {
      const body = await result.response.json()
      expect(body.issues).toHaveLength(2)
    }
  })

  it("rejects a wrongly-typed field rather than coercing it", async () => {
    // "500" must not become 500 -- that is how bad data reaches a query.
    const result = await validateRequestBody(req({ userId: "u-1", amount: "500" }), schema)

    expect(result.ok).toBe(false)
  })

  it("does not echo submitted values back in the error", async () => {
    const secret = "super-secret-token"
    const result = await validateRequestBody(req({ userId: secret, amount: -1 }), schema)

    if (!result.ok) {
      expect(JSON.stringify(await result.response.json())).not.toContain(secret)
    }
  })

  it("returns a 400 for a body that is not JSON", async () => {
    const result = await validateRequestBody(brokenReq(), schema)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(400)
      await expect(result.response.json()).resolves.toEqual({
        error: "Request body must be valid JSON",
        issues: [],
      })
    }
  })

  it.each([[null], [undefined], ["a string"], [42], [[]]])("returns a 400 for the non-object body %p", async (body) => {
    const result = await validateRequestBody(req(body), schema)

    expect(result.ok).toBe(false)
  })

  it("strips unknown keys rather than passing them through", async () => {
    const result = await validateRequestBody(req({ userId: "u-1", amount: 5, isAdmin: true }), schema)

    if (result.ok) {
      expect(result.data).not.toHaveProperty("isAdmin")
    }
  })
})
