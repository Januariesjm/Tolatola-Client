/**
 * Tests for lib/search/image-scaling.ts.
 *
 * Extracted from the image-search compression in
 * components/layout/product-search.tsx. The canvas half is unreachable in jsdom,
 * but this is where the damage would be: an aspect-ratio slip distorts every
 * photo a buyer searches with, and failing to clamp means a phone capture is
 * stored at full size and blows the sessionStorage quota.
 */

import { SEARCH_IMAGE_MAX_DIMENSION, scaleToFit } from "@/lib/search/image-scaling"

describe("scaleToFit within the limit", () => {
  it("leaves a small image untouched", () => {
    expect(scaleToFit(320, 240, 800)).toEqual({ width: 320, height: 240 })
  })

  it("does not upscale", () => {
    // Enlarging adds bytes without adding detail.
    expect(scaleToFit(100, 100, 800)).toEqual({ width: 100, height: 100 })
  })

  it("leaves an image exactly at the limit untouched", () => {
    expect(scaleToFit(800, 600, 800)).toEqual({ width: 800, height: 600 })
  })

  it("leaves a square exactly at the limit untouched", () => {
    expect(scaleToFit(800, 800, 800)).toEqual({ width: 800, height: 800 })
  })
})

describe("scaleToFit landscape", () => {
  it("clamps the width and scales the height", () => {
    expect(scaleToFit(1600, 1200, 800)).toEqual({ width: 800, height: 600 })
  })

  it("preserves the aspect ratio", () => {
    const { width, height } = scaleToFit(4000, 3000, 800)

    expect(width / height).toBeCloseTo(4000 / 3000, 2)
  })

  it("handles an extreme panorama without collapsing the short edge to zero", () => {
    const { width, height } = scaleToFit(8000, 400, 800)

    expect(width).toBe(800)
    expect(height).toBeGreaterThan(0)
  })
})

describe("scaleToFit portrait", () => {
  it("clamps the height and scales the width", () => {
    expect(scaleToFit(1200, 1600, 800)).toEqual({ width: 600, height: 800 })
  })

  it("preserves the aspect ratio", () => {
    const { width, height } = scaleToFit(3000, 4000, 800)

    expect(width / height).toBeCloseTo(3000 / 4000, 2)
  })

  it("handles a typical phone capture", () => {
    // 12MP portrait, the common case for a buyer photographing a product.
    expect(scaleToFit(3024, 4032, 800)).toEqual({ width: 600, height: 800 })
  })
})

describe("scaleToFit squares and edges", () => {
  it("scales a square to the limit on both sides", () => {
    expect(scaleToFit(2000, 2000, 800)).toEqual({ width: 800, height: 800 })
  })

  it("never returns an edge longer than the limit", () => {
    for (const [w, h] of [
      [1600, 1200],
      [1200, 1600],
      [2000, 2000],
      [5000, 137],
      [137, 5000],
    ]) {
      const scaled = scaleToFit(w, h, 800)
      expect(scaled.width).toBeLessThanOrEqual(800)
      expect(scaled.height).toBeLessThanOrEqual(800)
    }
  })

  it("returns whole pixels", () => {
    const { width, height } = scaleToFit(1333, 999, 800)

    expect(Number.isInteger(width)).toBe(true)
    expect(Number.isInteger(height)).toBe(true)
  })

  it("defaults to the shared maximum dimension", () => {
    expect(scaleToFit(4000, 3000)).toEqual(scaleToFit(4000, 3000, SEARCH_IMAGE_MAX_DIMENSION))
  })

  it("respects a caller-supplied maximum", () => {
    expect(scaleToFit(1000, 500, 200)).toEqual({ width: 200, height: 100 })
  })
})
