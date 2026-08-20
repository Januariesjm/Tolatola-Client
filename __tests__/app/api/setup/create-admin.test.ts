/**
 * @jest-environment node
 */

/**
 * Tests for POST /api/setup/create-admin.
 *
 * This route creates the very first admin user, so its guard rails matter:
 * - the route is disabled outright when ADMIN_SETUP_KEY is unset (no fallback
 *   key baked into the source)
 * - a wrong or non-string setup key is rejected with 403
 * - input validation runs only after the key check, so it cannot be used to
 *   probe the route without the key
 * - the route refuses to run twice once an admin exists
 */

const mockCreateClient = jest.fn()

jest.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}))

import { POST } from "@/app/api/setup/create-admin/route"

const VALID_KEY = "correct-horse-battery-staple"

/** Builds a NextRequest-shaped stub carrying a JSON body. */
function jsonRequest(body: unknown) {
  return { json: async () => body } as never
}

/**
 * Supabase double covering the two calls the route makes: the
 * "does an admin already exist" lookup and auth.admin.createUser.
 */
function supabaseStub({
  existingAdmins = [] as Array<{ id: string }>,
  checkError = null as unknown,
  createdUserId = "new-admin-id",
  authError = null as unknown,
  updateError = null as unknown,
} = {}) {
  const limit = jest.fn().mockResolvedValue({ data: existingAdmins, error: checkError })
  const eqSelect = jest.fn(() => ({ limit }))
  const select = jest.fn(() => ({ eq: eqSelect }))

  const eqUpdate = jest.fn().mockResolvedValue({ error: updateError })
  const update = jest.fn(() => ({ eq: eqUpdate }))

  const createUser = jest.fn().mockResolvedValue({
    data: { user: { id: createdUserId } },
    error: authError,
  })

  return {
    client: {
      from: jest.fn(() => ({ select, update })),
      auth: { admin: { createUser } },
    },
    spies: { select, update, createUser, limit },
  }
}

const ORIGINAL_ADMIN_SETUP_KEY = process.env.ADMIN_SETUP_KEY

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  process.env.ADMIN_SETUP_KEY = VALID_KEY
})

afterEach(() => {
  jest.restoreAllMocks()
})

afterAll(() => {
  if (ORIGINAL_ADMIN_SETUP_KEY === undefined) {
    delete process.env.ADMIN_SETUP_KEY
  } else {
    process.env.ADMIN_SETUP_KEY = ORIGINAL_ADMIN_SETUP_KEY
  }
})

