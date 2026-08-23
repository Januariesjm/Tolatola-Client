import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ProductBasicsSection } from "@/components/vendor/product-form/basics-section"
import { makeProductFormState } from "../../../setup/product-form-fixtures"

describe("ProductBasicsSection", () => {
  it("renders the given field values", () => {
    const form = makeProductFormState({
      name: "Fresh Mangoes",
      description: "Juicy and sweet",
      price: "5000",
      stockQuantity: "42",
      moq: "3",
    })
    render(<ProductBasicsSection form={form} />)

    expect(screen.getByLabelText("Product Name *")).toHaveValue("Fresh Mangoes")
    expect(screen.getByLabelText("Description")).toHaveValue("Juicy and sweet")
    expect(screen.getByLabelText("Price (TZS) *")).toHaveValue(5000)
    expect(screen.getByLabelText("Stock Quantity *")).toHaveValue(42)
    expect(screen.getByLabelText("Min Order Quantity (MOQ)")).toHaveValue(3)
  })

  it("calls setName when the name input changes", () => {
    const form = makeProductFormState()
    render(<ProductBasicsSection form={form} />)

    fireEvent.change(screen.getByLabelText("Product Name *"), { target: { value: "Fresh Mangoes" } })
    expect(form.setName).toHaveBeenCalledWith("Fresh Mangoes")
  })

  it("calls setDescription when the description changes", () => {
    const form = makeProductFormState()
    render(<ProductBasicsSection form={form} />)

    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Juicy" } })
    expect(form.setDescription).toHaveBeenCalledWith("Juicy")
  })

  it("calls setPrice and setStockQuantity when those inputs change", () => {
    const form = makeProductFormState()
    render(<ProductBasicsSection form={form} />)

    fireEvent.change(screen.getByLabelText("Price (TZS) *"), { target: { value: "12000" } })
    expect(form.setPrice).toHaveBeenCalledWith("12000")

    fireEvent.change(screen.getByLabelText("Stock Quantity *"), { target: { value: "9" } })
    expect(form.setStockQuantity).toHaveBeenCalledWith("9")
  })

  it("calls setMoq when the MOQ input changes", () => {
    const form = makeProductFormState()
    render(<ProductBasicsSection form={form} />)

    fireEvent.change(screen.getByLabelText("Min Order Quantity (MOQ)"), { target: { value: "5" } })
    expect(form.setMoq).toHaveBeenCalledWith("5")
  })

  it("calls setQualityGrade when a quality grade is picked", async () => {
    const user = userEvent.setup()
    const form = makeProductFormState()
    render(<ProductBasicsSection form={form} />)

    await user.click(screen.getByRole("combobox"))
    await user.click(await screen.findByText("Grade B (Standard)"))
    expect(form.setQualityGrade).toHaveBeenCalledWith("B")
  })

  it("does not render an image grid when there are no images", () => {
    const form = makeProductFormState({ images: [] })
    render(<ProductBasicsSection form={form} />)
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
    expect(screen.getByText("0 images uploaded")).toBeInTheDocument()
  })

  it("renders one image per URL and singularizes the count for one image", () => {
    const form = makeProductFormState({ images: ["https://example.com/a.jpg"] })
    render(<ProductBasicsSection form={form} />)
    expect(screen.getAllByRole("img")).toHaveLength(1)
    expect(screen.getByText("1 image uploaded")).toBeInTheDocument()
  })

  it("renders a grid of images and calls handleRemoveImage with the clicked index", async () => {
    const user = userEvent.setup()
    const form = makeProductFormState({
      images: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
    })
    render(<ProductBasicsSection form={form} />)

    expect(screen.getAllByRole("img")).toHaveLength(2)
    expect(screen.getByText("2 images uploaded")).toBeInTheDocument()

    const removeButtons = screen.getAllByRole("button")
    await user.click(removeButtons[1])
    expect(form.handleRemoveImage).toHaveBeenCalledWith(1)
  })

  it("shows an uploading indicator instead of the upload label while uploading", () => {
    const form = makeProductFormState({ uploadingImage: true })
    render(<ProductBasicsSection form={form} />)
    expect(screen.getByText("Uploading...")).toBeInTheDocument()
    expect(screen.queryByText("Upload Images")).not.toBeInTheDocument()
  })

  it("disables the file input while uploading", () => {
    const form = makeProductFormState({ uploadingImage: true })
    const { container } = render(<ProductBasicsSection form={form} />)
    expect(container.querySelector("#images")).toBeDisabled()
  })
})
