import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ProductVehicleSection } from "@/components/vendor/product-form/vehicle-section"
import { makeProductFormState } from "../../../setup/product-form-fixtures"

describe("ProductVehicleSection", () => {
  it("renders nothing when the category is not vehicles", () => {
    const form = makeProductFormState({ isVehicles: false })
    const { container } = render(<ProductVehicleSection form={form} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("uses the generic heading when there is no subcategory or derived section", () => {
    const form = makeProductFormState({ isVehicles: true, vehicleSection: "", subCategoryId: "" })
    render(<ProductVehicleSection form={form} />)
    expect(screen.getByText("Vehicles / Spare Parts Details")).toBeInTheDocument()
  })

  it("includes the subcategory name and section label in the heading", () => {
    const form = makeProductFormState({
      isVehicles: true,
      vehicleSection: "vehicle",
      subCategoryId: "cars",
      categories: [{ id: "cars", name: "Cars", parent_id: "vehicles" }] as any,
    })
    render(<ProductVehicleSection form={form} />)
    expect(screen.getByText("Cars / Vehicle Details")).toBeInTheDocument()
  })

  it("falls back to just the subcategory name when there is no section yet", () => {
    const form = makeProductFormState({
      isVehicles: true,
      vehicleSection: "",
      subCategoryId: "cars",
      categories: [{ id: "cars", name: "Cars", parent_id: "vehicles" }] as any,
    })
    render(<ProductVehicleSection form={form} />)
    expect(screen.getByText("Cars Details")).toBeInTheDocument()
  })

  it("shows a section selector when no section is derived", () => {
    const form = makeProductFormState({ isVehicles: true, vehicleSection: "" })
    render(<ProductVehicleSection form={form} />)
    expect(screen.getByText("Section *")).toBeInTheDocument()
    expect(screen.getByText("Select section")).toBeInTheDocument()
  })

  it("calls setVehicleSection when a section is picked", async () => {
    const user = userEvent.setup()
    const form = makeProductFormState({ isVehicles: true, vehicleSection: "" })
    render(<ProductVehicleSection form={form} />)

    await user.click(screen.getAllByRole("combobox")[0])
    await user.click(await screen.findByText("Spare Part"))
    expect(form.setVehicleSection).toHaveBeenCalledWith("spare_part")
  })

  it("shows the derived vehicle label instead of a selector", () => {
    const form = makeProductFormState({ isVehicles: true, vehicleSection: "vehicle" })
    render(<ProductVehicleSection form={form} />)
    expect(screen.getByText("🚗 Vehicle")).toBeInTheDocument()
    expect(screen.getByText("(derived from subcategory)")).toBeInTheDocument()
  })

  it("shows the derived spare part label instead of a selector", () => {
    const form = makeProductFormState({ isVehicles: true, vehicleSection: "spare_part" })
    render(<ProductVehicleSection form={form} />)
    expect(screen.getByText("🔧 Spare Part")).toBeInTheDocument()
  })

  it("always renders the brand and condition fields when vehicles", () => {
    const form = makeProductFormState({ isVehicles: true, vehicleSection: "", brand: "Toyota" })
    render(<ProductVehicleSection form={form} />)
    expect(screen.getByPlaceholderText("e.g. Toyota, Honda")).toHaveValue("Toyota")
    expect(screen.getByText("Condition")).toBeInTheDocument()
  })

  it("calls setBrand and setCondition", async () => {
    const user = userEvent.setup()
    const form = makeProductFormState({ isVehicles: true, vehicleSection: "" })
    render(<ProductVehicleSection form={form} />)

    fireEvent.change(screen.getByPlaceholderText("e.g. Toyota, Honda"), { target: { value: "Honda" } })
    expect(form.setBrand).toHaveBeenCalledWith("Honda")

    const comboboxes = screen.getAllByRole("combobox")
    // first combobox is the section selector, second is condition
    await user.click(comboboxes[1])
    await user.click(await screen.findByText("Used"))
    expect(form.setCondition).toHaveBeenCalledWith("Used")
  })

  describe("when vehicleSection is 'vehicle'", () => {
    it("renders model, year, mileage, transmission, fuel type and engine size fields", () => {
      const form = makeProductFormState({
        isVehicles: true,
        vehicleSection: "vehicle",
        model: "Corolla",
        year: "2020",
        mileage: "50000",
        engineSize: "2.0L",
      })
      render(<ProductVehicleSection form={form} />)
      expect(screen.getByPlaceholderText("e.g. Corolla, Civic")).toHaveValue("Corolla")
      expect(screen.getByPlaceholderText("e.g. 2020")).toHaveValue(2020)
      expect(screen.getByPlaceholderText("e.g. 50000")).toHaveValue(50000)
      expect(screen.getByPlaceholderText("e.g. 2.0L, 1500cc")).toHaveValue("2.0L")
      expect(screen.queryByText("Spare Part Name *")).not.toBeInTheDocument()
    })

    it("calls the relevant setters for the vehicle fields", async () => {
      const user = userEvent.setup()
      const form = makeProductFormState({ isVehicles: true, vehicleSection: "vehicle" })
      render(<ProductVehicleSection form={form} />)

      fireEvent.change(screen.getByPlaceholderText("e.g. Corolla, Civic"), { target: { value: "Civic" } })
      expect(form.setModel).toHaveBeenCalledWith("Civic")

      fireEvent.change(screen.getByPlaceholderText("e.g. 2020"), { target: { value: "2021" } })
      expect(form.setYear).toHaveBeenCalledWith("2021")

      fireEvent.change(screen.getByPlaceholderText("e.g. 50000"), { target: { value: "1000" } })
      expect(form.setMileage).toHaveBeenCalledWith("1000")

      fireEvent.change(screen.getByPlaceholderText("e.g. 2.0L, 1500cc"), { target: { value: "1.6L" } })
      expect(form.setEngineSize).toHaveBeenCalledWith("1.6L")

      // Comboboxes in DOM order: Condition, Transmission, Fuel Type.
      const comboboxes = screen.getAllByRole("combobox")
      await user.click(comboboxes[1])
      await user.click(await screen.findByText("Manual"))
      expect(form.setTransmission).toHaveBeenCalledWith("Manual")

      await user.click(comboboxes[2])
      await user.click(await screen.findByText("Diesel"))
      expect(form.setFuelType).toHaveBeenCalledWith("Diesel")
    })
  })

  describe("when vehicleSection is 'spare_part'", () => {
    it("renders spare part name, part number and compatibility fields instead", () => {
      const form = makeProductFormState({
        isVehicles: true,
        vehicleSection: "spare_part",
        model: "Brake Pad",
        partNumber: "BP-100",
        compatibility: "Corolla 2015-2020",
      })
      render(<ProductVehicleSection form={form} />)
      expect(screen.getByText("Spare Part Name *")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("e.g. Brake Pad, Oil Filter, Chain")).toHaveValue("Brake Pad")
      expect(screen.getByPlaceholderText("OEM / Manufacturer Part #")).toHaveValue("BP-100")
      expect(screen.getByPlaceholderText("e.g. Toyota Corolla 2015-2020")).toHaveValue("Corolla 2015-2020")
      expect(screen.queryByText("Model")).not.toBeInTheDocument()
      expect(screen.queryByText("Year")).not.toBeInTheDocument()
    })

    it("calls setModel, setPartNumber and setCompatibility", () => {
      const form = makeProductFormState({ isVehicles: true, vehicleSection: "spare_part" })
      render(<ProductVehicleSection form={form} />)

      fireEvent.change(screen.getByPlaceholderText("e.g. Brake Pad, Oil Filter, Chain"), { target: { value: "Oil Filter" } })
      expect(form.setModel).toHaveBeenCalledWith("Oil Filter")

      fireEvent.change(screen.getByPlaceholderText("OEM / Manufacturer Part #"), { target: { value: "OF-1" } })
      expect(form.setPartNumber).toHaveBeenCalledWith("OF-1")

      fireEvent.change(screen.getByPlaceholderText("e.g. Toyota Corolla 2015-2020"), { target: { value: "Civic 2018+" } })
      expect(form.setCompatibility).toHaveBeenCalledWith("Civic 2018+")
    })
  })
})