describe("POST /api/setup/create-admin", () => {
  describe("ADMIN_SETUP_KEY is not configured", () => {
    beforeEach(() => {
      delete process.env.ADMIN_SETUP_KEY
    })

    it("refuses the request with 503 instead of falling back to a built-in key", async () => {
      const response = await POST(
        jsonRequest({
          email: "admin@tolatola.co",
          password: "a-long-enough-password",
          fullName: "Admin",
          setupKey: "tolamarketplace-admin-setup-2025",
        }),
      )

      expect(response.status).toBe(503)
      await expect(response.json()).resolves.toEqual({
        error: "Admin setup is not configured on this deployment.",
      })
    })

    it("never reaches Supabase when the route is unconfigured", async () => {
      await POST(jsonRequest({ setupKey: "anything" }))

      expect(mockCreateClient).not.toHaveBeenCalled()
    })
  })

  describe("setup key verification", () => {
    it.each([
      ["a wrong key", "wrong-key"],
      ["the old hardcoded key", "tolamarketplace-admin-setup-2025"],
      ["an empty string", ""],
      ["a prefix of the real key", VALID_KEY.slice(0, -1)],
    ])("rejects %s with 403", async (_label, setupKey) => {
      const response = await POST(
        jsonRequest({
          email: "admin@tolatola.co",
          password: "a-long-enough-password",
          fullName: "Admin",
          setupKey,
        }),
      )

      expect(response.status).toBe(403)
      await expect(response.json()).resolves.toEqual({ error: "Invalid setup key" })
      expect(mockCreateClient).not.toHaveBeenCalled()
    })

    it.each([
      ["missing", undefined],
      ["a number", 12345],
      ["null", null],
      ["an object", { toString: () => VALID_KEY }],
    ])("rejects a setup key that is %s with 403 rather than throwing", async (_label, setupKey) => {
      const response = await POST(
        jsonRequest({
          email: "admin@tolatola.co",
          password: "a-long-enough-password",
          fullName: "Admin",
          setupKey,
        }),
      )

      expect(response.status).toBe(403)
      expect(mockCreateClient).not.toHaveBeenCalled()
    })

    it("checks the key before validating any other input", async () => {
      // No email/password/fullName at all: still a 403, not a 400, so the
      // route cannot be probed for validation behavior without the key.
      const response = await POST(jsonRequest({ setupKey: "wrong-key" }))

      expect(response.status).toBe(403)
    })
  })

  describe("input validation (with a valid setup key)", () => {
    beforeEach(() => {
      mockCreateClient.mockResolvedValue(supabaseStub().client)
    })

    it.each([
      ["email", { password: "a-long-enough-password", fullName: "Admin" }],
      ["password", { email: "admin@tolatola.co", fullName: "Admin" }],
      ["fullName", { email: "admin@tolatola.co", password: "a-long-enough-password" }],
    ])("returns 400 when %s is missing", async (_field, body) => {
      const response = await POST(jsonRequest({ ...body, setupKey: VALID_KEY }))

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toEqual({ error: "Missing required fields" })
    })

    it("returns 400 when the password is shorter than 8 characters", async () => {
      const response = await POST(
        jsonRequest({
          email: "admin@tolatola.co",
          password: "short",
          fullName: "Admin",
          setupKey: VALID_KEY,
        }),
      )

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toEqual({
        error: "Password must be at least 8 characters",
      })
    })
  })

  describe("one-time use", () => {
    it("returns 400 when an admin already exists", async () => {
      mockCreateClient.mockResolvedValue(
        supabaseStub({ existingAdmins: [{ id: "existing-admin" }] }).client,
      )

      const response = await POST(
        jsonRequest({
          email: "admin@tolatola.co",
          password: "a-long-enough-password",
          fullName: "Admin",
          setupKey: VALID_KEY,
        }),
      )

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toEqual({
        error: "Admin user already exists. This setup can only be used once.",
      })
    })

    it("returns 500 when the existing-admin lookup fails, rather than creating one anyway", async () => {
      const stub = supabaseStub({ checkError: { message: "db down" } })
      mockCreateClient.mockResolvedValue(stub.client)

      const response = await POST(
        jsonRequest({
          email: "admin@tolatola.co",
          password: "a-long-enough-password",
          fullName: "Admin",
          setupKey: VALID_KEY,
        }),
      )

      expect(response.status).toBe(500)
      expect(stub.spies.createUser).not.toHaveBeenCalled()
    })
  })

  describe("successful creation", () => {
    it("creates a confirmed admin user and returns its id", async () => {
      const stub = supabaseStub({ createdUserId: "admin-42" })
      mockCreateClient.mockResolvedValue(stub.client)

      const response = await POST(
        jsonRequest({
          email: "admin@tolatola.co",
          password: "a-long-enough-password",
          fullName: "Ada Admin",
          setupKey: VALID_KEY,
        }),
      )

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({
        success: true,
        message: "Admin user created successfully",
        userId: "admin-42",
      })
      expect(stub.spies.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "admin@tolatola.co",
          password: "a-long-enough-password",
          email_confirm: true,
          user_metadata: { user_type: "admin", full_name: "Ada Admin" },
        }),
      )
    })

    it("still succeeds when the follow-up profile update fails", async () => {
      // The DB trigger is expected to set the role, so a failed update is
      // logged but must not fail the request.
      const stub = supabaseStub({ updateError: { message: "update failed" } })
      mockCreateClient.mockResolvedValue(stub.client)

      const response = await POST(
        jsonRequest({
          email: "admin@tolatola.co",
          password: "a-long-enough-password",
          fullName: "Ada Admin",
          setupKey: VALID_KEY,
        }),
      )

      expect(response.status).toBe(200)
    })

    it("returns 500 when Supabase auth rejects the new user", async () => {
      const stub = supabaseStub({ authError: { message: "email already registered" } })
      mockCreateClient.mockResolvedValue(stub.client)

      const response = await POST(
        jsonRequest({
          email: "admin@tolatola.co",
          password: "a-long-enough-password",
          fullName: "Ada Admin",
          setupKey: VALID_KEY,
        }),
      )

      expect(response.status).toBe(500)
      await expect(response.json()).resolves.toEqual({ error: "email already registered" })
    })
  })

  it("returns 500 when the request body is not valid JSON", async () => {
    const response = await POST({
      json: async () => {
        throw new Error("Unexpected end of JSON input")
      },
    } as never)

    expect(response.status).toBe(500)
  })
})
