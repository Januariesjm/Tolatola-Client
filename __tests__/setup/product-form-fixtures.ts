/**
 * Shared test fixtures for components/vendor/product-form/*.
 *
 * Every section takes a slice of `ProductFormState` (see
 * hooks/use-product-form.ts), so rather than duplicating a huge mock object in
 * each of the eight test files, `makeProductFormState` builds one with sane
 * defaults (jest.fn() for every setter/handler) and lets each test override
 * just the fields it cares about.
 *
 * Also polyfills the Pointer Capture APIs that jsdom does not implement.
 * Radix's Select calls `target.hasPointerCapture(...)` unconditionally on
 * pointer-down, which throws "not a function" under jsdom without this --
 * unrelated to anything the components themselves do.
 */
import type { ProductFormState } from "@/hooks/use-product-form"

if (typeof Element !== "undefined") {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {}
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {}
  }
}

export function makeProductFormState(overrides: Partial<ProductFormState> = {}): ProductFormState {
  const base: ProductFormState = {
    // basics
    name: "",
    setName: jest.fn(),
    description: "",
    setDescription: jest.fn(),
    price: "",
    setPrice: jest.fn(),
    stockQuantity: "",
    setStockQuantity: jest.fn(),
    qualityGrade: "",
    setQualityGrade: jest.fn(),
    moq: "1",
    setMoq: jest.fn(),
    deliveryAvailable: true,
    setDeliveryAvailable: jest.fn(),
    // categories
    categories: [],
    categoryId: "",
    setCategoryId: jest.fn(),
    parentCategoryId: "",
    setParentCategoryId: jest.fn(),
    subCategoryId: "",
    setSubCategoryId: jest.fn(),
    isFashion: false,
    isAgriculture: false,
    isVehicles: false,
    isServices: false,
    isReadyToEat: false,
    isDrinks: false,
    // media
    images: [],
    setImages: jest.fn(),
    uploadingImage: false,
    handleImageUpload: jest.fn(),
    handleRemoveImage: jest.fn(),
    // fashion
    colors: [],
    newColorName: "",
    setNewColorName: jest.fn(),
    newColorPrice: "",
    setNewColorPrice: jest.fn(),
    newColorImage: "",
    uploadingColorImage: false,
    handleColorImageUpload: jest.fn(),
    handleAddColor: jest.fn(),
    handleRemoveColor: jest.fn(),
    sizes: [],
    sizePrices: {},
    newSize: "",
    setNewSize: jest.fn(),
    newSizePrice: "",
    setNewSizePrice: jest.fn(),
    handleAddSize: jest.fn(),
    handleRemoveSize: jest.fn(),
    // agriculture
    weightUnit: "",
    setWeightUnit: jest.fn(),
    // vehicles
    vehicleSection: "",
    setVehicleSection: jest.fn(),
    brand: "",
    setBrand: jest.fn(),
    model: "",
    setModel: jest.fn(),
    year: "",
    setYear: jest.fn(),
    mileage: "",
    setMileage: jest.fn(),
    transmission: "",
    setTransmission: jest.fn(),
    fuelType: "",
    setFuelType: jest.fn(),
    engineSize: "",
    setEngineSize: jest.fn(),
    partNumber: "",
    setPartNumber: jest.fn(),
    compatibility: "",
    setCompatibility: jest.fn(),
    condition: "",
    setCondition: jest.fn(),
    // food & drink
    dietaryInfo: "",
    setDietaryInfo: jest.fn(),
    prepTime: "",
    setPrepTime: jest.fn(),
    drinkSection: "",
    setDrinkSection: jest.fn(),
    // submit
    isLoading: false,
    error: null,
    handleSubmit: jest.fn(async (e: { preventDefault: () => void }) => e.preventDefault()),
  }

  return { ...base, ...overrides }
}
