/**
 * Tests for the shared vendor product form logic (lib/vendor/product-form.ts).
 *
 * add-product-dialog.tsx and edit-product-dialog.tsx each carried their own
 * copy of this validation and payload building. These tests pin the behaviour
 * of the single shared copy — including the two places where create and update
 * deliberately differ, and the category-matching quirks transcribed from the
 * originals.
 */

import {
  EMPTY_PRODUCT_FORM,
  buildCreateProductPayload,
  buildUpdateProductPayload,
  deriveCategoryFlags,
  validateProductForm,
  type ProductCategoryFlags,
  type ProductFormValues,
} from "@/lib/vendor/product-form"

const NO_FLAGS: ProductCategoryFlags = {
  isFashion: false,
  isVehicles: false,
  isAgriculture: false,
  isServices: false,
  isReadyToEat: false,
  isDrinks: false,
}

const values = (over: Partial<ProductFormValues> = {}): ProductFormValues => ({
  ...EMPTY_PRODUCT_FORM,
  name: "Sisal Basket",
  description: "Hand woven",
  price: "25000",
  stockQuantity: "10",
  categoryId: "cat-1",
  ...over,
})

const UPDATED_AT = "2026-02-01T10:00:00.000Z"

describe("deriveCategoryFlags", () => {
  it("returns all false when nothing is selected", () => {
    expect(deriveCategoryFlags(null, null)).toEqual(NO_FLAGS)
  })

  it.each([
    ["Fashion", "isFashion"],
    ["Agriculture", "isAgriculture"],
    ["Vehicles", "isVehicles"],
    ["Drinks", "isDrinks"],
    ["Ready to Eat", "isReadyToEat"],
  ])("maps parent name %s to %s", (name, flag) => {
    const flags = deriveCategoryFlags({ id: "p", name }, { id: "c" })

    expect(flags[flag as keyof ProductCategoryFlags]).toBe(true)
  })

  it("is case insensitive on the parent name", () => {
    expect(deriveCategoryFlags({ id: "p", name: "FASHION" }, null).isFashion).toBe(true)
  })

  it("keeps matching the misspelled 'motorcyles' category", () => {
    // Present in real category data; dropping it would strip vehicle fields
    // from every motorcycle listing.
    expect(deriveCategoryFlags({ id: "p", name: "motorcyles" }, null).isVehicles).toBe(true)
    expect(deriveCategoryFlags({ id: "p", name: "motorcycles" }, null).isVehicles).toBe(true)
  })

  it("matches ready-to-eat by slug as well as name", () => {
    expect(deriveCategoryFlags({ id: "p", slug: "ready-to-eat" }, null).isReadyToEat).toBe(true)
  })

  it("does NOT match fashion or agriculture by slug", () => {
    // The originals checked name only for these two.
    expect(deriveCategoryFlags({ id: "p", slug: "fashion" }, null).isFashion).toBe(false)
    expect(deriveCategoryFlags({ id: "p", slug: "agriculture" }, null).isAgriculture).toBe(false)
  })

  it("matches services on the leaf category too, unlike every other flag", () => {
    expect(deriveCategoryFlags({ id: "p", name: "Other" }, { id: "c", slug: "services" }).isServices).toBe(true)
    expect(deriveCategoryFlags({ id: "p", name: "Other" }, { id: "c", name: "Services" }).isServices).toBe(true)
  })

  it("does not set unrelated flags for a services category", () => {
    const flags = deriveCategoryFlags({ id: "p", name: "Services" }, null)

    expect(flags.isServices).toBe(true)
    expect(flags.isFashion).toBe(false)
    expect(flags.isVehicles).toBe(false)
  })
})

