"use client"

import { useEffect, useState } from "react"
import { clientApiGet, clientApiPost, clientApiPut } from "@/lib/api-client"
import { logger, normalizeError } from "@/lib/logger"
import { useProductImages } from "@/hooks/use-product-images"
import { useProductVariants } from "@/hooks/use-product-variants"
import {
  buildCreateProductPayload,
  buildUpdateProductPayload,
  deriveCategoryFlags,
  validateProductForm,
  type ProductCategory,
  type ProductColorInput,
  type ProductFormValues,
} from "@/lib/vendor/product-form"

const log = logger.child("vendor.product-form")

/** A product as the edit dialog receives it, before the form hydrates from it. */
export interface EditableProduct {
  id: string
  name?: string | null
  description?: string | null
  price?: number | null
  stock_quantity?: number | null
  category_id?: string | null
  images?: string[] | null
  quality_grade?: string | null
  moq?: number | null
  delivery_available?: boolean | null
  colors?: ProductColorInput[] | null
  sizes?: string[] | null
  size_prices?: Record<string, number> | null
  weight_unit?: string | null
  vehicle_section?: string | null
  brand?: string | null
  model?: string | null
  year?: number | null
  mileage?: number | null
  transmission?: string | null
  fuel_type?: string | null
  engine_size?: string | null
  part_number?: string | null
  compatibility?: string | null
  condition?: string | null
  dietary_info?: string | null
  prep_time?: string | null
  drink_section?: string | null
}

interface UseProductFormOptions {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  /** Creating under a shop, or editing an existing product. */
  mode: "create" | "edit"
  /** Required when mode is "create". */
  shopId?: string
  /** Required when mode is "edit". */
  product?: EditableProduct | null
}

/**
 * All state, category derivation, media handling, validation and submission for
 * the vendor product form.
 *
 * add-product-dialog.tsx and edit-product-dialog.tsx were 939 and 929 lines
 * whose markup differed by six lines. Both kept their own copy of this logic,
 * so the two could silently drift. This is the single copy; the dialogs are now
 * thin shells that differ only in their labels and this hook's mode.
 */
