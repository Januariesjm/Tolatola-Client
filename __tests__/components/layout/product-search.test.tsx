import React from "react"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { useRouter } from "next/navigation"
import { ProductSearch } from "@/components/layout/product-search"
import { buildProductSearchUrl } from "@/lib/search/search-url"

// Wraps the real implementation in a jest.fn so calls/args/return values can
// be asserted on below (see the comment on the "submitting a full search"
// describe block for why this is needed instead of a plain spyOn). Next's SWC
// transform emits named exports as non-configurable accessor properties, so
// `jest.spyOn(module, "buildProductSearchUrl")` throws "Cannot redefine
// property" -- replacing the export via jest.mock works instead.
// countActiveFilters is left as the real implementation; only the URL builder
// needs instrumenting.
jest.mock("@/lib/search/search-url", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const actual = jest.requireActual("@/lib/search/search-url")
  return { ...actual, buildProductSearchUrl: jest.fn(actual.buildProductSearchUrl) }
})

const mockedBuildUrl = buildProductSearchUrl as jest.Mock

/**
 * Tests for components/layout/product-search.tsx.
 *
 * The header search box: a debounced Supabase query (300ms) that renders a
 * dropdown of product suggestions plus inline location/price filters, an
 * Enter-to-submit and "Apply Filters" path that both hand off to the /shop
 * page via buildProductSearchUrl, and a photo-search path that compresses an
 * uploaded image and stores it in sessionStorage for the shop page to read.
 *
 * The Supabase client (globally mocked in jest.setup.ts) is re-mocked here
 * with a bespoke `from()` chain so each test controls exactly which rows a
 * search returns and can assert on how many times the debounced query ran --
 * see __tests__/setup/mocks.ts for the shared alternative this overrides.
 *
 * Real timers are used throughout (rather than jest.useFakeTimers()) so the
 * component's own 300ms setTimeout can be waited out with `waitFor`/a plain
 * delay -- this sidesteps having to coordinate fake timers with
 * userEvent/Promise microtasks for the image-compression flow below, at the
 * cost of a few tests each taking a few hundred ms of real wall time.
 */

let productRows: Array<Record<string, unknown>> = []
const fromMock = jest.fn()

function makeChain() {
  const chain: Record<string, unknown> = {}
  chain.select = jest.fn(() => chain)
  chain.eq = jest.fn(() => chain)
  chain.or = jest.fn(() => chain)
  chain.limit = jest.fn(() => Promise.resolve({ data: productRows, error: null }))
  return chain
}

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: (...args: unknown[]) => fromMock(...args) }),
}))

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: "p1",
    name: "Kanga Fabric",
    price: 12000,
    images: ["https://cdn.test/kanga.jpg"],
    location: "Dar es Salaam",
    shops: { name: "Asha Shop", region: "Dar es Salaam", district: "Kinondoni" },
    ...overrides,
  }
}

const input = () => screen.getByPlaceholderText("Search products, locations...")
const locationInput = () => screen.getByPlaceholderText(/dar es salaam, pwani/i)
const minPriceInput = () => screen.getByPlaceholderText(/200 tzs/i)
const maxPriceInput = () => screen.getByPlaceholderText(/50,000,000 tzs/i)

/** Waits for the 300ms debounce to fire and the resulting query to resolve. */
async function search(value: string) {
  fireEvent.change(input(), { target: { value } })
  await waitFor(() => expect(fromMock).toHaveBeenCalled(), { timeout: 2000 })
}

beforeEach(() => {
  jest.clearAllMocks()
  productRows = []
  fromMock.mockImplementation(() => makeChain())
  sessionStorage.clear()
})