describe("validateProductForm", () => {
  it("passes a form with a category", () => {
    expect(validateProductForm({ categoryId: "cat-1", weightUnit: "" }, NO_FLAGS)).toBeNull()
  })

  it("requires a category", () => {
    expect(validateProductForm({ categoryId: "", weightUnit: "" }, NO_FLAGS)).toBe("Please select a product category before uploading.")
  })

  it("requires a weight unit for agriculture", () => {
    expect(validateProductForm({ categoryId: "cat-1", weightUnit: "" }, { isAgriculture: true })).toBe(
      "Please select a weight unit for agricultural products.",
    )
  })

  it("accepts agriculture once a weight unit is chosen", () => {
    expect(validateProductForm({ categoryId: "cat-1", weightUnit: "kg" }, { isAgriculture: true })).toBeNull()
  })

  it("reports the missing category first when both rules fail", () => {
    expect(validateProductForm({ categoryId: "", weightUnit: "" }, { isAgriculture: true })).toBe(
      "Please select a product category before uploading.",
    )
  })

  it("does not require a weight unit outside agriculture", () => {
    expect(validateProductForm({ categoryId: "cat-1", weightUnit: "" }, { isAgriculture: false })).toBeNull()
  })
})

describe("buildCreateProductPayload", () => {
  it("marks a new product active and approved", () => {
    const payload = buildCreateProductPayload(values(), NO_FLAGS)

    expect(payload).toMatchObject({ is_active: true, status: "approved" })
  })

  it("coerces the numeric inputs", () => {
    const payload = buildCreateProductPayload(values({ price: "25000", stockQuantity: "10", moq: "3" }), NO_FLAGS)

    expect(payload).toMatchObject({ price: 25000, stock_quantity: 10, moq: 3 })
  })

  it("defaults moq to 1 when it is not a number", () => {
    expect(buildCreateProductPayload(values({ moq: "" }), NO_FLAGS).moq).toBe(1)
  })

  it("omits every category-specific key when no flag applies", () => {
    const payload = buildCreateProductPayload(values(), NO_FLAGS)

    for (const key of ["colors", "sizes", "weight_unit", "vehicle_section", "dietary_info", "drink_section"]) {
      expect(payload).not.toHaveProperty(key)
    }
  })

  it("includes fashion fields only for fashion", () => {
    const payload = buildCreateProductPayload(
      values({ colors: [{ name: "Indigo", image: "/i.jpg" }], sizes: ["S"], sizePrices: { S: 100 } }),
      { ...NO_FLAGS, isFashion: true },
    )

    expect(payload).toMatchObject({ sizes: ["S"], size_prices: { S: 100 } })
  })

  it("sends null size_prices when none are set", () => {
    const payload = buildCreateProductPayload(values({ sizes: ["S"] }), { ...NO_FLAGS, isFashion: true })

    expect(payload.size_prices).toBeNull()
  })

  it("omits weight_unit for agriculture when it is blank", () => {
    const payload = buildCreateProductPayload(values({ weightUnit: "" }), { ...NO_FLAGS, isAgriculture: true })

    expect(payload).not.toHaveProperty("weight_unit")
  })

  it("includes only vehicle fields for a vehicle", () => {
    const payload = buildCreateProductPayload(
      values({
        vehicleSection: "vehicle",
        brand: "Toyota",
        model: "Hilux",
        year: "2019",
        mileage: "80000",
        transmission: "manual",
        fuelType: "diesel",
        engineSize: "2.4",
        partNumber: "SHOULD-NOT-APPEAR",
      }),
      { ...NO_FLAGS, isVehicles: true },
    )

    expect(payload).toMatchObject({ year: 2019, mileage: 80000, transmission: "manual" })
    expect(payload).not.toHaveProperty("part_number")
  })

  it("includes only spare-part fields for a spare part", () => {
    const payload = buildCreateProductPayload(
      values({ vehicleSection: "spare_part", partNumber: "ABC-1", compatibility: "Hilux 2015+", year: "2019" }),
      { ...NO_FLAGS, isVehicles: true },
    )

    expect(payload).toMatchObject({ part_number: "ABC-1", compatibility: "Hilux 2015+" })
    expect(payload).not.toHaveProperty("year")
  })

  it("sends vehicle basics but no sub-section fields for an unknown section", () => {
    const payload = buildCreateProductPayload(values({ vehicleSection: "", brand: "Toyota" }), {
      ...NO_FLAGS,
      isVehicles: true,
    })

    expect(payload).toMatchObject({ vehicle_section: null, brand: "Toyota" })
    expect(payload).not.toHaveProperty("model")
  })

  it("turns blank optional strings into null", () => {
    const payload = buildCreateProductPayload(values({ vehicleSection: "vehicle", brand: "", model: "" }), {
      ...NO_FLAGS,
      isVehicles: true,
    })

    expect(payload.brand).toBeNull()
    expect(payload.model).toBeNull()
  })
})

