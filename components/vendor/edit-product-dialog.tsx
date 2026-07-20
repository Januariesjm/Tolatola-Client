"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { clientApiGet, clientApiPut } from "@/lib/api-client"
import { Upload, X, ImageIcon } from "lucide-react"
import Image from "next/image"

interface EditProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any
  onSuccess: () => void
}

export function EditProductDialog({ open, onOpenChange, product, onSuccess }: EditProductDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [stockQuantity, setStockQuantity] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [parentCategoryId, setParentCategoryId] = useState("")
  const [subCategoryId, setSubCategoryId] = useState("")
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [qualityGrade, setQualityGrade] = useState("")
  const [moq, setMoq] = useState("1")
  const [deliveryAvailable, setDeliveryAvailable] = useState(true)
  const [colors, setColors] = useState<{ name: string; image: string; price?: number }[]>([])
  const [newColorName, setNewColorName] = useState("")
  const [newColorPrice, setNewColorPrice] = useState("")
  const [newColorImage, setNewColorImage] = useState("")
  const [uploadingColorImage, setUploadingColorImage] = useState(false)
  const [sizes, setSizes] = useState<string[]>([])
  const [sizePrices, setSizePrices] = useState<Record<string, number>>({})
  const [newSize, setNewSize] = useState("")
  const [newSizePrice, setNewSizePrice] = useState("")
  const [weightUnit, setWeightUnit] = useState("")

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
    if (product && open) {
      setName(product.name || "")
      setDescription(product.description || "")
      setPrice(product.price?.toString() || "")
      setStockQuantity(product.stock_quantity?.toString() || "")
      setCategoryId(product.category_id || "")
      setImages(product.images || [])
      setQualityGrade(product.quality_grade || "")
      setMoq(product.moq?.toString() || "1")
      setDeliveryAvailable(product.delivery_available ?? true)
      setColors(product.colors || [])
      setSizes(product.sizes || [])
      setSizePrices(product.size_prices || {})
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
      const cat = categories.find(c => c.id === product.category_id)
      if (cat) {
        if (cat.parent_id) {
          setParentCategoryId(cat.parent_id)
          setSubCategoryId(cat.id)
          // Auto-derive vehicle_section from subcategory slug on load
          if (cat.slug === 'spare-parts') {
            setVehicleSection('spare_part')
          } else if (cat.slug === 'vehicles-sub') {
            setVehicleSection('vehicle')
          }
        } else {
          setParentCategoryId(cat.id)
          setSubCategoryId("")
        }
      }
    }
  }, [product, categories])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await clientApiGet<{ data: any[] }>("categories")
        if (res?.data) setCategories(res.data)
      } catch {
        setCategories([])
      }
    }
    fetchCategories()
  }, [])

  const selectedCategory = categories.find((c) => c.id === categoryId)
  const selectedParentCategory = selectedCategory?.parent_id
    ? categories.find(c => c.id === selectedCategory.parent_id)
    : selectedCategory

  const isFashion = selectedParentCategory?.name?.toLowerCase() === "fashion"
  const isAgriculture = selectedParentCategory?.name?.toLowerCase() === "agriculture"
  const isVehicles = selectedParentCategory?.name?.toLowerCase() === "vehicles" ||
                     selectedParentCategory?.name?.toLowerCase() === "motorcycles" ||
                     selectedParentCategory?.name?.toLowerCase() === "motorcyles"
  const isReadyToEat = selectedParentCategory?.name?.toLowerCase() === "ready to eat" || selectedParentCategory?.slug === "ready-to-eat"
  const isDrinks = selectedParentCategory?.name?.toLowerCase() === "drinks" || selectedParentCategory?.slug === "drinks"

  useEffect(() => {
    if (!isAgriculture) {
      setWeightUnit("")
    }
  }, [isAgriculture])

  const handleColorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingColorImage(true)
    setError(null)

    try {
      const file = files[0]
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-product-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload image")
      }

      const data = await response.json()
      setNewColorImage(data.url)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to upload color image")
    } finally {
      setUploadingColorImage(false)
    }
  }

  const handleAddColor = () => {
    if (!newColorName.trim()) return
    const parsedPrice = Number.parseFloat(newColorPrice)
    const colorObj: any = { name: newColorName.trim(), image: newColorImage }
    if (!isNaN(parsedPrice) && parsedPrice > 0) {
      colorObj.price = parsedPrice
    }
    setColors([...colors, colorObj])
    setNewColorName("")
    setNewColorImage("")
    setNewColorPrice("")
  }

  const handleRemoveColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index))
  }

  const handleAddSize = () => {
    if (!newSize.trim()) return
    const sizeFormatted = newSize.trim().toUpperCase()
    if (!sizes.includes(sizeFormatted)) {
      setSizes([...sizes, sizeFormatted])
      const parsedPrice = Number.parseFloat(newSizePrice)
      if (!isNaN(parsedPrice) && parsedPrice > 0) {
        setSizePrices(prev => ({ ...prev, [sizeFormatted]: parsedPrice }))
      }
    }
    setNewSize("")
    setNewSizePrice("")
  }

  const handleRemoveSize = (index: number) => {
    const sizeToRemove = sizes[index]
    setSizes(sizes.filter((_, i) => i !== index))
    setSizePrices(prev => {
      const copy = { ...prev }
      delete copy[sizeToRemove]
      return copy
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImage(true)
    setError(null)

    try {
      const uploadedUrls: string[] = []

      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload-product-image", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Failed to upload image")
        }

        const data = await response.json()
        uploadedUrls.push(data.url)
      }

      setImages([...images, ...uploadedUrls])
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to upload images")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!categoryId) {
      setError("Please select a product category before uploading.")
      setIsLoading(false)
      return
    }

    if (isAgriculture && !weightUnit) {
      setError("Please select a weight unit for agricultural products.")
      setIsLoading(false)
      return
    }

    try {
      const payload: any = {
        category_id: categoryId || null,
        name,
        description,
        price: Number.parseFloat(price),
        stock_quantity: Number.parseInt(stockQuantity),
        images: images,
        quality_grade: qualityGrade,
        moq: Number.parseInt(moq) || 1,
        delivery_available: deliveryAvailable,
        updated_at: new Date().toISOString(),
        colors: isFashion ? colors : null,
        sizes: isFashion ? sizes : null,
        size_prices: isFashion ? (Object.keys(sizePrices).length > 0 ? sizePrices : null) : null,
        weight_unit: isAgriculture ? weightUnit : null,
        vehicle_section: isVehicles ? (vehicleSection || null) : null,
        brand: isVehicles ? (brand || null) : null,
        condition: isVehicles ? (condition || null) : null,
        model: (isVehicles && vehicleSection === "vehicle") ? (model || null) : null,
        year: (isVehicles && vehicleSection === "vehicle") ? (year ? parseInt(year) : null) : null,
        mileage: (isVehicles && vehicleSection === "vehicle") ? (mileage ? parseInt(mileage) : null) : null,
        transmission: (isVehicles && vehicleSection === "vehicle") ? (transmission || null) : null,
        fuel_type: (isVehicles && vehicleSection === "vehicle") ? (fuelType || null) : null,
        engine_size: (isVehicles && vehicleSection === "vehicle") ? (engineSize || null) : null,
        part_number: (isVehicles && vehicleSection === "spare_part") ? (partNumber || null) : null,
        compatibility: (isVehicles && vehicleSection === "spare_part") ? (compatibility || null) : null,
        dietary_info: isReadyToEat ? (dietaryInfo || null) : null,
        prep_time: isReadyToEat ? (prepTime || null) : null,
        drink_section: isDrinks ? (drinkSection || null) : null,
      }

      await clientApiPut(`products/${product.id}`, payload)

      onOpenChange(false)
      onSuccess()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>Update your product information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                placeholder="Product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your product..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Product Images</Label>
              <div className="space-y-4">
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    {images.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                        <Image
                          src={url || "/placeholder.svg"}
                          alt={`Product ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                  <Label
                    htmlFor="images"
                    className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-accent"
                  >
                    {uploadingImage ? (
                      <>
                        <Upload className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-4 w-4" />
                        Upload Images
                      </>
                    )}
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {images.length} image{images.length !== 1 ? "s" : ""} uploaded
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (TZS) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="10000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity *</Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="100"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quality_grade">Quality Grade</Label>
                <Select value={qualityGrade} onValueChange={setQualityGrade}>
                  <SelectTrigger id="quality_grade">
                    <SelectValue placeholder="Select quality grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Grade A (Premium)</SelectItem>
                    <SelectItem value="B">Grade B (Standard)</SelectItem>
                    <SelectItem value="C">Grade C (Basic)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="moq">Min Order Quantity (MOQ)</Label>
                <Input
                  id="moq"
                  type="number"
                  placeholder="1"
                  value={moq}
                  onChange={(e) => setMoq(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 py-2">
              <input
                type="checkbox"
                id="delivery_available"
                checked={deliveryAvailable}
                onChange={(e) => setDeliveryAvailable(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="delivery_available" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Delivery available handled by Tola
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={parentCategoryId}
                onValueChange={(val) => {
                  setParentCategoryId(val)
                  const subs = categories.filter(c => c.parent_id === val)
                  if (subs.length > 0) {
                    setSubCategoryId(subs[0].id)
                    setCategoryId(subs[0].id)
                  } else {
                    setSubCategoryId("")
                    setCategoryId(val)
                  }
                }}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => !c.parent_id).map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {categories.filter(c => c.parent_id === parentCategoryId).length > 0 && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <Label htmlFor="subcategory">Subcategory *</Label>
                <Select
                  value={subCategoryId}
                  onValueChange={(val) => {
                    setSubCategoryId(val)
                    setCategoryId(val)
                    // Auto-derive vehicle_section from subcategory slug
                    const subCat = categories.find(c => c.id === val)
                    if (subCat?.slug === 'spare-parts') {
                      setVehicleSection('spare_part')
                    } else if (subCat?.slug === 'vehicles-sub') {
                      setVehicleSection('vehicle')
                    }
                  }}
                >
                  <SelectTrigger id="subcategory">
                    <SelectValue placeholder="Select a subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter(c => c.parent_id === parentCategoryId)
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {isAgriculture && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <Label htmlFor="weight_unit">Sold by Weight (Weight Unit) *</Label>
                <Select value={weightUnit} onValueChange={setWeightUnit}>
                  <SelectTrigger id="weight_unit">
                    <SelectValue placeholder="Select a weight unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kg">Kilograms (Kg)</SelectItem>
                    <SelectItem value="g">Grams (g)</SelectItem>
                    <SelectItem value="Tons">Tons (Tons)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {isVehicles && (
              <div className="border-t pt-4 mt-4 space-y-4 animate-in fade-in duration-300">
                <h4 className="font-bold text-sm text-stone-900">Vehicles / Spare Parts Details</h4>
                {/* Section is auto-derived from subcategory for the Vehicles category */}
                {vehicleSection ? (
                  <div className="space-y-2">
                    <Label>Section</Label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-200 rounded-md text-sm text-stone-700">
                      <span className="font-medium">{vehicleSection === 'vehicle' ? '🚗 Vehicle' : '🔧 Spare Part'}</span>
                      <span className="text-stone-400 text-xs">(derived from subcategory)</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Section *</Label>
                    <Select value={vehicleSection} onValueChange={setVehicleSection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vehicle">Vehicle</SelectItem>
                        <SelectItem value="spare_part">Spare Part</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Brand / Make</Label>
                    <Input placeholder="e.g. Toyota, Honda" value={brand} onChange={(e) => setBrand(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Select value={condition} onValueChange={setCondition}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Used">Used</SelectItem>
                        <SelectItem value="Reconditioned">Reconditioned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {vehicleSection === "vehicle" && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Model</Label>
                        <Input placeholder="e.g. Corolla, Civic" value={model} onChange={(e) => setModel(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Year</Label>
                        <Input type="number" placeholder="e.g. 2020" value={year} onChange={(e) => setYear(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Mileage (km)</Label>
                        <Input type="number" placeholder="e.g. 50000" value={mileage} onChange={(e) => setMileage(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Transmission</Label>
                        <Select value={transmission} onValueChange={setTransmission}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Automatic">Automatic</SelectItem>
                            <SelectItem value="Manual">Manual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Fuel Type</Label>
                        <Select value={fuelType} onValueChange={setFuelType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Petrol">Petrol</SelectItem>
                            <SelectItem value="Diesel">Diesel</SelectItem>
                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                            <SelectItem value="Electric">Electric</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Engine Size</Label>
                        <Input placeholder="e.g. 2.0L, 1500cc" value={engineSize} onChange={(e) => setEngineSize(e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}
                {vehicleSection === "spare_part" && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Part Number</Label>
                        <Input placeholder="OEM / Manufacturer Part #" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Compatible Vehicles</Label>
                        <Input placeholder="e.g. Toyota Corolla 2015-2020" value={compatibility} onChange={(e) => setCompatibility(e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {isReadyToEat && (
              <div className="border-t pt-4 mt-4 space-y-4 animate-in fade-in duration-300">
                <h4 className="font-bold text-sm text-stone-900">Ready to Eat Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Dietary Information</Label>
                    <Select value={dietaryInfo} onValueChange={setDietaryInfo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select dietary info" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Halal">Halal</SelectItem>
                        <SelectItem value="Vegetarian">Vegetarian</SelectItem>
                        <SelectItem value="Vegan">Vegan</SelectItem>
                        <SelectItem value="Gluten-Free">Gluten-Free</SelectItem>
                        <SelectItem value="None">None / Not Applicable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Preparation Time</Label>
                    <Select value={prepTime} onValueChange={setPrepTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select prep time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ready Now">Ready Now</SelectItem>
                        <SelectItem value="5-10 min">5-10 min</SelectItem>
                        <SelectItem value="10-20 min">10-20 min</SelectItem>
                        <SelectItem value="20-30 min">20-30 min</SelectItem>
                        <SelectItem value="30-60 min">30-60 min</SelectItem>
                        <SelectItem value="1+ hour">1+ hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            {isDrinks && (
              <div className="border-t pt-4 mt-4 space-y-4 animate-in fade-in duration-300">
                <h4 className="font-bold text-sm text-stone-900">Drinks Details</h4>
                <div className="space-y-2">
                  <Label>Section *</Label>
                  <Select value={drinkSection} onValueChange={setDrinkSection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alcoholic">Alcoholic</SelectItem>
                      <SelectItem value="non_alcoholic">Non-Alcoholic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            {isFashion && (
              <div className="border-t pt-4 mt-4 space-y-4 animate-in fade-in duration-300">
                <h4 className="font-bold text-sm text-stone-900">Fashion Variations</h4>

                {/* Sizes Section */}
                <div className="space-y-2">
                  <Label>Available Sizes</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 flex gap-2">
                      <Input
                        placeholder="e.g. S, M, L, XL, 40, 42"
                        value={newSize}
                        onChange={(e) => setNewSize(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleAddSize()
                          }
                        }}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Price (Optional)"
                        type="number"
                        value={newSizePrice}
                        onChange={(e) => setNewSizePrice(e.target.value)}
                        className="flex-1 text-xs"
                      />
                      <Button type="button" onClick={handleAddSize} variant="secondary">
                        Add
                      </Button>
                    </div>
                  </div>
                  {sizes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {sizes.map((size, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-stone-100 text-stone-800 border border-stone-200"
                        >
                          {size}
                          {sizePrices[size] && (
                            <span className="text-[10px] text-stone-500 font-normal ml-1">
                              (TZS {sizePrices[size].toLocaleString()})
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveSize(idx)}
                            className="text-stone-400 hover:text-stone-600 font-bold ml-1"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Colors Section */}
                <div className="space-y-2">
                  <Label>Color Variations (with Image Placeholders)</Label>
                  <div className="p-4 border rounded-xl bg-stone-50/50 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="color-name" className="text-xs text-stone-500">Color Name</Label>
                        <Input
                          id="color-name"
                          placeholder="e.g. Cherry Red"
                          value={newColorName}
                          onChange={(e) => setNewColorName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="color-price" className="text-xs text-stone-500">Price (Optional)</Label>
                        <Input
                          id="color-price"
                          placeholder="e.g. 15000"
                          type="number"
                          value={newColorPrice}
                          onChange={(e) => setNewColorPrice(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-stone-500">Color Image Placeholder</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="color-image-file"
                            type="file"
                            accept="image/*"
                            onChange={handleColorImageUpload}
                            disabled={uploadingColorImage}
                            className="hidden"
                          />
                          <Label
                            htmlFor="color-image-file"
                            className="flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer hover:bg-accent bg-white text-xs font-semibold"
                          >
                            {uploadingColorImage ? "Uploading..." : "Upload Image"}
                          </Label>
                          {newColorImage && (
                            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-stone-200">
                              <img src={newColorImage} className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddColor}
                      variant="secondary"
                      className="w-full text-xs font-bold"
                      disabled={!newColorName.trim()}
                    >
                      Add Color Variation
                    </Button>
                  </div>

                  {colors.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {colors.map((color, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-xl border bg-white shadow-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-stone-100 flex-shrink-0 bg-stone-50">
                              {color.image ? (
                                <img src={color.image} className="w-full h-full object-cover" />
                              ) : (
                                <span className="absolute inset-0" style={{ backgroundColor: color.name.toLowerCase() }} />
                              )}
                            </div>
                            <span className="text-xs font-bold truncate text-stone-800">
                              {color.name}
                              {color.price && (
                                <span className="text-[10px] text-stone-500 font-normal block">
                                  TZS {color.price.toLocaleString()}
                                </span>
                              )}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveColor(idx)}
                            className="text-stone-400 hover:text-stone-600 text-sm font-bold pr-1"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || uploadingImage}>
              {isLoading ? "Updating..." : "Update Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
