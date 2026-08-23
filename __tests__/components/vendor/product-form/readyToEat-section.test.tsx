import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ProductReadyToEatSection } from "@/components/vendor/product-form/readyToEat-section"
import { makeProductFormState } from "../../../setup/product-form-fixtures"

describe("ProductReadyToEatSection", () => {
  it("renders nothing when the category is not ready-to-eat", () => {
    const form = makeProductFormState({ isReadyToEat: false })
    const { container } = render(<ProductReadyToEatSection form={form} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("renders dietary info and prep time selectors when ready-to-eat", () => {
    const form = makeProductFormState({ isReadyToEat: true })
    render(<ProductReadyToEatSection form={form} />)
    expect(screen.getByText("Ready to Eat Details")).toBeInTheDocument()
    expect(screen.getByText("Dietary Information")).toBeInTheDocument()
    expect(screen.getByText("Preparation Time")).toBeInTheDocument()
    expect(screen.getAllByRole("combobox")).toHaveLength(2)
  })

  it("shows currently selected dietary info and prep time", () => {
    const form = makeProductFormState({ isReadyToEat: true, dietaryInfo: "Vegan", prepTime: "5-10 min" })
    render(<ProductReadyToEatSection form={form} />)
    expect(screen.getByText("Vegan")).toBeInTheDocument()
    expect(screen.getByText("5-10 min")).toBeInTheDocument()
  })

  it("calls setDietaryInfo when a dietary option is picked", async () => {
    const user = userEvent.setup()
    const form = makeProductFormState({ isReadyToEat: true })
    render(<ProductReadyToEatSection form={form} />)

    const [dietaryTrigger] = screen.getAllByRole("combobox")
    await user.click(dietaryTrigger)
    await user.click(await screen.findByText("Gluten-Free"))
    expect(form.setDietaryInfo).toHaveBeenCalledWith("Gluten-Free")
  })

  it("calls setPrepTime when a prep time option is picked", async () => {
    const user = userEvent.setup()
    const form = makeProductFormState({ isReadyToEat: true })
    render(<ProductReadyToEatSection form={form} />)

    const [, prepTrigger] = screen.getAllByRole("combobox")
    await user.click(prepTrigger)
    await user.click(await screen.findByText("30-60 min"))
    expect(form.setPrepTime).toHaveBeenCalledWith("30-60 min")
  })
})
