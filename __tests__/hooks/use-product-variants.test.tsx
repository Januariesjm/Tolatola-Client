/**
 * Tests for useProductVariants (hooks/use-product-variants.ts).
 *
 * Extracted from use-product-form.ts. What matters: colors/sizes seed only
 * once both a product and `open` are present, a size is only added once
 * (no duplicates) and its price is optional, removing a size drops its
 * price entry too, and `reset` deliberately does NOT clear `newColorName`
 * or `newSize` — that asymmetry is preserved from the original.
 */

import { act, renderHook } from "@testing-library/react"
import { useProductVariants } from "@/hooks/use-product-variants"

function mockUpload(result: { ok: boolean; url?: string } | "reject") {
  const fetchMock = jest.fn(async () => {
    if (result === "reject") throw new Error("network down")
    if (!result.ok) return { ok: false } as Response
    return { ok: true, json: async () => ({ url: result.url }) } as Response
  })
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("useProductVariants", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => useProductVariants(null, false, jest.fn()))

    expect(result.current.colors).toEqual([])
    expect(result.current.sizes).toEqual([])
    expect(result.current.sizePrices).toEqual({})
  })

  it("seeds colors, sizes and size prices only once open", () => {
    const product = { colors: [{ name: "Red" }], sizes: ["M"], size_prices: { M: 100 } }
    const { result, rerender } = renderHook(({ open }) => useProductVariants(product, open, jest.fn()), {
      initialProps: { open: false },
    })

    expect(result.current.colors).toEqual([])

    rerender({ open: true })

    expect(result.current.colors).toEqual([{ name: "Red" }])
    expect(result.current.sizes).toEqual(["M"])
    expect(result.current.sizePrices).toEqual({ M: 100 })
  })

  describe("handleAddColor", () => {
    it("adds a color with a valid price, then clears the inputs", () => {
      const { result } = renderHook(() => useProductVariants(null, false, jest.fn()))

      act(() => result.current.setNewColorName("Blue"))
      act(() => result.current.setNewColorPrice("50"))
      act(() => result.current.handleAddColor())

      expect(result.current.colors).toEqual([{ name: "Blue", image: "", price: 50 }])
      expect(result.current.newColorName).toBe("")
      expect(result.current.newColorPrice).toBe("")
    })

    it("omits price when it is not a positive number", () => {
      const { result } = renderHook(() => useProductVariants(null, false, jest.fn()))

      act(() => result.current.setNewColorName("Green"))
      act(() => result.current.handleAddColor())

      expect(result.current.colors).toEqual([{ name: "Green", image: "" }])
    })

    it("does nothing when the name is blank", () => {
      const { result } = renderHook(() => useProductVariants(null, false, jest.fn()))

      act(() => result.current.setNewColorName("   "))
      act(() => result.current.handleAddColor())

      expect(result.current.colors).toEqual([])
    })
  })

  it("removes a color by index", () => {
    const { result } = renderHook(() => useProductVariants(null, false, jest.fn()))

    act(() => result.current.setNewColorName("Red"))
    act(() => result.current.handleAddColor())
    act(() => result.current.setNewColorName("Blue"))
    act(() => result.current.handleAddColor())

    act(() => result.current.handleRemoveColor(0))

    expect(result.current.colors).toEqual([{ name: "Blue", image: "" }])
  })

  describe("handleColorImageUpload", () => {
    it("clears a previous error, sets the new color image on success", async () => {
      mockUpload({ ok: true, url: "swatch.jpg" })
      const onError = jest.fn()
      const { result } = renderHook(() => useProductVariants(null, false, onError))

      await act(async () => {
        await result.current.handleColorImageUpload({
          target: { files: [new File(["x"], "swatch.jpg")] },
        } as unknown as React.ChangeEvent<HTMLInputElement>)
      })

      expect(onError).toHaveBeenNthCalledWith(1, null)
      expect(result.current.newColorImage).toBe("swatch.jpg")
      expect(result.current.uploadingColorImage).toBe(false)
    })

    it("reports a failed upload", async () => {
      mockUpload({ ok: false })
      const onError = jest.fn()
      const { result } = renderHook(() => useProductVariants(null, false, onError))

      await act(async () => {
        await result.current.handleColorImageUpload({
          target: { files: [new File(["x"], "bad.jpg")] },
        } as unknown as React.ChangeEvent<HTMLInputElement>)
      })

      expect(onError).toHaveBeenLastCalledWith("Failed to upload image")
    })
  })

  describe("handleAddSize", () => {
    it("adds a size, uppercased, with an optional price", () => {
      const { result } = renderHook(() => useProductVariants(null, false, jest.fn()))

      act(() => result.current.setNewSize("m"))
      act(() => result.current.setNewSizePrice("200"))
      act(() => result.current.handleAddSize())

      expect(result.current.sizes).toEqual(["M"])
      expect(result.current.sizePrices).toEqual({ M: 200 })
      expect(result.current.newSize).toBe("")
      expect(result.current.newSizePrice).toBe("")
    })

    it("does not add a duplicate size", () => {
      const { result } = renderHook(() => useProductVariants(null, false, jest.fn()))

      act(() => result.current.setNewSize("M"))
      act(() => result.current.handleAddSize())
      act(() => result.current.setNewSize("m"))
      act(() => result.current.handleAddSize())

      expect(result.current.sizes).toEqual(["M"])
    })

    it("does nothing when blank", () => {
      const { result } = renderHook(() => useProductVariants(null, false, jest.fn()))

      act(() => result.current.setNewSize("   "))
      act(() => result.current.handleAddSize())

      expect(result.current.sizes).toEqual([])
    })
  })

  it("removes a size and its price entry", () => {
    const { result } = renderHook(() => useProductVariants(null, false, jest.fn()))

    act(() => result.current.setNewSize("M"))
    act(() => result.current.setNewSizePrice("100"))
    act(() => result.current.handleAddSize())
    act(() => result.current.setNewSize("L"))
    act(() => result.current.handleAddSize())

    act(() => result.current.handleRemoveSize(0))

    expect(result.current.sizes).toEqual(["L"])
    expect(result.current.sizePrices).toEqual({})
  })

  describe("reset", () => {
    it("clears colors, sizes and prices, but not the name/size drafts", () => {
      const { result } = renderHook(() => useProductVariants(null, false, jest.fn()))

      act(() => result.current.setNewColorName("Red"))
      act(() => result.current.setNewColorPrice("50"))
      act(() => result.current.handleAddColor())
      act(() => result.current.setNewSize("M"))
      act(() => result.current.setNewSizePrice("100"))
      act(() => result.current.handleAddSize())

      act(() => result.current.setNewColorName("Blue"))
      act(() => result.current.setNewSize("L"))

      act(() => result.current.reset())

      expect(result.current.colors).toEqual([])
      expect(result.current.sizes).toEqual([])
      expect(result.current.sizePrices).toEqual({})
      expect(result.current.newColorPrice).toBe("")
      expect(result.current.newSizePrice).toBe("")
      // Deliberately preserved: matches the original resetForm()'s scope.
      expect(result.current.newColorName).toBe("Blue")
      expect(result.current.newSize).toBe("L")
    })
  })
})
