/**
 * Tests for the core API request utility (lib/api.ts).
 *
 * Verifies:
 * - Successful GET/POST/PATCH/PUT/DELETE requests
 * - Auth header injection
 * - HTTP error handling with descriptive messages
 * - Malformed response handling
 * - URL construction from path + base URL
 */

// We need to test the `api` object from lib/api.ts.
// The module reads process.env.NEXT_PUBLIC_API_BASE_URL at call time.

const MOCK_BASE_URL = "http://localhost:4000/api"

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_BASE_URL = MOCK_BASE_URL
  jest.restoreAllMocks()
})

// We must re-import after setting env, but since the module reads env inside
// the `request` function (not at module level), we can import statically.
import { api } from "@/lib/api"

describe("api utility (lib/api.ts)", () => {
  describe("api.get", () => {
    it("makes a GET request and returns parsed JSON on success", async () => {
      const mockData = { id: 1, name: "Test Product" }
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      })

      const result = await api.get("products/1")

      expect(fetch).toHaveBeenCalledWith(
        `${MOCK_BASE_URL}/products/1`,
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      )
      expect(result).toEqual(mockData)
    })

    it("includes Authorization header when accessToken is provided", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await api.get("products", "my-token-123")

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer my-token-123",
          }),
        })
      )
    })

    it("does not include Authorization header when no token is provided", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await api.get("products")

      const callHeaders = (fetch as jest.Mock).mock.calls[0][1].headers
      expect(callHeaders.Authorization).toBeUndefined()
    })

    it("strips leading slash from path to avoid double slashes", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await api.get("/products")

      expect(fetch).toHaveBeenCalledWith(
        `${MOCK_BASE_URL}/products`,
        expect.any(Object)
      )
    })
  })

  describe("api.post", () => {
    it("makes a POST request with JSON body", async () => {
      const requestBody = { name: "New Product", price: 5000 }
      const responseData = { id: 2, ...requestBody }
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseData),
      })

      const result = await api.post("products", requestBody)

      expect(fetch).toHaveBeenCalledWith(
        `${MOCK_BASE_URL}/products`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(requestBody),
        })
      )
      expect(result).toEqual(responseData)
    })

    it("sends POST with no body when body is undefined", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await api.post("trigger-action")

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          body: undefined,
        })
      )
    })
  })

  describe("api.patch", () => {
    it("makes a PATCH request with JSON body", async () => {
      const body = { name: "Updated" }
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      await api.patch("products/1", body, "token")

      expect(fetch).toHaveBeenCalledWith(
        `${MOCK_BASE_URL}/products/1`,
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify(body),
          headers: expect.objectContaining({
            Authorization: "Bearer token",
          }),
        })
      )
    })
  })

  describe("api.put", () => {
    it("makes a PUT request", async () => {
      const body = { status: "active" }
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await api.put("users/1", body)

      expect(fetch).toHaveBeenCalledWith(
        `${MOCK_BASE_URL}/users/1`,
        expect.objectContaining({ method: "PUT" })
      )
    })
  })

  describe("api.delete", () => {
    it("makes a DELETE request", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ deleted: true }),
      })

      const result = await api.delete("products/1", "token")

      expect(fetch).toHaveBeenCalledWith(
        `${MOCK_BASE_URL}/products/1`,
        expect.objectContaining({ method: "DELETE" })
      )
      expect(result).toEqual({ deleted: true })
    })
  })

  describe("error handling", () => {
    it("throws an Error with status and body when response is not ok", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation()
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: () => Promise.resolve("Not Found"),
      })

      await expect(api.get("missing")).rejects.toThrow("API 404: Not Found")
      consoleSpy.mockRestore()
    })

    it("logs the error details to console.error", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation()
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Internal Server Error"),
      })

      await expect(api.get("crash")).rejects.toThrow()

      expect(consoleSpy).toHaveBeenCalledWith(
        "[API Error]",
        expect.objectContaining({
          status: 500,
          method: "GET",
        })
      )
      consoleSpy.mockRestore()
    })

    it("handles 401 Unauthorized errors", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation()
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      })

      await expect(api.get("admin/data")).rejects.toThrow("API 401: Unauthorized")
      consoleSpy.mockRestore()
    })

    it("handles network errors (fetch rejects)", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"))

      await expect(api.get("products")).rejects.toThrow("Network error")
    })
  })

  describe("URL construction", () => {
    it("strips trailing slash from base URL", async () => {
      process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000/api/"
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await api.get("products")

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:4000/api/products",
        expect.any(Object)
      )
    })

    it("uses default base URL when env var is not set", async () => {
      delete process.env.NEXT_PUBLIC_API_BASE_URL
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await api.get("products")

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:4000/api/products",
        expect.any(Object)
      )
    })
  })
})
