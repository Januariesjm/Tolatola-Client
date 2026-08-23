/**
 * Tests for PromotionsManagementTab (components/admin/promotions-management-tab.tsx).
 *
 * A form + list over Supabase's `promotions` table. Create/update/delete/
 * toggle-active all go straight through the Supabase client (not the
 * api-client wrapper), image upload goes through a plain `fetch` to
 * `/api/upload`, and destructive/confirmation flows use `window.confirm` /
 * `window.alert` rather than a toast. What's worth pinning: the empty state,
 * opening the add form and submitting it (insert), editing an existing
 * promotion (update, and that the form is pre-filled), deleting with and
 * without confirmation, toggling active/inactive, the image upload success
 * and failure paths, and that a Supabase error surfaces as an alert rather
 * than silently succeeding.
 */

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PromotionsManagementTab } from "@/components/admin/promotions-management-tab"

const mockUpdateEq = jest.fn()
const mockInsert = jest.fn()
const mockDeleteEq = jest.fn()

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      update: (data: unknown) => ({ eq: (col: string, val: unknown) => mockUpdateEq(data, col, val) }),
      insert: (data: unknown) => mockInsert(data),
      delete: () => ({ eq: (col: string, val: unknown) => mockDeleteEq(col, val) }),
    }),
  }),
}))

const mockRouter = { push: jest.fn(), replace: jest.fn(), refresh: jest.fn(), back: jest.fn(), forward: jest.fn(), prefetch: jest.fn() }
jest.mock("next/navigation", () => ({ useRouter: () => mockRouter }))

