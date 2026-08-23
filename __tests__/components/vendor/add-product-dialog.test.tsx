/**
 * Tests for AddProductDialog (components/vendor/add-product-dialog.tsx).
 *
 * All state, validation and submission live in useProductForm, and the fields
 * live in ProductFormFields -- both already covered by their own test suites
 * (__tests__/hooks/use-product-images.test.tsx, use-product-variants.test.tsx,
 * and the component/vendor/product-form/* suites). This dialog is a thin
 * shell, so what matters here is the wiring: it opens useProductForm in
 * "create" mode with the right shopId, renders the create-flavoured copy, and
 * forwards Cancel to onOpenChange.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AddProductDialog } from "@/components/vendor/add-product-dialog"

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

const props = {
  open: true,
  onOpenChange: jest.fn(),
  shopId: "shop-1",
  onSuccess: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseProductForm.mockReturnValue(FAKE_FORM_STATE)
})

describe("AddProductDialog", () => {
  it("renders nothing when closed", () => {
    render(<AddProductDialog {...props} open={false} />)

    expect(screen.queryByText("Add New Product")).not.toBeInTheDocument()
  })

  it("renders the create-product title and description when open", () => {
    render(<AddProductDialog {...props} />)

    expect(screen.getByText("Add New Product")).toBeInTheDocument()
    expect(screen.getByText("Add a new product to your shop")).toBeInTheDocument()
  })

  it("calls useProductForm in create mode with the given shopId", () => {
    render(<AddProductDialog {...props} />)

    expect(mockUseProductForm).toHaveBeenCalledWith({
      open: true,
      onOpenChange: props.onOpenChange,
      onSuccess: props.onSuccess,
      mode: "create",
      shopId: "shop-1",
    })
  })

  it("passes create-flavoured labels to ProductFormFields", () => {
    render(<AddProductDialog {...props} />)

    expect(screen.getByTestId("submit-label")).toHaveTextContent("Add Product")
    expect(screen.getByTestId("pending-label")).toHaveTextContent("Adding...")
  })

  it("closes the dialog when ProductFormFields reports Cancel", async () => {
    render(<AddProductDialog {...props} />)

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(props.onOpenChange).toHaveBeenCalledWith(false)
  })
})
