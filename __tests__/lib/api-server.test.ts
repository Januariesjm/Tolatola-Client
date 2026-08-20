/**
 * Tests for the server-side API wrapper (lib/api-server.ts).
 *
 * Verifies:
 * - Session token retrieval from Supabase server client
 * - Correct delegation to api.get/post/patch/put with token
 * - Behavior when user is not authenticated
 */

// Mock next/headers
jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}))

// Mock Supabase server client
const mockGetUser = jest.fn()
const mockGetSession = jest.fn()
jest.mock("@supabase/auth-helpers-nextjs", () => ({
  createServerComponentClient: () => ({
    auth: {
      getUser: mockGetUser,
      getSession: mockGetSession,
    },
  }),
}))

// Mock the base api module
const mockApiGet = jest.fn()
const mockApiPost = jest.fn()
const mockApiPatch = jest.fn()
const mockApiPut = jest.fn()
jest.mock("@/lib/api", () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
    post: (...args: unknown[]) => mockApiPost(...args),
    patch: (...args: unknown[]) => mockApiPatch(...args),
    put: (...args: unknown[]) => mockApiPut(...args),
  },
}))

import { serverApiGet, serverApiPost, serverApiPatch, serverApiPut } from "@/lib/api-server"

beforeEach(() => {
  jest.clearAllMocks()
})

describe("api-server (lib/api-server.ts)", () => {
  describe("authenticated server calls", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@test.com" } },
      })
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "server-token" } },
      })
    })

    it("serverApiGet retrieves session token and passes it to api.get", async () => {
      mockApiGet.mockResolvedValue({ data: [{ id: 1 }] })

      const result = await serverApiGet("products")

      expect(mockGetUser).toHaveBeenCalled()
      expect(mockGetSession).toHaveBeenCalled()
      expect(mockApiGet).toHaveBeenCalledWith("products", "server-token", undefined)
      expect(result).toEqual({ data: [{ id: 1 }] })
    })

    it("serverApiGet passes fetchOptions to api.get", async () => {
      mockApiGet.mockResolvedValue({})

      await serverApiGet("products", { next: { revalidate: 60 } })

      expect(mockApiGet).toHaveBeenCalledWith("products", "server-token", { next: { revalidate: 60 } })
    })

    it("serverApiPost passes body and token to api.post", async () => {
      const body = { name: "New Item" }
      mockApiPost.mockResolvedValue({ id: 5 })

      const result = await serverApiPost("products", body)

      expect(mockApiPost).toHaveBeenCalledWith("products", body, "server-token")
      expect(result).toEqual({ id: 5 })
    })

    it("serverApiPatch passes body and token to api.patch", async () => {
      mockApiPatch.mockResolvedValue({ updated: true })

      await serverApiPatch("products/1", { name: "Updated" })

      expect(mockApiPatch).toHaveBeenCalledWith("products/1", { name: "Updated" }, "server-token")
    })

    it("serverApiPut passes body and token to api.put", async () => {
      mockApiPut.mockResolvedValue({})

      await serverApiPut("products/1", { status: "active" })

      expect(mockApiPut).toHaveBeenCalledWith("products/1", { status: "active" }, "server-token")
    })
  })

  describe("unauthenticated server calls", () => {
    it("passes undefined token when user is not authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      mockApiGet.mockResolvedValue({})

      await serverApiGet("public-data")

      // Should not call getSession if user is null
      expect(mockGetSession).not.toHaveBeenCalled()
      expect(mockApiGet).toHaveBeenCalledWith("public-data", undefined, undefined)
    })
  })
})
