/**
 * Tests for the admin product list rules (lib/admin/product-filters.ts).
 *
 * The search predicate and the five sort orders used to be inline inside a
 * `useMemo`, so which fields matched and what each sort option actually
 * ordered by was only discoverable by reading the component. These pin it.
 */

import {
  compareProducts,
  countProductsByStatus,
  filterAndSortProducts,
  matchesProductQuery,
  matchesStatusFilter,
  type ProductSortOption,
} from "@/lib/admin/product-filters"
import type { AdminProduct } from "@/lib/types/admin"

const product = (over: Partial<AdminProduct> = {}): AdminProduct =>
  ({
    id: "p-1",
    name: "Sisal Basket",
    price: 30000,
    description: "Hand woven basket",
    status: "approved",
    created_at: "2026-02-01T00:00:00Z",
    categories: { name: "Crafts" },
    shops: { name: "Dodoma Crafts", vendors: { business_name: "Dodoma Crafts Ltd" } },
    ...over,
  }) as AdminProduct

describe("matchesStatusFilter", () => {
  it("matches everything when the filter is 'all'", () => {
    expect(matchesStatusFilter(product({ status: "anything" }), "all")).toBe(true)
  })

  it("matches case-insensitively", () => {
    expect(matchesStatusFilter(product({ status: "Approved" }), "approved")).toBe(true)
  })

  it("does not match a different status", () => {
    expect(matchesStatusFilter(product({ status: "pending" }), "approved")).toBe(false)
  })

  it("treats a missing status as not matching a specific filter", () => {
    expect(matchesStatusFilter(product({ status: null }), "approved")).toBe(false)
  })
})

describe("matchesProductQuery", () => {
  it.each([
    ["name", "sisal"],
    ["description", "hand woven"],
    ["id", "p-1"],
    ["the shop name", "dodoma crafts"],
    ["the vendor's business name", "crafts ltd"],
    ["the category name", "crafts"],
  ])("matches on %s", (_field, query) => {
    expect(matchesProductQuery(product(), query)).toBe(true)
  })

  it("is case-insensitive", () => {
    expect(matchesProductQuery(product(), "SISAL")).toBe(true)
  })

  it("does not match an unrelated query", () => {
    expect(matchesProductQuery(product(), "maize")).toBe(false)
  })

  it("does not throw for a product missing every optional relation", () => {
    const sparse = { id: "p-9" } as AdminProduct

    expect(matchesProductQuery(sparse, "anything")).toBe(false)
  })
})

describe("compareProducts", () => {
  const older = product({ id: "a", created_at: "2026-01-01T00:00:00Z", price: 10000, name: "Banana" })
  const newer = product({ id: "b", created_at: "2026-02-01T00:00:00Z", price: 30000, name: "Apple" })

  it("orders newest first", () => {
    expect(compareProducts(older, newer, "newest")).toBeGreaterThan(0)
  })

  it("orders oldest first", () => {
    expect(compareProducts(older, newer, "oldest")).toBeLessThan(0)
  })

  it("orders highest price first", () => {
    expect(compareProducts(older, newer, "price_high")).toBeGreaterThan(0)
  })

  it("orders lowest price first", () => {
    expect(compareProducts(older, newer, "price_low")).toBeLessThan(0)
  })

  it("orders names alphabetically", () => {
    expect(compareProducts(older, newer, "name_asc")).toBeGreaterThan(0)
  })

  it("leaves the pair unordered for an unrecognised sort option", () => {
    expect(compareProducts(older, newer, "bogus" as ProductSortOption)).toBe(0)
  })

  it("treats a missing created_at as the epoch rather than throwing", () => {
    expect(() => compareProducts(product({ created_at: null }), newer, "newest")).not.toThrow()
  })
})

describe("filterAndSortProducts", () => {
  const list = [
    product({ id: "a", name: "Sisal Basket", status: "approved", created_at: "2026-01-01T00:00:00Z" }),
    product({ id: "b", name: "Maize Flour", status: "pending", created_at: "2026-02-01T00:00:00Z", categories: null, shops: null }),
  ]

  it("applies the status filter before the search query", () => {
    const result = filterAndSortProducts(list, { statusFilter: "approved", query: "", sortBy: "newest" })

    expect(result.map((p) => p.id)).toEqual(["a"])
  })

  it("narrows by the search query within the filtered status", () => {
    const result = filterAndSortProducts(list, { statusFilter: "all", query: "maize", sortBy: "newest" })

    expect(result.map((p) => p.id)).toEqual(["b"])
  })

  it("sorts the filtered result", () => {
    const result = filterAndSortProducts(list, { statusFilter: "all", query: "", sortBy: "oldest" })

    expect(result.map((p) => p.id)).toEqual(["a", "b"])
  })

  it("trims the query before checking whether it is blank", () => {
    const result = filterAndSortProducts(list, { statusFilter: "all", query: "   ", sortBy: "newest" })

    expect(result).toHaveLength(2)
  })

  it("returns an empty list when nothing matches", () => {
    expect(filterAndSortProducts(list, { statusFilter: "all", query: "zzz", sortBy: "newest" })).toEqual([])
  })
})

describe("countProductsByStatus", () => {
  it("counts each status independently of the others", () => {
    const list = [
      product({ status: "approved" }),
      product({ status: "approved" }),
      product({ status: "pending" }),
      product({ status: "rejected" }),
    ]

    expect(countProductsByStatus(list)).toEqual({ total: 4, approved: 2, pending: 1, rejected: 1 })
  })

  it("counts case-insensitively", () => {
    expect(countProductsByStatus([product({ status: "Approved" })]).approved).toBe(1)
  })

  it("returns all zeros for an empty list", () => {
    expect(countProductsByStatus([])).toEqual({ total: 0, approved: 0, pending: 0, rejected: 0 })
  })

  it("does not count a status outside the three tracked buckets", () => {
    const counts = countProductsByStatus([product({ status: "draft" })])

    expect(counts).toEqual({ total: 1, approved: 0, pending: 0, rejected: 0 })
  })
})
