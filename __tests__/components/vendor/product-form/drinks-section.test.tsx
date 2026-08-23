import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ProductDrinksSection } from "@/components/vendor/product-form/drinks-section"
import { makeProductFormState } from "../../../setup/product-form-fixtures"

describe("ProductDrinksSection", () => {
  it("renders nothing when the category is not drinks", () => {
    const form = makeProductFormState({ isDrinks: false })
    const { container } = render(<ProductDrinksSection form={form} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("renders a section selector when drinks and no section is derived yet", () => {
    const form = makeProductFormState({ isDrinks: true, drinkSection: "" })
    render(<ProductDrinksSection form={form} />)
    expect(screen.getByText("Drinks Details")).toBeInTheDocument()
    expect(screen.getByRole("combobox")).toBeInTheDocument()
    expect(screen.getByText("Select section")).toBeInTheDocument()
  })

  it("shows the derived alcoholic label instead of a selector", () => {
    const form = makeProductFormState({ isDrinks: true, drinkSection: "alcoholic" })
    render(<ProductDrinksSection form={form} />)
    expect(screen.getByText("🍹 Alcoholic")).toBeInTheDocument()
    expect(screen.getByText("(derived from subcategory)")).toBeInTheDocument()
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
  })

  it("shows the derived non-alcoholic label instead of a selector", () => {
    const form = makeProductFormState({ isDrinks: true, drinkSection: "non_alcoholic" })
    render(<ProductDrinksSection form={form} />)
    expect(screen.getByText("🥤 Non-Alcoholic")).toBeInTheDocument()
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
  })

  it("calls setDrinkSection when a section is picked", async () => {
    const user = userEvent.setup()
    const form = makeProductFormState({ isDrinks: true, drinkSection: "" })
    render(<ProductDrinksSection form={form} />)

    await user.click(screen.getByRole("combobox"))
    await user.click(await screen.findByText("Non-Alcoholic"))
    expect(form.setDrinkSection).toHaveBeenCalledWith("non_alcoholic")
  })
})