function promotion(overrides: Record<string, unknown> = {}) {
  return {
    id: "promo-1",
    title: "Big Harvest Sale",
    description: "20% off maize flour",
    image_url: null,
    background_color: "#0f766e",
    text_color: "#ffffff",
    button_text: "Shop Now",
    button_link: "/shop",
    is_active: true,
    display_order: 1,
    created_at: "2026-01-10T08:30:00.000Z",
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  mockUpdateEq.mockResolvedValue({ error: null })
  mockInsert.mockResolvedValue({ error: null })
  mockDeleteEq.mockResolvedValue({ error: null })
  jest.spyOn(window, "alert").mockImplementation(() => {})
  jest.spyOn(window, "confirm").mockReturnValue(true)
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("PromotionsManagementTab", () => {
  it("shows the empty state when there are no promotions", () => {
    render(<PromotionsManagementTab promotions={[]} />)

    expect(screen.getByText(/No promotions yet/)).toBeInTheDocument()
  })

  it("renders a promotion's title, description and metadata", () => {
    render(<PromotionsManagementTab promotions={[promotion()]} />)

    expect(screen.getByText("Big Harvest Sale")).toBeInTheDocument()
    expect(screen.getByText("20% off maize flour")).toBeInTheDocument()
    expect(screen.getByText("Order: 1")).toBeInTheDocument()
    expect(screen.getByText("Button: Shop Now")).toBeInTheDocument()
    expect(screen.getByText("Link: /shop")).toBeInTheDocument()
  })

  it("numbers promotions sequentially starting at 1", () => {
    render(<PromotionsManagementTab promotions={[promotion({ id: "p-1" }), promotion({ id: "p-2", title: "Second Promo" })]} />)

    expect(screen.getByText("#1")).toBeInTheDocument()
    expect(screen.getByText("#2")).toBeInTheDocument()
  })

  it("opens the add-promotion form when the header button is clicked", async () => {
    render(<PromotionsManagementTab promotions={[]} />)

    await userEvent.click(screen.getByRole("button", { name: /add promotion/i }))

    expect(screen.getByText("Add New Promotion")).toBeInTheDocument()
  })

  it("creates a new promotion via insert, then resets and closes the form", async () => {
    render(<PromotionsManagementTab promotions={[]} />)

    await userEvent.click(screen.getByRole("button", { name: /add promotion/i }))
    await userEvent.type(screen.getByLabelText(/title/i), "Flash Sale")
    await userEvent.click(screen.getByRole("button", { name: /^create promotion$/i }))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith([expect.objectContaining({ title: "Flash Sale" })])
    })
    expect(window.alert).toHaveBeenCalledWith("Promotion created successfully!")
    expect(mockRouter.refresh).toHaveBeenCalled()
    expect(screen.queryByText("Add New Promotion")).not.toBeInTheDocument()
  })

  it("shows an alert and keeps the form open when creating fails", async () => {
    mockInsert.mockResolvedValue({ error: new Error("insert failed") })
    render(<PromotionsManagementTab promotions={[]} />)

    await userEvent.click(screen.getByRole("button", { name: /add promotion/i }))
    await userEvent.type(screen.getByLabelText(/title/i), "Flash Sale")
    await userEvent.click(screen.getByRole("button", { name: /^create promotion$/i }))

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Failed to save promotion")
    })
    expect(screen.getByText("Add New Promotion")).toBeInTheDocument()
  })

  it("opens the edit form pre-filled and updates the promotion via update().eq()", async () => {
    render(<PromotionsManagementTab promotions={[promotion()]} />)

    const editButtons = screen.getAllByRole("button")
    // Row actions are [toggle-active, edit, delete]; edit is the second.
    const editButton = editButtons.find((b) => b.querySelector("svg.lucide-pencil")) as HTMLElement
    await userEvent.click(editButton)

    expect(screen.getByText("Edit Promotion")).toBeInTheDocument()
    expect(screen.getByLabelText(/title/i)).toHaveValue("Big Harvest Sale")

    await userEvent.click(screen.getByRole("button", { name: /^update promotion$/i }))

    await waitFor(() => {
      expect(mockUpdateEq).toHaveBeenCalledWith(expect.objectContaining({ title: "Big Harvest Sale" }), "id", "promo-1")
    })
    expect(window.alert).toHaveBeenCalledWith("Promotion updated successfully!")
  })

  it("cancels the form without saving", async () => {
    render(<PromotionsManagementTab promotions={[]} />)

    await userEvent.click(screen.getByRole("button", { name: /add promotion/i }))
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }))

    expect(screen.queryByText("Add New Promotion")).not.toBeInTheDocument()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it("deletes a promotion when the confirmation dialog is accepted", async () => {
    render(<PromotionsManagementTab promotions={[promotion()]} />)

    const deleteButtons = screen.getAllByRole("button")
    const deleteButton = deleteButtons.find((b) => b.querySelector("svg.lucide-trash2")) as HTMLElement
    await userEvent.click(deleteButton)

    expect(window.confirm).toHaveBeenCalledWith("Are you sure you want to delete this promotion?")
    await waitFor(() => {
      expect(mockDeleteEq).toHaveBeenCalledWith("id", "promo-1")
    })
    expect(window.alert).toHaveBeenCalledWith("Promotion deleted successfully!")
    expect(mockRouter.refresh).toHaveBeenCalled()
  })

  it("does not delete when the confirmation dialog is declined", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(false)
    render(<PromotionsManagementTab promotions={[promotion()]} />)

    const deleteButtons = screen.getAllByRole("button")
    const deleteButton = deleteButtons.find((b) => b.querySelector("svg.lucide-trash2")) as HTMLElement
    await userEvent.click(deleteButton)

    expect(mockDeleteEq).not.toHaveBeenCalled()
  })

  it("shows an alert when deleting fails", async () => {
    mockDeleteEq.mockResolvedValue({ error: new Error("delete failed") })
    render(<PromotionsManagementTab promotions={[promotion()]} />)

    const deleteButtons = screen.getAllByRole("button")
    const deleteButton = deleteButtons.find((b) => b.querySelector("svg.lucide-trash2")) as HTMLElement
    await userEvent.click(deleteButton)

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Failed to delete promotion")
    })
    expect(mockRouter.refresh).not.toHaveBeenCalled()
  })

  it("toggles a promotion from active to inactive via update().eq()", async () => {
    render(<PromotionsManagementTab promotions={[promotion({ is_active: true })]} />)

    const toggleButtons = screen.getAllByRole("button")
    const toggleButton = toggleButtons.find((b) => b.querySelector("svg.lucide-eye")) as HTMLElement
    await userEvent.click(toggleButton)

    await waitFor(() => {
      expect(mockUpdateEq).toHaveBeenCalledWith({ is_active: false }, "id", "promo-1")
    })
    expect(mockRouter.refresh).toHaveBeenCalled()
  })

  it("shows an alert when toggling active status fails", async () => {
    mockUpdateEq.mockResolvedValue({ error: new Error("toggle failed") })
    render(<PromotionsManagementTab promotions={[promotion({ is_active: true })]} />)

    const toggleButtons = screen.getAllByRole("button")
    const toggleButton = toggleButtons.find((b) => b.querySelector("svg.lucide-eye")) as HTMLElement
    await userEvent.click(toggleButton)

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Failed to update promotion status")
    })
    expect(mockRouter.refresh).not.toHaveBeenCalled()
  })

  it("uploads an image and stores the returned URL", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://cdn.tolatola.co/promo.png" }),
    }) as unknown as typeof fetch

    render(<PromotionsManagementTab promotions={[]} />)
    await userEvent.click(screen.getByRole("button", { name: /add promotion/i }))

    const file = new File(["image-bytes"], "promo.png", { type: "image/png" })
    const fileInput = screen.getByLabelText(/banner image/i) as HTMLInputElement
    await userEvent.upload(fileInput, file)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/upload", expect.objectContaining({ method: "POST" }))
    })
    expect(await screen.findByAltText("Preview")).toHaveAttribute("src", expect.stringContaining("promo.png"))
  })

  it("alerts when the image upload fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "File too large" }),
    }) as unknown as typeof fetch

    render(<PromotionsManagementTab promotions={[]} />)
    await userEvent.click(screen.getByRole("button", { name: /add promotion/i }))

    const file = new File(["image-bytes"], "promo.png", { type: "image/png" })
    const fileInput = screen.getByLabelText(/banner image/i) as HTMLInputElement
    await userEvent.upload(fileInput, file)

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Failed to upload image: File too large")
    })
  })
})
