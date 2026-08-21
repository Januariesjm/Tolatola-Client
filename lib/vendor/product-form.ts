/**
 * Shared field types, validation and payload building for the vendor product
 * form.
 *
 * add-product-dialog.tsx and edit-product-dialog.tsx were 939 and 929 lines
 * that differed by six lines of markup and a payload builder. Both carried
 * their own copy of the same validation, so a rule fixed in one could silently
 * stay broken in the other. This module is the single copy.
 *
 * Pure: no React, no fetching, so every branch is unit-testable.
 */

/** One selectable colourway on a fashion product. */
export interface ProductColorInput {
  name: string
  image: string
  price?: number
}

/** Every field the product form collects, as raw form values. */
export interface ProductFormValues {
  name: string
  description: string
  /** Kept as a string because it comes straight from an <input>. */
  price: string
  stockQuantity: string
  categoryId: string
  images: string[]
  qualityGrade: string
  moq: string
  deliveryAvailable: boolean
  colors: ProductColorInput[]
  sizes: string[]
  sizePrices: Record<string, number>
  weightUnit: string
  vehicleSection: string
  brand: string
  model: string
  year: string
  mileage: string
  transmission: string
  fuelType: string
  engineSize: string
  partNumber: string
  compatibility: string
  condition: string
  dietaryInfo: string
  prepTime: string
  drinkSection: string
}

/**
 * Which category-specific field groups apply, derived from the selected
 * category rather than stored.
 */
export interface ProductCategoryFlags {
  isFashion: boolean
  isVehicles: boolean
  isAgriculture: boolean
  isServices: boolean
  isReadyToEat: boolean
  isDrinks: boolean
}

/** A category row as returned by the categories endpoint. */
export interface ProductCategory {
  id: string
  name?: string | null
  slug?: string | null
  parent_id?: string | null
}

const lower = (value?: string | null) => (value || "").toLowerCase()

/**
 * Derives the category flags from the selected parent/leaf category.
 *
 * Transcribed from the two dialogs, quirks included:
 * - "motorcyles" is a real misspelling present in the category data, so
 *   isVehicles must keep matching it or motorcycle listings lose their
 *   vehicle fields.
 * - isServices is the only flag that also looks at the leaf category, and the
 *   only one that matches on slug without lower-casing it.
 * - isFashion and isAgriculture match on name only, not slug.
 */
export function deriveCategoryFlags(parentCategory?: ProductCategory | null, category?: ProductCategory | null): ProductCategoryFlags {
  const parentName = lower(parentCategory?.name)
  const parentSlug = parentCategory?.slug

  return {
    isFashion: parentName === "fashion",
    isAgriculture: parentName === "agriculture",
    isVehicles: parentName === "vehicles" || parentName === "motorcycles" || parentName === "motorcyles",
    isServices:
      parentName === "services" || parentSlug === "services" || lower(category?.name) === "services" || category?.slug === "services",
    isReadyToEat: parentName === "ready to eat" || parentSlug === "ready-to-eat",
    isDrinks: parentName === "drinks" || parentSlug === "drinks",
  }
}

/**
 * Returns the first validation failure, or null when the form may be
 * submitted. Shared by both dialogs so the rules cannot diverge.
 */
export function validateProductForm(
  values: Pick<ProductFormValues, "categoryId" | "weightUnit">,
  flags: Pick<ProductCategoryFlags, "isAgriculture">,
): string | null {
  if (!values.categoryId) {
    return "Please select a product category before uploading."
  }
  if (flags.isAgriculture && !values.weightUnit) {
    return "Please select a weight unit for agricultural products."
  }
  return null
}

/** Fields both payloads always carry. */
function commonFields(values: ProductFormValues) {
  return {
    category_id: values.categoryId || null,
    name: values.name,
    description: values.description,
    price: Number.parseFloat(values.price),
    stock_quantity: Number.parseInt(values.stockQuantity),
    images: values.images,
    quality_grade: values.qualityGrade,
    moq: Number.parseInt(values.moq) || 1,
    delivery_available: values.deliveryAvailable,
  }
}

const sizePricesOrNull = (sizePrices: Record<string, number>) => (Object.keys(sizePrices).length > 0 ? sizePrices : null)

