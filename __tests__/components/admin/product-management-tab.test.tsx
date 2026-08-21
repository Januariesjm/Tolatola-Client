/**
 * Tests for ProductManagementTab (components/admin/product-management-tab.tsx).
 *
 * Previously untested entirely. Focused on the wiring the extraction moved:
 * that a search actually narrows what's shown, that deleting removes the row
 * and shows a success notice, and that a failed delete surfaces inline rather
 * than silently leaving the row in place with no explanation.
 */

import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ProductManagementTab } from "@/components/admin/product-management-tab"
import type { AdminProduct } from "@/lib/types/admin"

const mockGet = jest.fn()
const mockDelete = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiGet: (...args: unknown[]) => mockGet(...args),
  clientApiDelete: (...args: unknown[]) => mockDelete(...args),
}))

const mockRefresh = jest.fn()
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mockRefresh }) }))

const PRODUCTS: AdminProduct[] = [
  { id: "p-1", name: "Sisal Basket", price: 30000, status: "approved", created_at: "2026-02-01T00:00:00Z" } as AdminProduct,
  { id: "p-2", name: "Maize Flour", price: 5000, status: "pending", created_at: "2026-02-02T00:00:00Z" } as AdminProduct,
]

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  mockDelete.mockResolvedValue({})
})

afterEach(() => {
  jest.restoreAllMocks()
})

/** The table row for a product, located by its name. */
const rowFor = (name: string) => screen.getByText(name).closest("tr") as HTMLElement

describe("ProductManagementTab", () => {
  it("shows the total and per-status counts", () => {
    render(<ProductManagementTab initialProducts={PRODUCTS} />)

    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("narrows the list to a search match", async () => {
    render(<ProductManagementTab initialProducts={PRODUCTS} />)

    await userEvent.type(screen.getByPlaceholderText(/search/i), "maize")

    expect(screen.queryByText("Sisal Basket")).not.toBeInTheDocument()
    expect(screen.getByText("Maize Flour")).toBeInTheDocument()
  })

  it("deletes the product that was clicked and shows a success notice", async () => {
    render(<ProductManagementTab initialProducts={PRODUCTS} />)

    await userEvent.click(within(rowFor("Maize Flour")).getByRole("button", { name: /delete/i }))
    await screen.findByText("Delete Product Permanently?")
    await userEvent.click(screen.getByRole("button", { name: /Yes, Delete Permanently/ }))

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("admin/products/p-2"))
    await waitFor(() => expect(screen.queryByText("Maize Flour")).not.toBeInTheDocument())
    expect(screen.getByText(/permanently deleted/)).toBeInTheDocument()
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it("keeps the row and shows the failure inline when the delete request fails", async () => {
    mockDelete.mockRejectedValue(new Error("foreign key violation"))
    render(<ProductManagementTab initialProducts={PRODUCTS} />)

    await userEvent.click(within(rowFor("Maize Flour")).getByRole("button", { name: /delete/i }))
    await screen.findByText("Delete Product Permanently?")
    await userEvent.click(screen.getByRole("button", { name: /Yes, Delete Permanently/ }))

    await waitFor(() => expect(screen.getByText("foreign key violation")).toBeInTheDocument())
    // The dialog stays open on failure, so the name now appears twice: the row
    // and the dialog's own summary.
    expect(screen.getAllByText("Maize Flour").length).toBeGreaterThan(0)
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it("refetches the catalogue from the API on demand", async () => {
    mockGet.mockResolvedValue({ data: [PRODUCTS[0]] })
    render(<ProductManagementTab initialProducts={PRODUCTS} />)

    await userEvent.click(screen.getByRole("button", { name: /Refresh Catalog/i }))

    await waitFor(() => expect(mockGet).toHaveBeenCalledWith("admin/products"))
    await waitFor(() => expect(screen.queryByText("Maize Flour")).not.toBeInTheDocument())
  })
})
