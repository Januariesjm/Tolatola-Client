import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ProductFormFields } from "@/components/vendor/product-form/product-form-fields"
import { makeProductFormState } from "../../../setup/product-form-fixtures"

describe("ProductFormFields", () => {
  it("always renders the basics and services sections", () => {
    const form = makeProductFormState()
    render(<ProductFormFields form={form} onCancel={jest.fn()} submitLabel="Add Product" pendingLabel="Adding..." />)

    expect(screen.getByLabelText("Product Name *")).toBeInTheDocument()
    expect(screen.getByText("Category *")).toBeInTheDocument()
  })

  it("does not render any category-specific section when no category flag is set", () => {
    const form = makeProductFormState()
    render(<ProductFormFields form={form} onCancel={jest.fn()} submitLabel="Add Product" pendingLabel="Adding..." />)

    expect(screen.queryByText("Fashion Variations")).not.toBeInTheDocument()
    expect(screen.queryByText("Vehicles / Spare Parts Details")).not.toBeInTheDocument()
    expect(screen.queryByText("Ready to Eat Details")).not.toBeInTheDocument()
    expect(screen.queryByText("Drinks Details")).not.toBeInTheDocument()
    expect(screen.queryByText("Sold by Weight (Weight Unit) *")).not.toBeInTheDocument()
  })

  it("renders the category-specific section that matches the active flag", () => {
    const form = makeProductFormState({ isFashion: true })
    render(<ProductFormFields form={form} onCancel={jest.fn()} submitLabel="Add Product" pendingLabel="Adding..." />)
    expect(screen.getByText("Fashion Variations")).toBeInTheDocument()
  })

  it("shows the submit label at rest and calls handleSubmit on form submission", () => {
    const form = makeProductFormState()
    const { container } = render(<ProductFormFields form={form} onCancel={jest.fn()} submitLabel="Add Product" pendingLabel="Adding..." />)

    expect(screen.getByRole("button", { name: "Add Product" })).toBeInTheDocument()

    // Submitted directly rather than via a button click: the name/price/stock
    // inputs are HTML5-`required`, and this fixture leaves them blank, so a
    // real click would be blocked by the browser's own constraint validation
    // before the form's onSubmit ever runs.
    fireEvent.submit(container.querySelector("form") as HTMLFormElement)
    expect(form.handleSubmit).toHaveBeenCalledTimes(1)
  })

  it("shows the pending label and disables submit while loading", () => {
    const form = makeProductFormState({ isLoading: true })
    render(<ProductFormFields form={form} onCancel={jest.fn()} submitLabel="Add Product" pendingLabel="Adding..." />)

    expect(screen.getByRole("button", { name: "Adding..." })).toBeDisabled()
    expect(screen.queryByText("Add Product")).not.toBeInTheDocument()
  })

  it("disables submit while an image is uploading, even if not otherwise loading", () => {
    const form = makeProductFormState({ uploadingImage: true })
    render(<ProductFormFields form={form} onCancel={jest.fn()} submitLabel="Add Product" pendingLabel="Adding..." />)
    expect(screen.getByRole("button", { name: "Add Product" })).toBeDisabled()
  })

  it("calls onCancel when the cancel button is clicked", async () => {
    const user = userEvent.setup()
    const onCancel = jest.fn()
    const form = makeProductFormState()
    render(<ProductFormFields form={form} onCancel={onCancel} submitLabel="Add Product" pendingLabel="Adding..." />)

    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it("shows the form error message when present", () => {
    const form = makeProductFormState({ error: "Please select a product category before uploading." })
    render(<ProductFormFields form={form} onCancel={jest.fn()} submitLabel="Add Product" pendingLabel="Adding..." />)
    expect(screen.getByText("Please select a product category before uploading.")).toBeInTheDocument()
  })

  it("renders no error message when there is none", () => {
    const form = makeProductFormState({ error: null })
    const { container } = render(<ProductFormFields form={form} onCancel={jest.fn()} submitLabel="Add Product" pendingLabel="Adding..." />)
    expect(container.querySelector(".text-destructive")).not.toBeInTheDocument()
  })
})