describe("ProductSearch debounced query", () => {
  it("renders the search input", () => {
    render(<ProductSearch />)
    expect(input()).toBeInTheDocument()
  })

  it("does not query while the term is under two characters", async () => {
    render(<ProductSearch />)
    fireEvent.change(input(), { target: { value: "a" } })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400))
    })
    expect(fromMock).not.toHaveBeenCalled()
  })

  it("debounces so rapid keystrokes only fire one query", async () => {
    render(<ProductSearch />)
    fireEvent.change(input(), { target: { value: "k" } })
    fireEvent.change(input(), { target: { value: "ka" } })
    fireEvent.change(input(), { target: { value: "kanga" } })
    expect(fromMock).not.toHaveBeenCalled()

    await waitFor(() => expect(fromMock).toHaveBeenCalledTimes(1), { timeout: 2000 })
  })

  it("shows matching results once the query settles", async () => {
    productRows = [product()]
    render(<ProductSearch />)
    await search("kanga")

    expect(await screen.findByText("Kanga Fabric")).toBeInTheDocument()
    expect(screen.getByText(/1 results found/i)).toBeInTheDocument()
  })

  it("shows an empty state when nothing matches", async () => {
    productRows = []
    render(<ProductSearch />)
    await search("zzz")

    expect(await screen.findByText('No products found for "zzz"')).toBeInTheDocument()
  })

  it("does not crash and settles into the empty state when the query itself fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {})
    fromMock.mockImplementation(() => {
      const chain: Record<string, unknown> = {}
      chain.select = jest.fn(() => chain)
      chain.eq = jest.fn(() => chain)
      chain.or = jest.fn(() => chain)
      chain.limit = jest.fn(() => Promise.reject(new Error("network down")))
      return chain
    })
    render(<ProductSearch />)
    // The dropdown otherwise only opens once a query *succeeds* (setIsOpen(true)
    // runs after the awaited query, inside the try block) -- focusing first
    // opens it independently, so the empty state renders even though this
    // query is about to reject.
    fireEvent.focus(input())
    fireEvent.change(input(), { target: { value: "kanga" } })

    expect(await screen.findByText('No products found for "kanga"')).toBeInTheDocument()
    jest.restoreAllMocks()
  })

  it("keeps the filter panel open when the query is cleared while filters are shown", () => {
    render(<ProductSearch />)
    fireEvent.focus(input())
    fireEvent.change(input(), { target: { value: "a" } })

    fireEvent.change(input(), { target: { value: "" } })

    expect(screen.getByPlaceholderText(/dar es salaam, pwani/i)).toBeInTheDocument()
  })
})

describe("ProductSearch selecting a suggestion", () => {
  it("links each suggestion to its product page", async () => {
    productRows = [product({ id: "p9", name: "Batik Wrap" })]
    render(<ProductSearch />)
    await search("batik")

    const link = await screen.findByRole("link", { name: /batik wrap/i })
    expect(link).toHaveAttribute("href", "/product/p9")
  })

  it("clears and closes the search when a suggestion is clicked", async () => {
    productRows = [product({ id: "p9", name: "Batik Wrap" })]
    render(<ProductSearch />)
    await search("batik")

    const link = await screen.findByRole("link", { name: /batik wrap/i })
    fireEvent.click(link)

    await waitFor(() => expect(input()).toHaveValue(""))
    expect(screen.queryByText("Batik Wrap")).not.toBeInTheDocument()
  })

  it("offers a View All Results link to the full shop search", async () => {
    productRows = [product()]
    render(<ProductSearch />)
    await search("kanga")
    await screen.findByText("Kanga Fabric")

    expect(screen.getByRole("link", { name: /view all results/i })).toHaveAttribute("href", "/shop?search=kanga")
  })

  it("closes the dropdown when View All Results is clicked", async () => {
    productRows = [product()]
    render(<ProductSearch />)
    await search("kanga")
    await screen.findByText("Kanga Fabric")

    fireEvent.click(screen.getByRole("link", { name: /view all results/i }))

    await waitFor(() => expect(screen.queryByText("Kanga Fabric")).not.toBeInTheDocument())
  })
})

