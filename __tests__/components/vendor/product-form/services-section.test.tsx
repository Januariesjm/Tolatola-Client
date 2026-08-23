import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ProductServicesSection } from "@/components/vendor/product-form/services-section"
import { makeProductFormState } from "../../../setup/product-form-fixtures"

const categories = [
  { id: "vehicles", name: "Vehicles", parent_id: null, slug: "vehicles" },
  { id: "spare-parts", name: "Spare Parts", parent_id: "vehicles", slug: "spare-parts" },
  { id: "vehicles-sub", name: "Cars", parent_id: "vehicles", slug: "vehicles-sub" },
  { id: "drinks", name: "Drinks", parent_id: null, slug: "drinks" },
  { id: "alcoholic", name: "Alcoholic", parent_id: "drinks", slug: "alcoholic" },
  { id: "non-alcoholic", name: "Non-Alcoholic", parent_id: "drinks", slug: "non-alcoholic" },
  { id: "misc", name: "Misc", parent_id: null, slug: "misc" },
  { id: "misc-sub", name: "Misc Sub", parent_id: "misc", slug: "misc-sub" },
  { id: "standalone", name: "Standalone", parent_id: null, slug: "standalone" },
] as any

describe("ProductServicesSection", () => {
  it("shows the services delivery copy when the category is services", () => {
    const form = makeProductFormState({ isServices: true })
    render(<ProductServicesSection form={form} />)
    expect(screen.getByText("Offer Home Delivery / On-Site Visit")).toBeInTheDocument()
    expect(screen.getByText(/Check this if your service includes home delivery/)).toBeInTheDocument()
  })

  it("shows the generic delivery copy when the category is not services", () => {
    const form = makeProductFormState({ isServices: false })
    render(<ProductServicesSection form={form} />)
    expect(screen.getByText("Delivery available handled by Tola")).toBeInTheDocument()
    expect(screen.queryByText("Offer Home Delivery / On-Site Visit")).not.toBeInTheDocument()
  })

  it("reflects the deliveryAvailable value on the checkbox", () => {
    const form = makeProductFormState({ deliveryAvailable: false })
    render(<ProductServicesSection form={form} />)
    expect(screen.getByRole("checkbox")).not.toBeChecked()
  })

  it("calls setDeliveryAvailable when the checkbox is toggled", async () => {
    const user = userEvent.setup()
    const form = makeProductFormState({ deliveryAvailable: false })
    render(<ProductServicesSection form={form} />)
    await user.click(screen.getByRole("checkbox"))
    expect(form.setDeliveryAvailable).toHaveBeenCalledWith(true)
  })

  it("renders only top-level categories in the category selector", async () => {
    const user = userEvent.setup()
    const form = makeProductFormState({ categories })
    render(<ProductServicesSection form={form} />)

    await user.click(screen.getAllByRole("combobox")[0])
    expect(screen.getByText("Vehicles")).toBeInTheDocument()
    expect(screen.getByText("Drinks")).toBeInTheDocument()
    expect(screen.getByText("Standalone")).toBeInTheDocument()
    expect(screen.queryByText("Cars")).not.toBeInTheDocument()
    expect(screen.queryByText("Spare Parts")).not.toBeInTheDocument()
  })

  it("does not render a subcategory selector until a parent with children is chosen", () => {
    const form = makeProductFormState({ categories, parentCategoryId: "" })
    render(<ProductServicesSection form={form} />)
    expect(screen.getAllByRole("combobox")).toHaveLength(1)
  })

  it("selecting a parent category with children auto-selects the first subcategory", async () => {
    const user = userEvent.setup()
    const form = makeProductFormState({ categories })
    render(<ProductServicesSection form={form} />)

    await user.click(screen.getAllByRole("combobox")[0])
    await user.click(screen.getByText("Vehicles"))

    expect(form.setParentCategoryId).toHaveBeenCalledWith("vehicles")
    expect(form.setSubCategoryId).toHaveBeenCalledWith("spare-parts")
    expect(form.setCategoryId).toHaveBeenCalledWith("spare-parts")
  })

  it("selecting a parent category without children sets the category id to the parent", async () => {
    const user = userEvent.setup()
    const form = makeProductFormState({ categories })
    render(<ProductServicesSection form={form} />)

    await user.click(screen.getAllByRole("combobox")[0])
    await user.click(screen.getByText("Standalone"))

    expect(form.setParentCategoryId).toHaveBeenCalledWith("standalone")
    expect(form.setSubCategoryId).toHaveBeenCalledWith("")
    expect(form.setCategoryId).toHaveBeenCalledWith("standalone")
  })

  it("shows a subcategory selector once the parent has children, listing only its children", async () => {
    const user = userEvent.setup()
    const form = makeProductFormState({ categories, parentCategoryId: "vehicles" })
    render(<ProductServicesSection form={form} />)

    const comboboxes = screen.getAllByRole("combobox")
    expect(comboboxes).toHaveLength(2)

    await user.click(comboboxes[1])
    expect(screen.getByText("Cars")).toBeInTheDocument()
    expect(screen.getByText("Spare Parts")).toBeInTheDocument()
    expect(screen.queryByText("Drinks")).not.toBeInTheDocument()
  })

  it("picking a spare-parts subcategory derives the vehicle section", async () => {
    const user = userEvent.setup()
    const form = makeProductFormState({ categories, parentCategoryId: "vehicles" })
    render(<ProductServicesSection form={form} />)

    const comboboxes = screen.getAllByRole("combobox")
    await user.click(comboboxes[1])
    await user.click(screen.getByText("Spare Parts"))

    expect(form.setSubCategoryId).toHaveBeenCalledWith("spare-parts")
    expect(form.setCategoryId).toHaveBeenCalledWith("spare-parts")
    expect(form.setVehicleSection).toHaveBeenCalledWith("spare_part")
  })

  it("picking a vehicles-sub subcategory derives the vehicle section as vehicle", async () => {
    const user = userEvent.setup()
    const form = makeProductFormState({ categories, parentCategoryId: "vehicles" })
    render(<ProductServicesSection form={form} />)

    const comboboxes = screen.getAllByRole("combobox")
    await user.click(comboboxes[1])
    await user.click(screen.getByText("Cars"))

    expect(form.setVehicleSection).toHaveBeenCalledWith("vehicle")
  })

  it("picking an alcoholic subcategory derives the drink section", async () => {
    const user = userEvent.setup()
    const form = makeProductFormState({ categories, parentCategoryId: "drinks" })
    render(<ProductServicesSection form={form} />)

    const comboboxes = screen.getAllByRole("combobox")
    await user.click(comboboxes[1])
    await user.click(screen.getByText("Alcoholic"))

    expect(form.setDrinkSection).toHaveBeenCalledWith("alcoholic")
  })

  it("picking a non-alcoholic subcategory derives the drink section", async () => {
    const user = userEvent.setup()
    const form = makeProductFormState({ categories, parentCategoryId: "drinks" })
    render(<ProductServicesSection form={form} />)

    const comboboxes = screen.getAllByRole("combobox")
    await user.click(comboboxes[1])
    await user.click(screen.getByText("Non-Alcoholic"))

    expect(form.setDrinkSection).toHaveBeenCalledWith("non_alcoholic")
  })

  it("resets the vehicle section for subcategories that do not auto-derive one", async () => {
    const user = userEvent.setup()
    const form = makeProductFormState({ categories, parentCategoryId: "misc" })
    render(<ProductServicesSection form={form} />)

    const comboboxes = screen.getAllByRole("combobox")
    await user.click(comboboxes[1])
    await user.click(screen.getByText("Misc Sub"))

    expect(form.setVehicleSection).toHaveBeenCalledWith("")
    expect(form.setDrinkSection).not.toHaveBeenCalled()
  })
})