describe("buildUpdateProductPayload", () => {
  it("stamps updated_at from the caller", () => {
    expect(buildUpdateProductPayload(values(), NO_FLAGS, UPDATED_AT).updated_at).toBe(UPDATED_AT)
  })

  it("does not resend is_active or status", () => {
    // An update must not silently re-approve a product.
    const payload = buildUpdateProductPayload(values(), NO_FLAGS, UPDATED_AT)

    expect(payload).not.toHaveProperty("is_active")
    expect(payload).not.toHaveProperty("status")
  })

  it("NULLS every inapplicable category key instead of omitting it", () => {
    // This is the load-bearing difference from create: recategorising a product
    // has to clear the old category's columns.
    const payload = buildUpdateProductPayload(values(), NO_FLAGS, UPDATED_AT)

    for (const key of [
      "colors",
      "sizes",
      "size_prices",
      "weight_unit",
      "vehicle_section",
      "brand",
      "model",
      "year",
      "mileage",
      "transmission",
      "fuel_type",
      "engine_size",
      "part_number",
      "compatibility",
      "dietary_info",
      "prep_time",
      "drink_section",
    ]) {
      expect(payload).toHaveProperty(key)
      expect(payload[key]).toBeNull()
    }
  })

  it("keeps fashion fields when the product is fashion", () => {
    const payload = buildUpdateProductPayload(values({ sizes: ["M"], sizePrices: { M: 5 } }), { ...NO_FLAGS, isFashion: true }, UPDATED_AT)

    expect(payload).toMatchObject({ sizes: ["M"], size_prices: { M: 5 } })
  })

  it("nulls spare-part fields for a vehicle and vice versa", () => {
    const asVehicle = buildUpdateProductPayload(
      values({ vehicleSection: "vehicle", year: "2019", partNumber: "ABC" }),
      { ...NO_FLAGS, isVehicles: true },
      UPDATED_AT,
    )
    expect(asVehicle.year).toBe(2019)
    expect(asVehicle.part_number).toBeNull()

    const asPart = buildUpdateProductPayload(
      values({ vehicleSection: "spare_part", year: "2019", partNumber: "ABC" }),
      { ...NO_FLAGS, isVehicles: true },
      UPDATED_AT,
    )
    expect(asPart.part_number).toBe("ABC")
    expect(asPart.year).toBeNull()
  })

  it("keeps model for both vehicle and spare_part", () => {
    for (const section of ["vehicle", "spare_part"]) {
      const payload = buildUpdateProductPayload(
        values({ vehicleSection: section, model: "Hilux" }),
        { ...NO_FLAGS, isVehicles: true },
        UPDATED_AT,
      )

      expect(payload.model).toBe("Hilux")
    }
  })

  it("sends the same common fields as create", () => {
    const created = buildCreateProductPayload(values(), NO_FLAGS)
    const updated = buildUpdateProductPayload(values(), NO_FLAGS, UPDATED_AT)

    for (const key of [
      "category_id",
      "name",
      "description",
      "price",
      "stock_quantity",
      "images",
      "quality_grade",
      "moq",
      "delivery_available",
    ]) {
      expect(updated[key]).toEqual(created[key])
    }
  })

  it("nulls weight_unit for agriculture with no unit, rather than omitting it", () => {
    const payload = buildUpdateProductPayload(values({ weightUnit: "" }), { ...NO_FLAGS, isAgriculture: true }, UPDATED_AT)

    expect(payload.weight_unit).toBe("")
  })
})
