import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ProductAgricultureSection } from "@/components/vendor/product-form/agriculture-section"
import { makeProductFormState } from "../../../setup/product-form-fixtures"

describe("ProductAgricultureSection", () => {
  it("renders nothing when the category is not agriculture", () => {
    const form = makeProductFormState({ isAgriculture: false })
    const { container } = render(<ProductAgricultureSection form={form} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("renders the weight unit selector when the category is agriculture", () => {
    const form = makeProductFormState({ isAgriculture: true })
    render(<ProductAgricultureSection form={form} />)
    expect(screen.getByText("Sold by Weight (Weight Unit) *")).toBeInTheDocument()
    expect(screen.getByText("Select a weight unit")).toBeInTheDocument()
  })

  it("shows the current weight unit label when one is already selected", () => {
    const form = makeProductFormState({ isAgriculture: true, weightUnit: "Kg" })
    render(<ProductAgricultureSection form={form} />)
    expect(screen.getByText("Kilograms (Kg)")).toBeInTheDocument()
  })

  it("calls setWeightUnit with the chosen value when an option is picked", async () => {
    const user = userEvent.setup()
    const form = makeProductFormState({ isAgriculture: true })
    render(<ProductAgricultureSection form={form} />)

    await user.click(screen.getByRole("combobox"))
    const option = await screen.findByText("Grams (g)")
    await user.click(option)

    expect(form.setWeightUnit).toHaveBeenCalledWith("g")
  })
})
