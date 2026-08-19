/**
 * Tests for the client-side API wrapper (lib/api-client.ts).
 *
 * Verifies:
 * - Token retrieval from Supabase session
 * - Correct delegation to api.get/post/patch/put/delete
 * - Public (unauthenticated) API calls
 * - Profile-specific helpers (clientApiPatchProfile, clientApiPostProfileAvatar)
 */

// Mock the Supabase client
const mockGetSession = jest.fn()
jest.mock("@supabase/auth-helpers-nextjs", () => ({
  createClientComponentClient: () => ({
    auth: {
      getSession: mockGetSession,
    },
  }),
}))

// Mock the base api module
const mockApiGet = jest.fn()
const mockApiPost = jest.fn()
const mockApiPatch = jest.fn()
const mockApiPut = jest.fn()
const mockApiDelete = jest.fn()
jest.mock("@/lib/api", () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
    post: (...args: unknown[]) => mockApiPost(...args),
    patch: (...args: unknown[]) => mockApiPatch(...args),
    put: (...args: unknown[]) => mockApiPut(...args),
    delete: (...args: unknown[]) => mockApiDelete(...args),
  },
}))

import {
  clientApiGet,
  clientApiPost,
  clientApiPatch,
  clientApiPut,
  clientApiDelete,
  clientApiPostPublic,
  clientApiPatchProfile,
  clientApiPostProfileAvatar,
} from "@/lib/api-client"

beforeEach(() => {
  jest.clearAllMocks()
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000/api"
})

describe("api-client (lib/api-client.ts)", () => {
  describe("authenticated API calls", () => {
    it("clientApiGet retrieves session token and passes it to api.get", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "test-token" } },
      })
      mockApiGet.mockResolvedValue({ data: [] })

      const result = await clientApiGet("products")

      expect(mockGetSession).toHaveBeenCalled()
      expect(mockApiGet).toHaveBeenCalledWith("products", "test-token")
      expect(result).toEqual({ data: [] })
    })

    it("clientApiPost passes body and token to api.post", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "auth-token" } },
      })
      const body = { name: "Product" }
      mockApiPost.mockResolvedValue({ success: true })

      await clientApiPost("products", body)

      expect(mockApiPost).toHaveBeenCalledWith("products", body, "auth-token")
    })

    it("clientApiPatch passes body and token to api.patch", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "tk" } },
      })
      mockApiPatch.mockResolvedValue({})

      await clientApiPatch("products/1", { name: "Updated" })

      expect(mockApiPatch).toHaveBeenCalledWith("products/1", { name: "Updated" }, "tk")
    })

    it("clientApiPut passes body and token to api.put", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "put-token" } },
      })
      mockApiPut.mockResolvedValue({})

      await clientApiPut("products/1", { status: "active" })

      expect(mockApiPut).toHaveBeenCalledWith("products/1", { status: "active" }, "put-token")
    })

    it("clientApiDelete passes token to api.delete", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "del-token" } },
      })
      mockApiDelete.mockResolvedValue({ deleted: true })

      await clientApiDelete("products/1")

      expect(mockApiDelete).toHaveBeenCalledWith("products/1", "del-token")
    })

    it("passes undefined token when session has no access_token", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
      })
      mockApiGet.mockResolvedValue({})

      await clientApiGet("products")

      expect(mockApiGet).toHaveBeenCalledWith("products", undefined)
    })
  })

  describe("public (unauthenticated) API calls", () => {
    it("clientApiPostPublic calls api.post without a token", async () => {
      const body = { phone: "+255700000000" }
      mockApiPost.mockResolvedValue({ success: true })

      await clientApiPostPublic("request-otp", body)

      expect(mockApiPost).toHaveBeenCalledWith("request-otp", body, undefined)
      // Should NOT call getSession
      expect(mockGetSession).not.toHaveBeenCalled()
    })
  })

  describe("profile helpers", () => {
    it("clientApiPatchProfile returns full response with ok, status, data", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "profile-token" } },
      })

      const profileResponse = { success: true, profile: { full_name: "John" } }
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(profileResponse),
      })

      const result = await clientApiPatchProfile({ full_name: "John" })

      expect(result.ok).toBe(true)
      expect(result.status).toBe(200)
      expect(result.data.success).toBe(true)
      expect(result.data.profile?.full_name).toBe("John")
    })

    it("clientApiPatchProfile handles failed response gracefully", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "token" } },
      })

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "Invalid field" }),
      })

      const result = await clientApiPatchProfile({ full_name: "" })

      expect(result.ok).toBe(false)
      expect(result.status).toBe(400)
      expect(result.data.error).toBe("Invalid field")
    })

    it("clientApiPatchProfile handles JSON parse failure", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "token" } },
      })

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("invalid json")),
      })

      const result = await clientApiPatchProfile({ phone: "123" })

      expect(result.ok).toBe(false)
      expect(result.status).toBe(500)
      expect(result.data).toEqual({})
    })

    it("clientApiPostProfileAvatar returns full response", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "avatar-token" } },
      })

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, profile_image_url: "https://example.com/img.jpg" }),
      })

      const result = await clientApiPostProfileAvatar("base64imagedata")

      expect(result.ok).toBe(true)
      expect(result.data.profile_image_url).toBe("https://example.com/img.jpg")
    })
  })
})