/**
 * Payload for creating a product.
 *
 * Only includes the category-specific groups that apply — the create endpoint
 * treats an absent key as "not set".
 */
export function buildCreateProductPayload(values: ProductFormValues, flags: ProductCategoryFlags): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    ...commonFields(values),
    is_active: true,
    status: "approved",
  }

  if (flags.isFashion) {
    payload.colors = values.colors
    payload.sizes = values.sizes
    payload.size_prices = sizePricesOrNull(values.sizePrices)
  }

  if (flags.isAgriculture && values.weightUnit) {
    payload.weight_unit = values.weightUnit
  }

  if (flags.isVehicles) {
    payload.vehicle_section = values.vehicleSection || null
    payload.brand = values.brand || null
    payload.condition = values.condition || null

    if (values.vehicleSection === "vehicle") {
      payload.model = values.model || null
      payload.year = values.year ? parseInt(values.year) : null
      payload.mileage = values.mileage ? parseInt(values.mileage) : null
      payload.transmission = values.transmission || null
      payload.fuel_type = values.fuelType || null
      payload.engine_size = values.engineSize || null
    } else if (values.vehicleSection === "spare_part") {
      payload.model = values.model || null
      payload.part_number = values.partNumber || null
      payload.compatibility = values.compatibility || null
    }
  }

  if (flags.isReadyToEat) {
    payload.dietary_info = values.dietaryInfo || null
    payload.prep_time = values.prepTime || null
  }

  if (flags.isDrinks) {
    payload.drink_section = values.drinkSection || null
  }

  return payload
}

/**
 * Payload for updating a product.
 *
 * Unlike create, this sends every category-specific key and nulls the ones that
 * no longer apply. That is deliberate and load-bearing: changing a product's
 * category has to clear the old category's fields, and an absent key would
 * leave stale values in the row. `updatedAt` is injected so the caller controls
 * the timestamp (and tests can pin it).
 */
export function buildUpdateProductPayload(
  values: ProductFormValues,
  flags: ProductCategoryFlags,
  updatedAt: string,
): Record<string, unknown> {
  const isVehicle = flags.isVehicles && values.vehicleSection === "vehicle"
  const isSparePart = flags.isVehicles && values.vehicleSection === "spare_part"

  return {
    ...commonFields(values),
    updated_at: updatedAt,
    colors: flags.isFashion ? values.colors : null,
    sizes: flags.isFashion ? values.sizes : null,
    size_prices: flags.isFashion ? sizePricesOrNull(values.sizePrices) : null,
    weight_unit: flags.isAgriculture ? values.weightUnit : null,
    vehicle_section: flags.isVehicles ? values.vehicleSection || null : null,
    brand: flags.isVehicles ? values.brand || null : null,
    condition: flags.isVehicles ? values.condition || null : null,
    model: isVehicle || isSparePart ? values.model || null : null,
    year: isVehicle ? (values.year ? parseInt(values.year) : null) : null,
    mileage: isVehicle ? (values.mileage ? parseInt(values.mileage) : null) : null,
    transmission: isVehicle ? values.transmission || null : null,
    fuel_type: isVehicle ? values.fuelType || null : null,
    engine_size: isVehicle ? values.engineSize || null : null,
    part_number: isSparePart ? values.partNumber || null : null,
    compatibility: isSparePart ? values.compatibility || null : null,
    dietary_info: flags.isReadyToEat ? values.dietaryInfo || null : null,
    prep_time: flags.isReadyToEat ? values.prepTime || null : null,
    drink_section: flags.isDrinks ? values.drinkSection || null : null,
  }
}

/** Blank form, used for create and to reset after a successful submit. */
export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  name: "",
  description: "",
  price: "",
  stockQuantity: "",
  categoryId: "",
  images: [],
  qualityGrade: "",
  moq: "1",
  deliveryAvailable: true,
  colors: [],
  sizes: [],
  sizePrices: {},
  weightUnit: "",
  vehicleSection: "",
  brand: "",
  model: "",
  year: "",
  mileage: "",
  transmission: "",
  fuelType: "",
  engineSize: "",
  partNumber: "",
  compatibility: "",
  condition: "",
  dietaryInfo: "",
  prepTime: "",
  drinkSection: "",
}
