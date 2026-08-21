"use client"

import { useEffect, useState } from "react"
import type { ProductColorInput } from "@/lib/vendor/product-form"

/**
 * Fashion-category product variants: colors (with an optional per-colorway
 * price and image) and sizes (with an optional per-size price), plus seeding
 * from an existing product when editing.
 *
 * Extracted from hooks/use-product-form.ts, which held this alongside ~40
 * other form fields spanning every product category.
 *
 * `onColorImageUploadError` mirrors hooks/use-product-images.ts: the form has
 * one shared error banner, so a color-image upload failure reports there
 * rather than into a state this hook would own itself.
 */

interface ProductWithVariants {
  colors?: ProductColorInput[] | null
  sizes?: string[] | null
  size_prices?: Record<string, number> | null
}

export function useProductVariants(
  product: ProductWithVariants | null | undefined,
  open: boolean,
  onColorImageUploadError: (message: string | null) => void,
) {
  const [colors, setColors] = useState<ProductColorInput[]>([])
  const [newColorName, setNewColorName] = useState("")
  const [newColorPrice, setNewColorPrice] = useState("")
  const [newColorImage, setNewColorImage] = useState("")
  const [uploadingColorImage, setUploadingColorImage] = useState(false)

  const [sizes, setSizes] = useState<string[]>([])
  const [sizePrices, setSizePrices] = useState<Record<string, number>>({})
  const [newSize, setNewSize] = useState("")
  const [newSizePrice, setNewSizePrice] = useState("")

  useEffect(() => {
    if (product && open) {
      setColors(product.colors || [])
      setSizes(product.sizes || [])
      setSizePrices(product.size_prices || {})
    }
  }, [product, open])

  const handleColorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingColorImage(true)
    onColorImageUploadError(null)

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
      onColorImageUploadError(error instanceof Error ? error.message : "Failed to upload color image")
    } finally {
      setUploadingColorImage(false)
    }
  }

  const handleAddColor = () => {
    if (!newColorName.trim()) return
    const parsedPrice = Number.parseFloat(newColorPrice)
    const colorObj: ProductColorInput = { name: newColorName.trim(), image: newColorImage }
    if (!isNaN(parsedPrice) && parsedPrice > 0) {
      colorObj.price = parsedPrice
    }
    setColors((prev) => [...prev, colorObj])
    setNewColorName("")
    setNewColorImage("")
    setNewColorPrice("")
  }

  const handleRemoveColor = (index: number) => {
    setColors((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddSize = () => {
    if (!newSize.trim()) return
    const sizeFormatted = newSize.trim().toUpperCase()
    setSizes((prev) => {
      if (prev.includes(sizeFormatted)) return prev
      const parsedPrice = Number.parseFloat(newSizePrice)
      if (!isNaN(parsedPrice) && parsedPrice > 0) {
        setSizePrices((prices) => ({ ...prices, [sizeFormatted]: parsedPrice }))
      }
      return [...prev, sizeFormatted]
    })
    setNewSize("")
    setNewSizePrice("")
  }

  const handleRemoveSize = (index: number) => {
    setSizes((prev) => {
      const sizeToRemove = prev[index]
      setSizePrices((prices) => {
        const copy = { ...prices }
        delete copy[sizeToRemove]
        return copy
      })
      return prev.filter((_, i) => i !== index)
    })
  }

  const reset = () => {
    setColors([])
    setSizes([])
    setSizePrices({})
    setNewColorPrice("")
    setNewSizePrice("")
  }

  return {
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
    reset,
  }
}