describe("ProductSearch submitting a full search", () => {
  /**
   * handleFullSearch navigates via a plain `window.location.href =` assignment.
   * jsdom's Location is spec-unforgeable here (own, non-configurable `href`
   * accessor -- same constraint documented in
   * __tests__/components/utils/global-error-logger.test.tsx for `reload()`),
   * and assigning it to any path other than the current one is a silent
   * no-op: jsdom logs "Not implemented: navigation" and leaves `href`
   * unchanged, so the resulting URL can't be read back off `window.location`.
   *
   * buildProductSearchUrl (lib/search/search-url.ts, already unit-tested for
   * its own URL-shape correctness) is instrumented instead, via the
   * jest.mock at the top of this file: it observes exactly what the
   * component computed and handed to the navigation, which is the behavior
   * actually worth pinning.
   */
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("navigates to the shop page when Enter is pressed with a query", () => {
    render(<ProductSearch />)
    fireEvent.change(input(), { target: { value: "kanga" } })
    fireEvent.keyDown(input(), { key: "Enter" })

    expect(mockedBuildUrl).toHaveBeenCalledWith({ query: "kanga", location: "", minPrice: "", maxPrice: "" })
    expect(mockedBuildUrl).toHaveReturnedWith("/shop?search=kanga")
  })

  it("does not submit on Enter while the query is under two characters", () => {
    render(<ProductSearch />)
    fireEvent.change(input(), { target: { value: "k" } })
    fireEvent.keyDown(input(), { key: "Enter" })

    expect(mockedBuildUrl).not.toHaveBeenCalled()
  })

  it("navigates with the location filter when Apply Filters is clicked", () => {
    render(<ProductSearch />)
    fireEvent.focus(input())
    fireEvent.change(locationInput(), { target: { value: "Arusha" } })

    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }))

    expect(mockedBuildUrl).toHaveReturnedWith("/shop?location=Arusha")
  })

  it("combines the query and price filters into the shop URL", () => {
    render(<ProductSearch />)
    fireEvent.change(input(), { target: { value: "kanga" } })
    fireEvent.focus(input())
    fireEvent.change(minPriceInput(), { target: { value: "5000" } })
    fireEvent.change(maxPriceInput(), { target: { value: "20000" } })

    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }))

    expect(mockedBuildUrl).toHaveReturnedWith("/shop?search=kanga&minPrice=5000&maxPrice=20000")
  })

  it("pressing Enter in the location filter also submits", () => {
    render(<ProductSearch />)
    fireEvent.focus(input())
    fireEvent.change(locationInput(), { target: { value: "Arusha" } })
    fireEvent.keyDown(locationInput(), { key: "Enter" })

    expect(mockedBuildUrl).toHaveReturnedWith("/shop?location=Arusha")
  })

  it("pressing Enter in the min price filter also submits", () => {
    render(<ProductSearch />)
    fireEvent.focus(input())
    fireEvent.change(minPriceInput(), { target: { value: "3000" } })
    fireEvent.keyDown(minPriceInput(), { key: "Enter" })

    expect(mockedBuildUrl).toHaveReturnedWith("/shop?minPrice=3000")
  })

  it("pressing Enter in the max price filter also submits", () => {
    render(<ProductSearch />)
    fireEvent.focus(input())
    fireEvent.change(maxPriceInput(), { target: { value: "9000" } })
    fireEvent.keyDown(maxPriceInput(), { key: "Enter" })

    expect(mockedBuildUrl).toHaveReturnedWith("/shop?maxPrice=9000")
  })
})

