/**
 * Tests for lib/search/search-url.ts.
 *
 * Extracted from components/layout/product-search.tsx. The parameter names are
 * a contract with the shop page: rename one on either side and the filter is
 * silently dropped, so the buyer gets unfiltered results with nothing on screen
 * saying so. These pin the names as well as the omission rules.
 */

import { buildProductSearchUrl, countActiveFilters } from "@/lib/search/search-url"

/** Parses the query string so assertions do not depend on parameter order. */
const paramsOf = (url: string) => new URLSearchParams(url.split("?")[1] ?? "")

describe("buildProductSearchUrl", () => {
  it("targets the shop page", () => {
    expect(buildProductSearchUrl({ query: "kanga" }).split("?")[0]).toBe("/shop")
  })

  it("sends the search term as `search`", () => {
    expect(paramsOf(buildProductSearchUrl({ query: "kanga" })).get("search")).toBe("kanga")
  })

  it("sends the location as `location`", () => {
    expect(paramsOf(buildProductSearchUrl({ location: "Mwanza" })).get("location")).toBe("Mwanza")
  })

  it("sends the price bounds as `minPrice` and `maxPrice`", () => {
    const params = paramsOf(buildProductSearchUrl({ minPrice: "1000", maxPrice: "50000" }))

    expect(params.get("minPrice")).toBe("1000")
    expect(params.get("maxPrice")).toBe("50000")
  })

  it("carries every filter at once", () => {
    const params = paramsOf(buildProductSearchUrl({ query: "kanga", location: "Mwanza", minPrice: "1000", maxPrice: "50000" }))

    expect([...params.keys()].sort()).toEqual(["location", "maxPrice", "minPrice", "search"])
  })

  it("omits a blank filter rather than sending it empty", () => {
    const params = paramsOf(buildProductSearchUrl({ query: "kanga", location: "" }))

    expect(params.has("location")).toBe(false)
  })

  it("omits an absent filter", () => {
    const params = paramsOf(buildProductSearchUrl({ query: "kanga" }))

    expect(params.has("minPrice")).toBe(false)
  })

  it("omits a whitespace-only filter", () => {
    const params = paramsOf(buildProductSearchUrl({ query: "kanga", location: "   " }))

    expect(params.has("location")).toBe(false)
  })

  it("trims the values it does send", () => {
    expect(paramsOf(buildProductSearchUrl({ query: "  kanga  " })).get("search")).toBe("kanga")
  })

  it("produces a bare shop URL when nothing is set", () => {
    expect(buildProductSearchUrl({})).toBe("/shop?")
  })

  it("encodes a term with spaces", () => {
    const url = buildProductSearchUrl({ query: "kanga fabric" })

    expect(url).toContain("kanga+fabric")
    expect(paramsOf(url).get("search")).toBe("kanga fabric")
  })

  it("encodes a term with characters that would break the query string", () => {
    const url = buildProductSearchUrl({ query: "50% off & more" })

    expect(paramsOf(url).get("search")).toBe("50% off & more")
  })
})

describe("countActiveFilters", () => {
  it("counts nothing when no filters are set", () => {
    expect(countActiveFilters({})).toBe(0)
  })

  it("does not count the search term itself", () => {
    // The term is visible in the input, so badging it would be redundant.
    expect(countActiveFilters({ query: "kanga" })).toBe(0)
  })

  it("counts a location", () => {
    expect(countActiveFilters({ location: "Mwanza" })).toBe(1)
  })

  it("counts each price bound separately", () => {
    expect(countActiveFilters({ minPrice: "1000", maxPrice: "50000" })).toBe(2)
  })

  it("counts all three", () => {
    expect(countActiveFilters({ query: "kanga", location: "Mwanza", minPrice: "1000", maxPrice: "50000" })).toBe(3)
  })

  it("ignores blank and whitespace-only filters", () => {
    expect(countActiveFilters({ location: "", minPrice: "   ", maxPrice: "50000" })).toBe(1)
  })
})