export function useProductForm({ open, onOpenChange, onSuccess, mode, shopId, product }: UseProductFormOptions) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [stockQuantity, setStockQuantity] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [parentCategoryId, setParentCategoryId] = useState("")
  const [subCategoryId, setSubCategoryId] = useState("")
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qualityGrade, setQualityGrade] = useState("")
  const [moq, setMoq] = useState("1")
  const [deliveryAvailable, setDeliveryAvailable] = useState(true)
  const [weightUnit, setWeightUnit] = useState("")

  const { images, setImages, uploadingImage, handleImageUpload, handleRemoveImage, reset: resetImages } = useProductImages(
    product,
    open,
    setError,
  )
  const {
    colors,
    newColorName,
    setNewColorName,
    newColorPrice,
    setNewColorPrice,
    newColorImage,
    uploadingColorImage,
    handleColorImageUpload,
    handleAddColor,
    handleRemoveColor,
    sizes,
    sizePrices,
    newSize,
    setNewSize,
    newSizePrice,
    setNewSizePrice,
    handleAddSize,
    handleRemoveSize,
    reset: resetVariants,
  } = useProductVariants(product, open, setError)

  // Vehicles & Spare Parts state
  const [vehicleSection, setVehicleSection] = useState("")
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [year, setYear] = useState("")
  const [mileage, setMileage] = useState("")
  const [transmission, setTransmission] = useState("")
  const [fuelType, setFuelType] = useState("")
  const [engineSize, setEngineSize] = useState("")
  const [partNumber, setPartNumber] = useState("")
  const [compatibility, setCompatibility] = useState("")
  const [condition, setCondition] = useState("")

  // Ready to Eat state
  const [dietaryInfo, setDietaryInfo] = useState("")
  const [prepTime, setPrepTime] = useState("")

  // Drinks state
  const [drinkSection, setDrinkSection] = useState("")
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await clientApiGet<{ data: ProductCategory[] }>("categories")
        if (res?.data) setCategories(res.data)
      } catch {
        setCategories([])
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    if (product && open) {
      setName(product.name || "")
      setDescription(product.description || "")
      setPrice(product.price?.toString() || "")
      setStockQuantity(product.stock_quantity?.toString() || "")
      setCategoryId(product.category_id || "")
      setQualityGrade(product.quality_grade || "")
      setMoq(product.moq?.toString() || "1")
      setDeliveryAvailable(product.delivery_available ?? true)
      setWeightUnit(product.weight_unit || "")
      setVehicleSection(product.vehicle_section || "")
      setBrand(product.brand || "")
      setModel(product.model || "")
      setYear(product.year?.toString() || "")
      setMileage(product.mileage?.toString() || "")
      setTransmission(product.transmission || "")
      setFuelType(product.fuel_type || "")
      setEngineSize(product.engine_size || "")
      setPartNumber(product.part_number || "")
      setCompatibility(product.compatibility || "")
      setCondition(product.condition || "")
      setDietaryInfo(product.dietary_info || "")
      setPrepTime(product.prep_time || "")
      setDrinkSection(product.drink_section || "")
    }
  }, [product, open])

  useEffect(() => {
    if (product && categories.length > 0) {
      const cat = categories.find((c) => c.id === product.category_id)
      if (cat) {
        if (cat.parent_id) {
          setParentCategoryId(cat.parent_id)
          setSubCategoryId(cat.id)
          // Auto-derive vehicle_section from subcategory slug on load
          if (cat.slug === "spare-parts") {
            setVehicleSection("spare_part")
          } else if (cat.slug === "vehicles-sub") {
            setVehicleSection("vehicle")
          } else if (cat.slug === "non-alcoholic") {
            setDrinkSection("non_alcoholic")
          } else if (cat.slug === "alcoholic") {
            setDrinkSection("alcoholic")
          }
        } else {
          setParentCategoryId(cat.id)
          setSubCategoryId("")
        }
      }
    }
  }, [product, categories])

  const selectedCategory = categories.find((c) => c.id === categoryId)
  const selectedParentCategory = selectedCategory?.parent_id
    ? categories.find((c) => c.id === selectedCategory.parent_id)
    : selectedCategory

  const { isFashion, isAgriculture, isVehicles, isServices, isReadyToEat, isDrinks } = deriveCategoryFlags(
    selectedParentCategory,
    selectedCategory,
  )

  useEffect(() => {
    if (!isAgriculture) {
      setWeightUnit("")
    }
  }, [isAgriculture])

  /** Current field values, in the shape the payload builders expect. */
  const formValues = (): ProductFormValues => ({
    name,
    description,
    price,
    stockQuantity,
    categoryId,
    images,
    qualityGrade,
    moq,
    deliveryAvailable,
    colors,
    sizes,
    sizePrices,
    weightUnit,
    vehicleSection,
    brand,
    model,
    year,
    mileage,
    transmission,
    fuelType,
    engineSize,
    partNumber,
    compatibility,
    condition,
    dietaryInfo,
    prepTime,
    drinkSection,
  })

  const resetForm = () => {
    setName("")
    setDescription("")
    setPrice("")
    setStockQuantity("")
    setCategoryId("")
    setParentCategoryId("")
    setSubCategoryId("")
    resetImages()
    resetVariants()
    setWeightUnit("")
    setVehicleSection("")
    setBrand("")
    setModel("")
    setYear("")
    setMileage("")
    setTransmission("")
    setFuelType("")
    setEngineSize("")
    setPartNumber("")
    setCompatibility("")
    setCondition("")
    setDietaryInfo("")
    setPrepTime("")
    setDrinkSection("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const flags = { isFashion, isAgriculture, isVehicles, isServices, isReadyToEat, isDrinks }
    const values = formValues()

    const validationError = validateProductForm(values, flags)
    if (validationError) {
      setError(validationError)
      setIsLoading(false)
      return
    }

    try {
      if (mode === "create") {
        await clientApiPost(`shops/${shopId}/products`, buildCreateProductPayload(values, flags))
        onOpenChange(false)
        onSuccess()
        resetForm()
      } else {
        await clientApiPut(`products/${product?.id}`, buildUpdateProductPayload(values, flags, new Date().toISOString()))
        onOpenChange(false)
        onSuccess()
      }
    } catch (err) {
      log.error(mode === "create" ? "product creation failed" : "product update failed", err)
      setError(normalizeError(err).message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return {
    // basics
    name,
    setName,
    description,
    setDescription,
    price,
    setPrice,
    stockQuantity,
    setStockQuantity,
    qualityGrade,
    setQualityGrade,
    moq,
    setMoq,
    deliveryAvailable,
    setDeliveryAvailable,
    // categories
    categories,
    categoryId,
    setCategoryId,
    parentCategoryId,
    setParentCategoryId,
    subCategoryId,
    setSubCategoryId,
    isFashion,
    isAgriculture,
    isVehicles,
    isServices,
    isReadyToEat,
    isDrinks,
    // media
    images,
    setImages,
    uploadingImage,
    handleImageUpload,
    handleRemoveImage,
    // fashion
    colors,
    newColorName,
    setNewColorName,
    newColorPrice,
    setNewColorPrice,
    newColorImage,
    uploadingColorImage,
    handleColorImageUpload,
    handleAddColor,
    handleRemoveColor,
    sizes,
    sizePrices,
    newSize,
    setNewSize,
    newSizePrice,
    setNewSizePrice,
    handleAddSize,
    handleRemoveSize,
    // agriculture
    weightUnit,
    setWeightUnit,
    // vehicles
    vehicleSection,
    setVehicleSection,
    brand,
    setBrand,
    model,
    setModel,
    year,
    setYear,
    mileage,
    setMileage,
    transmission,
    setTransmission,
    fuelType,
    setFuelType,
    engineSize,
    setEngineSize,
    partNumber,
    setPartNumber,
    compatibility,
    setCompatibility,
    condition,
    setCondition,
    // food & drink
    dietaryInfo,
    setDietaryInfo,
    prepTime,
    setPrepTime,
    drinkSection,
    setDrinkSection,
    // submit
    isLoading,
    error,
    handleSubmit,
  }
}

export type ProductFormState = ReturnType<typeof useProductForm>
