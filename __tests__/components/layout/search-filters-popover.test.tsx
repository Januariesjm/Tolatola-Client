import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { SearchFiltersPopover } from "@/components/layout/search-filters-popover"

/**
 * Tests for components/layout/search-filters-popover.tsx.
 *
 * A filter panel for the /shop page: categories, a location text filter, a
 * price range, and a sort order. Every control writes straight through to the
 * URL via router.push("/shop?...") -- there is no "submit" step beyond each
 * control's own Apply button (or, for categories/sort, an immediate push on
 * change) -- so the behavior worth pinning is which query params a given
 * interaction sets, clears, or leaves alone, and that it starts from
 * whatever is already in the URL.
 *
 * next/navigation is re-mocked locally (overriding the global stub in
 * jest.setup.ts, which always returns an empty URLSearchParams) so each test
 * can seed the initial query string and assert on router.push calls -- same
 * technique as the pathname override in mobile-bottom-nav.test.tsx.
 */

const pushMock = jest.fn()
let mockSearchParams = new URLSearchParams()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: (...args: unknown[]) => pushMock(...args) }),
  useSearchParams: () => mockSearchParams,
}))

function category(overrides: Record<string, unknown> = {}) {
  return { id: "c1", name: "Agriculture", slug: "agriculture", ...overrides }
}

const categories = [
  category({ id: "c1", name: "Agriculture", slug: "agriculture" }),
  category({ id: "c2", name: "Handicrafts", slug: "handicrafts" }),
]

/** The last URL router.push was called with, decoded for readable assertions. */
function lastPushedUrl() {
  const call = pushMock.mock.calls[pushMock.mock.calls.length - 1]
  return call ? decodeURIComponent(call[0] as string) : undefined
}

beforeEach(() => {
  jest.clearAllMocks()
  mockSearchParams = new URLSearchParams()
})

describe("SearchFiltersPopover rendering current filter state", () => {
  it("lists the top-level categories as checkboxes", () => {
    render(<SearchFiltersPopover categories={categories} onClose={jest.fn()} />)

    expect(screen.getByLabelText("Agriculture")).toBeInTheDocument()
    expect(screen.getByLabelText("Handicrafts")).toBeInTheDocument()
  })

  it("excludes subcategories from the category list", () => {
    render(
      <SearchFiltersPopover
        categories={[...categories, category({ id: "c3", name: "Crops", slug: "crops", parent_id: "c1" })]}
        onClose={jest.fn()}
      />,
    )

    expect(screen.queryByLabelText("Crops")).not.toBeInTheDocument()
  })

  it("pre-checks the category matching the URL's category slug", () => {
    mockSearchParams = new URLSearchParams({ category: "handicrafts" })
    render(<SearchFiltersPopover categories={categories} onClose={jest.fn()} />)

    expect(screen.getByLabelText("Handicrafts")).toBeChecked()
    expect(screen.getByLabelText("Agriculture")).not.toBeChecked()
  })

  it("leaves every category unchecked when the URL has no category", () => {
    render(<SearchFiltersPopover categories={categories} onClose={jest.fn()} />)

    expect(screen.getByLabelText("Agriculture")).not.toBeChecked()
    expect(screen.getByLabelText("Handicrafts")).not.toBeChecked()
  })

  it("pre-fills the location input from the URL", () => {
    mockSearchParams = new URLSearchParams({ location: "Arusha" })
    render(<SearchFiltersPopover categories={categories} onClose={jest.fn()} />)

    expect(screen.getByPlaceholderText(/dar es salaam, pwani/i)).toHaveValue("Arusha")
  })

  it("pre-fills the price inputs from the URL", () => {
    mockSearchParams = new URLSearchParams({ minPrice: "1000", maxPrice: "5000" })
    render(<SearchFiltersPopover categories={categories} onClose={jest.fn()} />)

    expect(screen.getByPlaceholderText(/200 tzs/i)).toHaveValue(1000)
    expect(screen.getByPlaceholderText(/50,000,000 tzs/i)).toHaveValue(5000)
  })

  it("pre-selects the sort option named in the URL", () => {
    mockSearchParams = new URLSearchParams({ sort: "price_desc" })
    render(<SearchFiltersPopover categories={categories} onClose={jest.fn()} />)

    expect(screen.getByLabelText("Price: High to Low")).toBeChecked()
    expect(screen.getByLabelText("Name (A-Z)")).not.toBeChecked()
  })

  it("defaults to sorting by name when the URL has no sort", () => {
    render(<SearchFiltersPopover categories={categories} onClose={jest.fn()} />)

    expect(screen.getByLabelText("Name (A-Z)")).toBeChecked()
  })
})

