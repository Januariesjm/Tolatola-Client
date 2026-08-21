/**
 * Tests for ProductService (lib/services/product.service.ts).
 *
 * The service builds a Supabase query conditionally, so what matters is which
 * filters get applied for a given set of options — and that the
 * approved-products-only constraint is never optional.
 */

const chain: Record<string, jest.Mock> = {}
let queryResult: { data?: unknown } = { data: [] }
const from = jest.fn(() => chain)

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({ from })),
}))

import { ProductService } from "@/lib/services/product.service"

/**
 * Rebuilds the query-builder double. Every chainable method returns the builder;
 * `single` and awaiting the builder itself resolve to `queryResult`.
 */
function resetChain() {
  for (const key of Object.keys(chain)) delete chain[key]
  for (const method of ["select", "eq", "gte", "lte", "ilike", "update", "order", "limit"]) {
    chain[method] = jest.fn(() => chain)
  }
  chain.single = jest.fn(async () => queryResult)
  // Awaiting the builder resolves the query, which is how getProducts reads it.
  chain.then = jest.fn((resolve: (v: unknown) => unknown) => Promise.resolve(queryResult).then(resolve))
}

const service = new ProductService()

beforeEach(() => {
  jest.clearAllMocks()
  queryResult = { data: [] }
  resetChain()
})

describe("getProducts", () => {
  it("selects from products with the shop and category joins", async () => {
    await service.getProducts()

    expect(from).toHaveBeenCalledWith("products")
    expect(chain.select).toHaveBeenCalledTimes(1)
    expect(String(chain.select.mock.calls[0][0])).toContain("shops")
    expect(String(chain.select.mock.calls[0][0])).toContain("categories")
  })

  it("always restricts to approved products", async () => {
    await service.getProducts()

    expect(chain.eq).toHaveBeenCalledWith("approval_status", "approved")
  })

  it("applies no optional filters when given none", async () => {
    await service.getProducts()

    // Only the approval_status constraint.
    expect(chain.eq).toHaveBeenCalledTimes(1)
    expect(chain.gte).not.toHaveBeenCalled()
    expect(chain.lte).not.toHaveBeenCalled()
    expect(chain.ilike).not.toHaveBeenCalled()
  })

  it("filters by category", async () => {
    await service.getProducts({ category: "cat-1" })

    expect(chain.eq).toHaveBeenCalledWith("category_id", "cat-1")
  })

  it("applies a price range", async () => {
    await service.getProducts({ minPrice: 1000, maxPrice: 5000 })

    expect(chain.gte).toHaveBeenCalledWith("price", 1000)
    expect(chain.lte).toHaveBeenCalledWith("price", 5000)
  })

  it("searches by name with wildcards", async () => {
    await service.getProducts({ search: "basket" })

    expect(chain.ilike).toHaveBeenCalledWith("name", "%basket%")
  })

  it("combines every filter", async () => {
    await service.getProducts({ category: "cat-1", minPrice: 10, maxPrice: 20, search: "x" })

    expect(chain.eq).toHaveBeenCalledWith("category_id", "cat-1")
    expect(chain.gte).toHaveBeenCalledWith("price", 10)
    expect(chain.lte).toHaveBeenCalledWith("price", 20)
    expect(chain.ilike).toHaveBeenCalledWith("name", "%x%")
  })

  it("skips a zero minPrice, since the check is truthiness not presence", async () => {
    // Documents current behaviour: `if (filters?.minPrice)` treats 0 as absent,
    // so "free items and up" cannot be expressed.
    await service.getProducts({ minPrice: 0 })

    expect(chain.gte).not.toHaveBeenCalled()
  })

  it("skips an empty search string", async () => {
    await service.getProducts({ search: "" })

    expect(chain.ilike).not.toHaveBeenCalled()
  })

  it("returns the rows", async () => {
    queryResult = { data: [{ id: "p-1" }, { id: "p-2" }] }

    await expect(service.getProducts()).resolves.toHaveLength(2)
  })

  it("returns an empty array when the query yields no data", async () => {
    queryResult = { data: null }

    await expect(service.getProducts()).resolves.toEqual([])
  })
})

describe("getProduct", () => {
  it("fetches a single product by id", async () => {
    queryResult = { data: { id: "p-1" } }

    await expect(service.getProduct("p-1")).resolves.toEqual({ id: "p-1" })
    expect(chain.eq).toHaveBeenCalledWith("id", "p-1")
    expect(chain.single).toHaveBeenCalled()
  })

  it("includes the shop phone, which the detail page shows", async () => {
    await service.getProduct("p-1")

    expect(String(chain.select.mock.calls[0][0])).toContain("phone")
  })

  it("does NOT restrict to approved products", async () => {
    // Worth pinning: a vendor previewing their own pending product relies on
    // this, so adding an approval filter here would be a regression.
    await service.getProduct("p-1")

    expect(chain.eq).toHaveBeenCalledTimes(1)
    expect(chain.eq).toHaveBeenCalledWith("id", "p-1")
  })

  it("returns null when the row is missing", async () => {
    queryResult = { data: null }

    await expect(service.getProduct("nope")).resolves.toBeNull()
  })
})

describe("updateStock", () => {
  it("updates only the stock quantity for that product", async () => {
    await service.updateStock("p-1", 42)

    expect(chain.update).toHaveBeenCalledWith({ stock_quantity: 42 })
    expect(chain.eq).toHaveBeenCalledWith("id", "p-1")
  })

  it("allows setting stock to zero", async () => {
    await service.updateStock("p-1", 0)

    expect(chain.update).toHaveBeenCalledWith({ stock_quantity: 0 })
  })
})
