/**
 * Tests for useProductImages (hooks/use-product-images.ts).
 *
 * Extracted from use-product-form.ts. What matters: images seed only when
 * both a product and `open` are present, upload appends rather than
 * replaces, a failed upload reports through `onError` and clears the
 * uploading flag, and `reset` clears the list.
 */

import { act, renderHook } from "@testing-library/react"
import { useProductImages } from "@/hooks/use-product-images"

function mockUpload(result: { ok: boolean; url?: string } | "reject") {
  const fetchMock = jest.fn(async () => {
    if (result === "reject") throw new Error("network down")
    if (!result.ok) return { ok: false } as Response
    return { ok: true, json: async () => ({ url: result.url }) } as Response
  })
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

function fileList(files: File[]): FileList {
  const indexed: Record<number, File> = {}
  files.forEach((file, i) => {
    indexed[i] = file
  })
  return {
    length: files.length,
    item: (i: number) => files[i] ?? null,
    [Symbol.iterator]: function* () {
      yield* files
    },
    ...indexed,
  } as unknown as FileList
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("useProductImages", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => useProductImages(null, false, jest.fn()))

    expect(result.current.images).toEqual([])
    expect(result.current.uploadingImage).toBe(false)
  })

  it("seeds from the product only once open", () => {
    const product = { images: ["a.jpg", "b.jpg"] }
    const { result, rerender } = renderHook(({ open }) => useProductImages(product, open, jest.fn()), {
      initialProps: { open: false },
    })

    expect(result.current.images).toEqual([])

    rerender({ open: true })

    expect(result.current.images).toEqual(["a.jpg", "b.jpg"])
  })

  it("appends uploaded images to the existing list", async () => {
    mockUpload({ ok: true, url: "new.jpg" })
    const product = { images: ["a.jpg"] }
    const { result } = renderHook(() => useProductImages(product, true, jest.fn()))

    await act(async () => {
      await result.current.handleImageUpload({
        target: { files: fileList([new File(["x"], "new.jpg")]) },
      } as unknown as React.ChangeEvent<HTMLInputElement>)
    })

    expect(result.current.images).toEqual(["a.jpg", "new.jpg"])
    expect(result.current.uploadingImage).toBe(false)
  })

  it("clears a previous error before starting, and reports a failure", async () => {
    mockUpload({ ok: false })
    const onError = jest.fn()
    const { result } = renderHook(() => useProductImages(null, false, onError))

    await act(async () => {
      await result.current.handleImageUpload({
        target: { files: fileList([new File(["x"], "bad.jpg")]) },
      } as unknown as React.ChangeEvent<HTMLInputElement>)
    })

    expect(onError).toHaveBeenNthCalledWith(1, null)
    expect(onError).toHaveBeenLastCalledWith("Failed to upload image")
    expect(result.current.uploadingImage).toBe(false)
  })

  it("does nothing when no files are selected", async () => {
    const fetchMock = mockUpload({ ok: true, url: "x.jpg" })
    const { result } = renderHook(() => useProductImages(null, false, jest.fn()))

    await act(async () => {
      await result.current.handleImageUpload({
        target: { files: fileList([]) },
      } as unknown as React.ChangeEvent<HTMLInputElement>)
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("removes an image by index", () => {
    const { result } = renderHook(() => useProductImages(null, false, jest.fn()))

    act(() => result.current.setImages(["a.jpg", "b.jpg", "c.jpg"]))
    act(() => result.current.handleRemoveImage(1))

    expect(result.current.images).toEqual(["a.jpg", "c.jpg"])
  })

  it("reset clears the images", () => {
    const { result } = renderHook(() => useProductImages(null, false, jest.fn()))

    act(() => result.current.setImages(["a.jpg"]))
    act(() => result.current.reset())

    expect(result.current.images).toEqual([])
  })
})
