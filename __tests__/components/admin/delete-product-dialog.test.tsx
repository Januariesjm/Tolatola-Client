/**
 * Tests for DeleteProductDialog (components/admin/delete-product-dialog.tsx).
 *
 * This is a permanent, unrecoverable delete, so the behaviour worth pinning is
 * that the dialog shows which product is about to be destroyed, disables both
 * buttons while the request is in flight (so it cannot be double-submitted),
 * and surfaces a failure inline rather than only via a toast the dialog itself
 * knows nothing about.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DeleteProductDialog } from "@/components/admin/delete-product-dialog"
import type { AdminProduct } from "@/lib/types/admin"

const product: AdminProduct = {
  id: "p-1",
  name: "Sisal Basket",
  price: 30000,
  image_url: "/a.jpg",
  shops: { name: "Dodoma Crafts", vendors: { business_name: "Dodoma Crafts Ltd" } },
} as AdminProduct

const props = {
  open: true,
  onOpenChange: jest.fn(),
  product,
  isDeleting: false,
  error: null,
  onConfirm: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("DeleteProductDialog", () => {
  it("renders nothing when closed", () => {
    render(<DeleteProductDialog {...props} open={false} />)

    expect(screen.queryByText("Delete Product Permanently?")).not.toBeInTheDocument()
  })

  it("shows the product about to be deleted", () => {
    render(<DeleteProductDialog {...props} />)

    expect(screen.getByText("Sisal Basket")).toBeInTheDocument()
    expect(screen.getByText(/Dodoma Crafts/)).toBeInTheDocument()
  })

  it("renders no product summary when nothing is selected", () => {
    render(<DeleteProductDialog {...props} product={null} />)

    expect(screen.queryByText("Sisal Basket")).not.toBeInTheDocument()
  })

  it("calls onConfirm when the delete button is clicked", async () => {
    render(<DeleteProductDialog {...props} />)

    await userEvent.click(screen.getByRole("button", { name: /Yes, Delete Permanently/ }))

    expect(props.onConfirm).toHaveBeenCalledTimes(1)
  })

  it("closes via Cancel", async () => {
    render(<DeleteProductDialog {...props} />)

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(props.onOpenChange).toHaveBeenCalledWith(false)
  })

  it("disables both buttons and shows progress while deleting", () => {
    render(<DeleteProductDialog {...props} isDeleting />)

    expect(screen.getByRole("button", { name: /Deleting/ })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()
  })

  it("shows a failure message inline", () => {
    render(<DeleteProductDialog {...props} error="foreign key violation" />)

    expect(screen.getByText("foreign key violation")).toBeInTheDocument()
  })

  it("shows no failure message when there is none", () => {
    render(<DeleteProductDialog {...props} />)

    expect(screen.queryByText(/violation/)).not.toBeInTheDocument()
  })
})
