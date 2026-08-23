/**
 * Tests for EditProductDialog (components/vendor/edit-product-dialog.tsx).
 *
 * Mirrors add-product-dialog.test.tsx: this is the same thin shell around
 * useProductForm/ProductFormFields, just in "edit" mode with a `product`
 * instead of a `shopId`. What matters is that the mode, product, and
 * edit-flavoured labels are wired through correctly.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { EditProductDialog } from "@/components/vendor/edit-product-dialog"
import type { EditableProduct } from "@/hooks/use-product-form"

const mockUseProductForm = jest.fn()
jest.mock("@/hooks/use-product-form", () => ({
  useProductForm: (...args: unknown[]) => mockUseProductForm(...args),
}))

jest.mock("@/components/vendor/product-form/product-form-fields", () => ({
  ProductFormFields: ({ onCancel, submitLabel, pendingLabel }: { onCancel: () => void; submitLabel: string; pendingLabel: string }) => (
    <div data-testid="product-form-fields">
      <span data-testid="submit-label">{submitLabel}</span>
      <span data-testid="pending-label">{pendingLabel}</span>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}))

const FAKE_FORM_STATE = { name: "", handleSubmit: jest.fn() }

const product: EditableProduct = { id: "prod-1", name: "Maize Flour" }

const props = {
  open: true,
  onOpenChange: jest.fn(),
  product,
  onSuccess: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseProductForm.mockReturnValue(FAKE_FORM_STATE)
})

describe("EditProductDialog", () => {
  it("renders nothing when closed", () => {
    render(<EditProductDialog {...props} open={false} />)

    expect(screen.queryByText("Edit Product")).not.toBeInTheDocument()
  })

  it("renders the edit-product title and description when open", () => {
    render(<EditProductDialog {...props} />)

    expect(screen.getByText("Edit Product")).toBeInTheDocument()
    expect(screen.getByText("Update your product information")).toBeInTheDocument()
  })

  it("calls useProductForm in edit mode with the given product", () => {
    render(<EditProductDialog {...props} />)

    expect(mockUseProductForm).toHaveBeenCalledWith({
      open: true,
      onOpenChange: props.onOpenChange,
      onSuccess: props.onSuccess,
      mode: "edit",
      product,
    })
  })

  it("passes edit-flavoured labels to ProductFormFields", () => {
    render(<EditProductDialog {...props} />)

    expect(screen.getByTestId("submit-label")).toHaveTextContent("Update Product")
    expect(screen.getByTestId("pending-label")).toHaveTextContent("Updating...")
  })

  it("closes the dialog when ProductFormFields reports Cancel", async () => {
    render(<EditProductDialog {...props} />)

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(props.onOpenChange).toHaveBeenCalledWith(false)
  })
})
