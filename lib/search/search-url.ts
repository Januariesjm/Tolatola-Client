/**
 * Builds the /shop URL for a search, carrying whichever filters are active.
 *
 * Extracted from components/layout/product-search.tsx. The header search box and
 * the shop page have to agree on these parameter names exactly -- a mismatch
 * silently drops a filter, and the buyer sees unfiltered results with no
 * indication anything was lost. Worth pinning in one place with tests rather
 * than living inside a component's closure.
 *
 * Blank and whitespace-only values are omitted rather than sent empty, so the
 * shop page does not have to distinguish "no filter" from "empty filter".
 */

export interface ProductSearchFilters {
  query?: string
  location?: string
  /** Sent as strings: they come straight from text inputs. */
  minPrice?: string
  maxPrice?: string
}

/** Query-parameter name per filter. The shop page reads these same keys. */
const PARAM_NAMES = {
  query: "search",
  location: "location",
  minPrice: "minPrice",
  maxPrice: "maxPrice",
} as const

export function buildProductSearchUrl(filters: ProductSearchFilters): string {
  const params = new URLSearchParams()

  for (const [key, param] of Object.entries(PARAM_NAMES) as Array<[keyof ProductSearchFilters, string]>) {
    const value = filters[key]?.trim()
    if (value) params.set(param, value)
  }

  return `/shop?${params.toString()}`
}

/**
 * How many filters beyond the search term are active.
 *
 * Drives the badge on the filter button, so the buyer can see a filter is
 * narrowing their results even when the filter panel is collapsed. The search
 * term itself is not counted -- it is visible in the input.
 */
export function countActiveFilters(filters: ProductSearchFilters): number {
  return [filters.location, filters.minPrice, filters.maxPrice].filter((value) => Boolean(value?.trim())).length
}