describe("ProductSearch inline filters", () => {
  it("does not show the Apply Filters button until a filter has a value", () => {
    render(<ProductSearch />)
    fireEvent.focus(input())

    expect(screen.queryByRole("button", { name: /apply filters/i })).not.toBeInTheDocument()
  })

  it("badges the filter toggle with the number of active filters", () => {
    render(<ProductSearch />)
    fireEvent.focus(input())
    fireEvent.change(locationInput(), { target: { value: "Arusha" } })
    fireEvent.change(minPriceInput(), { target: { value: "1000" } })

    expect(screen.getByTitle("Filters")).toHaveTextContent("2")
  })

  it("shows a hint to type a query before any search has run", () => {
    render(<ProductSearch />)
    fireEvent.focus(input())

    expect(screen.getByText(/type a product name above to search/i)).toBeInTheDocument()
  })

  it("closes the dropdown when clicking outside the search box", () => {
    render(<ProductSearch />)
    fireEvent.focus(input())
    expect(screen.getByText(/type a product name above to search/i)).toBeInTheDocument()

    fireEvent.mouseDown(document.body)

    expect(screen.queryByText(/type a product name above to search/i)).not.toBeInTheDocument()
  })

  it("does not close the dropdown when clicking inside it", () => {
    render(<ProductSearch />)
    fireEvent.focus(input())
    const hint = screen.getByText(/type a product name above to search/i)

    fireEvent.mouseDown(hint)
    fireEvent.click(hint)

    expect(screen.getByText(/type a product name above to search/i)).toBeInTheDocument()
  })

  it("the filter toggle button opens the panel without needing to focus the input", () => {
    render(<ProductSearch />)

    fireEvent.click(screen.getByTitle("Filters"))

    expect(screen.getByPlaceholderText(/dar es salaam, pwani/i)).toBeInTheDocument()
  })

  it("the filter toggle button closes the panel on a second click", () => {
    render(<ProductSearch />)
    fireEvent.click(screen.getByTitle("Filters"))
    expect(screen.getByPlaceholderText(/dar es salaam, pwani/i)).toBeInTheDocument()

    fireEvent.click(screen.getByTitle("Filters"))

    expect(screen.queryByPlaceholderText(/dar es salaam, pwani/i)).not.toBeInTheDocument()
  })

  it("clicking the camera button opens the hidden file picker", () => {
    render(<ProductSearch />)
    const fileInput = document.getElementById("image-search-input") as HTMLInputElement
    const clickSpy = jest.spyOn(fileInput, "click")

    fireEvent.click(screen.getByTitle("Search by Image"))

    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it("the clear button resets the query and filters", () => {
    render(<ProductSearch />)
    fireEvent.focus(input())
    fireEvent.change(input(), { target: { value: "kanga" } })
    fireEvent.change(locationInput(), { target: { value: "Arusha" } })

    const clearButton = screen.getByRole("button", { name: "" })
    fireEvent.click(clearButton)

    expect(input()).toHaveValue("")
  })
})

describe("ProductSearch image search", () => {
  /** Minimal FileReader stub: readAsDataURL resolves synchronously, matching
   *  the pattern used in __tests__/hooks/use-blog-editor.test.tsx, but calling
   *  `onload` (not `onloadend`) since that's what compressImageForSearch reads. */
  function stubFileReader() {
    class FR {
      result: string | null = null
      onload: ((ev: { target: { result: string | null } }) => void) | null = null
      onerror: (() => void) | null = null
      readAsDataURL() {
        this.result = "data:image/jpeg;base64,AAA"
        this.onload?.({ target: this })
      }
    }
    global.FileReader = FR as unknown as typeof FileReader
  }

  /**
   * jsdom does not decode images, so a real `<img>`'s `onload` never fires
   * for a data URL, and compressImageForSearch's promise would hang forever.
   * Intercept only `document.createElement("img")` so the canvas path
   * (unstubbed, and unsupported by jsdom without the optional `canvas`
   * package) still falls through to its no-context branch naturally.
   */
  function stubImageElement() {
    const realCreateElement = document.createElement.bind(document)
    jest.spyOn(document, "createElement").mockImplementation((tagName: string, ...rest: unknown[]) => {
      if (tagName !== "img") return realCreateElement(tagName, ...(rest as []))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const img: any = { width: 800, height: 600 }
      Object.defineProperty(img, "src", {
        set() {
          Promise.resolve().then(() => img.onload?.())
        },
      })
      return img
    })
  }

  beforeEach(() => {
    stubFileReader()
    stubImageElement()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("stores the compressed photo and hands off to the shop page", async () => {
    render(<ProductSearch />)
    const router = useRouter()
    const fileInput = document.getElementById("image-search-input") as HTMLInputElement
    const file = new File(["binary"], "photo.jpg", { type: "image/jpeg" })

    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/shop?imageSearch=pending"))
    expect(sessionStorage.getItem("tolatola_image_search")).toBe("data:image/jpeg;base64,AAA")
  })

  it("shows a loading indicator on the camera button while compressing", async () => {
    render(<ProductSearch />)
    const fileInput = document.getElementById("image-search-input") as HTMLInputElement
    const file = new File(["binary"], "photo.jpg", { type: "image/jpeg" })

    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(screen.getByTitle("Search by Image").querySelector(".animate-ping")).toBeInTheDocument()

    const router = useRouter()
    await waitFor(() => expect(router.push).toHaveBeenCalled())
  })

  it("stops the loading indicator and does not navigate when storing the photo fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {})
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded")
    })
    render(<ProductSearch />)
    const router = useRouter()
    const fileInput = document.getElementById("image-search-input") as HTMLInputElement
    const file = new File(["binary"], "photo.jpg", { type: "image/jpeg" })

    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => expect(screen.getByTitle("Search by Image").querySelector(".animate-ping")).not.toBeInTheDocument())
    expect(router.push).not.toHaveBeenCalled()
  })
})
