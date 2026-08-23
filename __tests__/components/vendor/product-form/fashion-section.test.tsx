import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ProductFashionSection } from "@/components/vendor/product-form/fashion-section"
import { makeProductFormState } from "../../../setup/product-form-fixtures"

describe("ProductFashionSection", () => {
  it("renders nothing when the category is not fashion", () => {
    const form = makeProductFormState({ isFashion: false })
    const { container } = render(<ProductFashionSection form={form} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("renders the size and color inputs when fashion", () => {
    const form = makeProductFormState({ isFashion: true })
    render(<ProductFashionSection form={form} />)
    expect(screen.getByText("Fashion Variations")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("e.g. S, M, L, XL, 40, 42")).toBeInTheDocument()
    expect(screen.getByLabelText("Color Name")).toBeInTheDocument()
    expect(screen.getByLabelText("Price (Optional)")).toBeInTheDocument()
  })

  describe("sizes", () => {
    it("calls setNewSize when the size input changes", () => {
      const form = makeProductFormState({ isFashion: true })
      render(<ProductFashionSection form={form} />)
      fireEvent.change(screen.getByPlaceholderText("e.g. S, M, L, XL, 40, 42"), { target: { value: "M" } })
      expect(form.setNewSize).toHaveBeenCalledWith("M")
    })

    it("calls setNewSizePrice when the size price input changes", () => {
      const form = makeProductFormState({ isFashion: true })
      render(<ProductFashionSection form={form} />)
      fireEvent.change(screen.getByPlaceholderText("Price (Optional)"), { target: { value: "1000" } })
      expect(form.setNewSizePrice).toHaveBeenCalledWith("1000")
    })

    it("calls handleAddSize when pressing Enter in the size input", () => {
      const form = makeProductFormState({ isFashion: true, newSize: "M" })
      render(<ProductFashionSection form={form} />)
      fireEvent.keyDown(screen.getByPlaceholderText("e.g. S, M, L, XL, 40, 42"), { key: "Enter" })
      expect(form.handleAddSize).toHaveBeenCalledTimes(1)
    })

    it("calls handleAddSize when the Add button is clicked", async () => {
      const user = userEvent.setup()
      const form = makeProductFormState({ isFashion: true, newSize: "M" })
      render(<ProductFashionSection form={form} />)
      await user.click(screen.getByRole("button", { name: "Add" }))
      expect(form.handleAddSize).toHaveBeenCalledTimes(1)
    })

    it("renders existing sizes with their optional price and a remove control", async () => {
      const user = userEvent.setup()
      const form = makeProductFormState({
        isFashion: true,
        sizes: ["M", "L"],
        sizePrices: { M: 15000 },
      })
      render(<ProductFashionSection form={form} />)
      expect(screen.getByText("M")).toBeInTheDocument()
      expect(screen.getByText("L")).toBeInTheDocument()
      expect(screen.getByText("(TZS 15,000)")).toBeInTheDocument()

      const removeButtons = screen.getAllByText("×")
      await user.click(removeButtons[0])
      expect(form.handleRemoveSize).toHaveBeenCalledWith(0)
    })
  })

  describe("colors", () => {
    it("calls setNewColorName and setNewColorPrice on input change", () => {
      const form = makeProductFormState({ isFashion: true })
      render(<ProductFashionSection form={form} />)
      fireEvent.change(screen.getByLabelText("Color Name"), { target: { value: "Cherry Red" } })
      expect(form.setNewColorName).toHaveBeenCalledWith("Cherry Red")

      fireEvent.change(screen.getByLabelText("Price (Optional)"), { target: { value: "20000" } })
      expect(form.setNewColorPrice).toHaveBeenCalledWith("20000")
    })

    it("disables the Add Color Variation button when there is no color name", () => {
      const form = makeProductFormState({ isFashion: true, newColorName: "" })
      render(<ProductFashionSection form={form} />)
      expect(screen.getByRole("button", { name: "Add Color Variation" })).toBeDisabled()
    })

    it("enables and calls handleAddColor when a color name is present", async () => {
      const user = userEvent.setup()
      const form = makeProductFormState({ isFashion: true, newColorName: "Cherry Red" })
      render(<ProductFashionSection form={form} />)
      const button = screen.getByRole("button", { name: "Add Color Variation" })
      expect(button).toBeEnabled()
      await user.click(button)
      expect(form.handleAddColor).toHaveBeenCalledTimes(1)
    })

    it("calls handleColorImageUpload when a file is chosen", () => {
      const form = makeProductFormState({ isFashion: true })
      const { container } = render(<ProductFashionSection form={form} />)
      const fileInput = container.querySelector("#color-image-file") as HTMLInputElement
      const file = new File(["hello"], "swatch.png", { type: "image/png" })
      fireEvent.change(fileInput, { target: { files: [file] } })
      expect(form.handleColorImageUpload).toHaveBeenCalledTimes(1)
    })

    it("shows an uploading label while a color image uploads", () => {
      const form = makeProductFormState({ isFashion: true, uploadingColorImage: true })
      render(<ProductFashionSection form={form} />)
      expect(screen.getByText("Uploading...")).toBeInTheDocument()
      expect(screen.queryByText("Upload Image")).not.toBeInTheDocument()
    })

    it("shows a preview when a new color image is set", () => {
      const form = makeProductFormState({ isFashion: true, newColorImage: "https://example.com/swatch.png" })
      render(<ProductFashionSection form={form} />)
      expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/swatch.png")
    })

    it("renders existing colors with name, optional price and a remove control", async () => {
      const user = userEvent.setup()
      const form = makeProductFormState({
        isFashion: true,
        colors: [
          { name: "Cherry Red", image: "https://example.com/red.png", price: 20000 },
          { name: "Navy", image: "" },
        ],
      })
      render(<ProductFashionSection form={form} />)
      expect(screen.getByText("Cherry Red")).toBeInTheDocument()
      expect(screen.getByText("Navy")).toBeInTheDocument()
      expect(screen.getByText("TZS 20,000")).toBeInTheDocument()

      const removeButtons = screen.getAllByText("×")
      await user.click(removeButtons[removeButtons.length - 1])
      expect(form.handleRemoveColor).toHaveBeenCalledWith(1)
    })
  })
})
