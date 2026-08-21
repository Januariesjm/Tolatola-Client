import type { AdminProduct } from "@/lib/types/admin"

/**
 * Filter, search and sort rules for the admin product list.
 *
 * Extracted from components/admin/product-management-tab.tsx, where this was
 * a `useMemo` mixing a status filter, a six-field search, and a five-way sort
 * inline in the component. Pure and testable here: which fields a search
 * matches, and what each sort option actually orders by, are product
 * decisions that should be visible without reading a component.
 */

export type ProductStatusFilter = "all" | "approved" | "pending" | "rejected" | string

export type ProductSortOption = "newest" | "oldest" | "price_high" | "price_low" | "name_asc"

/**
 * Whether a product's status matches the filter, case-insensitively.
 * "all" always matches.
 */
export function matchesStatusFilter(product: AdminProduct, statusFilter: ProductStatusFilter): boolean {
  if (statusFilter === "all") return true
  return (product.status || "").toLowerCase() === statusFilter.toLowerCase()
}

/**
 * Fields an admin can search a product by: name, description, id, the shop's
 * name, the owning vendor's business name, and the category name.
 */
export function matchesProductQuery(product: AdminProduct, query: string): boolean {
  const needle = query.toLowerCase()

  return Boolean(
    (product.name || "").toLowerCase().includes(needle) ||
    (product.description || "").toLowerCase().includes(needle) ||
    (product.id || "").toLowerCase().includes(needle) ||
    (product.shops?.name || "").toLowerCase().includes(needle) ||
    (product.shops?.vendors?.business_name || "").toLowerCase().includes(needle) ||
    (product.categories?.name || "").toLowerCase().includes(needle),
  )
}

/**
 * Orders two products for `sortBy`.
 *
 * An unrecognised option (there is no default case in the switch this replaces)
 * leaves the pair unordered, matching the original behaviour rather than
 * silently picking a fallback sort.
 */
export function compareProducts(a: AdminProduct, b: AdminProduct, sortBy: ProductSortOption): number {
  switch (sortBy) {
    case "newest":
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    case "oldest":
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    case "price_high":
      return (b.price || 0) - (a.price || 0)
    case "price_low":
      return (a.price || 0) - (b.price || 0)
    case "name_asc":
      return (a.name || "").localeCompare(b.name || "")
    default:
      return 0
  }
}

/** Filters by status and search query, then sorts. Status is checked before the query, matching the original short-circuit order. */
export function filterAndSortProducts(
  products: AdminProduct[],
  options: { statusFilter: ProductStatusFilter; query: string; sortBy: ProductSortOption },
): AdminProduct[] {
  const { statusFilter, query, sortBy } = options
  const trimmedQuery = query.trim()

  return products
    .filter((product) => {
      if (!matchesStatusFilter(product, statusFilter)) return false
      if (!trimmedQuery) return true
      return matchesProductQuery(product, trimmedQuery)
    })
    .sort((a, b) => compareProducts(a, b, sortBy))
}

export interface ProductStatusCounts {
  total: number
  approved: number
  pending: number
  rejected: number
}

/** Counts products per status, case-insensitively. */
export function countProductsByStatus(products: AdminProduct[]): ProductStatusCounts {
  return {
    total: products.length,
    approved: products.filter((p) => (p.status || "").toLowerCase() === "approved").length,
    pending: products.filter((p) => (p.status || "").toLowerCase() === "pending").length,
    rejected: products.filter((p) => (p.status || "").toLowerCase() === "rejected").length,
  }
}