describe("SearchFiltersPopover changing a filter", () => {
  it("checking a category pushes it into the URL immediately", () => {
    render(<SearchFiltersPopover categories={categories} onClose={jest.fn()} />)

    fireEvent.click(screen.getByLabelText("Agriculture"))

    expect(pushMock).toHaveBeenCalledTimes(1)
    expect(lastPushedUrl()).toBe("/shop?category=agriculture&sort=name")
  })

  it("unchecking the only selected category removes it from the URL", () => {
    mockSearchParams = new URLSearchParams({ category: "agriculture" })
    render(<SearchFiltersPopover categories={categories} onClose={jest.fn()} />)

    fireEvent.click(screen.getByLabelText("Agriculture"))

    expect(lastPushedUrl()).toBe("/shop?sort=name")
  })

  it("applying a location filter pushes it into the URL", () => {
    render(<SearchFiltersPopover categories={categories} onClose={jest.fn()} />)

    fireEvent.change(screen.getByPlaceholderText(/dar es salaam, pwani/i), { target: { value: "Arusha" } })
    fireEvent.click(screen.getByRole("button", { name: "Apply" }))

    expect(lastPushedUrl()).toBe("/shop?location=Arusha&sort=name")
  })

  it("pressing Enter in the location input applies it too", () => {
    render(<SearchFiltersPopover categories={categories} onClose={jest.fn()} />)

    const field = screen.getByPlaceholderText(/dar es salaam, pwani/i)
    fireEvent.change(field, { target: { value: "Arusha" } })
    fireEvent.keyDown(field, { key: "Enter" })

    expect(lastPushedUrl()).toBe("/shop?location=Arusha&sort=name")
  })

  it("blank location clears the location param instead of sending an empty value", () => {
    mockSearchParams = new URLSearchParams({ location: "Arusha" })
    render(<SearchFiltersPopover categories={categories} onClose={jest.fn()} />)

    fireEvent.change(screen.getByPlaceholderText(/dar es salaam, pwani/i), { target: { value: "   " } })
    fireEvent.click(screen.getByRole("button", { name: "Apply" }))

    expect(lastPushedUrl()).toBe("/shop?sort=name")
  })

  it("applying a price range pushes both bounds into the URL", () => {
    render(<SearchFiltersPopover categories={categories} onClose={jest.fn()} />)

    fireEvent.change(screen.getByPlaceholderText(/200 tzs/i), { target: { value: "1000" } })
    fireEvent.change(screen.getByPlaceholderText(/50,000,000 tzs/i), { target: { value: "5000" } })
    fireEvent.click(screen.getByRole("button", { name: "Apply Price" }))

    expect(lastPushedUrl()).toBe("/shop?minPrice=1000&maxPrice=5000&sort=name")
  })

  it("applying only a minimum price omits the maximum from the URL", () => {
    render(<SearchFiltersPopover categories={categories} onClose={jest.fn()} />)

    fireEvent.change(screen.getByPlaceholderText(/200 tzs/i), { target: { value: "1000" } })
    fireEvent.click(screen.getByRole("button", { name: "Apply Price" }))

    expect(lastPushedUrl()).toBe("/shop?minPrice=1000&sort=name")
  })

  it("choosing a sort option pushes it immediately, without an Apply step", () => {
    render(<SearchFiltersPopover categories={categories} onClose={jest.fn()} />)

    fireEvent.click(screen.getByLabelText("Price: Low to High"))

    expect(lastPushedUrl()).toBe("/shop?sort=price_asc")
  })

  it("preserves unrelated params already in the URL when a filter changes", () => {
    mockSearchParams = new URLSearchParams({ q: "kanga" })
    render(<SearchFiltersPopover categories={categories} onClose={jest.fn()} />)

    fireEvent.click(screen.getByLabelText("Agriculture"))

    expect(lastPushedUrl()).toBe("/shop?q=kanga&category=agriculture&sort=name")
  })

  it("never scrolls the page when applying a filter", () => {
    render(<SearchFiltersPopover categories={categories} onClose={jest.fn()} />)

    fireEvent.click(screen.getByLabelText("Agriculture"))

    expect(pushMock.mock.calls[0][1]).toEqual({ scroll: false })
  })
})

describe("SearchFiltersPopover clearing filters", () => {
  it("resets every control back to its default", () => {
    mockSearchParams = new URLSearchParams({ category: "agriculture", location: "Arusha", minPrice: "1000", sort: "price_desc" })
    render(<SearchFiltersPopover categories={categories} onClose={jest.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Clear" }))

    expect(screen.getByLabelText("Agriculture")).not.toBeChecked()
    expect(screen.getByPlaceholderText(/dar es salaam, pwani/i)).toHaveValue("")
    expect(screen.getByPlaceholderText(/200 tzs/i)).toHaveValue(null)
    expect(screen.getByLabelText("Name (A-Z)")).toBeChecked()
  })

  it("pushes a URL dropping category, location, and minPrice", () => {
    mockSearchParams = new URLSearchParams({ category: "agriculture", location: "Arusha", minPrice: "1000" })
    render(<SearchFiltersPopover categories={categories} onClose={jest.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Clear" }))

    expect(lastPushedUrl()).toBe("/shop?sort=name")
  })

  /**
   * Component quirk, not a testability workaround: clearFilters calls
   * updateFilters({ maxPrice: undefined, ... }) to clear the field, but
   * updateFilters resolves it as
   * `partial.maxPrice ?? (maxPriceInput ? parseInt(maxPriceInput) : undefined)`.
   * `??` treats an explicit `undefined` the same as "not provided", so it
   * falls through to the fallback -- which reads `maxPriceInput`, the
   * component's own state variable, still holding its pre-clear value in this
   * same synchronous handler (setMaxPriceInput("") only takes effect on the
   * next render). Net effect: clearing filters silently keeps a previously
   * applied maxPrice. minPrice doesn't share the bug because clearFilters
   * passes it as `0`, not `undefined`, so `??` never falls back for it.
   */
  it("does not clear an existing maxPrice (known quirk: undefined falls back to the stale input state)", () => {
    mockSearchParams = new URLSearchParams({ minPrice: "1000", maxPrice: "5000" })
    render(<SearchFiltersPopover categories={categories} onClose={jest.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Clear" }))

    expect(lastPushedUrl()).toBe("/shop?maxPrice=5000&sort=name")
  })
})

describe("SearchFiltersPopover closing", () => {
  it("calls onClose when the close button is clicked", () => {
    const onClose = jest.fn()
    render(<SearchFiltersPopover categories={categories} onClose={onClose} />)

    // The close (X) button is the only icon-only button without its own text label.
    const buttons = screen.getAllByRole("button")
    const closeButton = buttons.find((b) => b.querySelector("svg.lucide-x"))
    fireEvent.click(closeButton as HTMLElement)

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
