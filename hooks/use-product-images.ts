"use client"

import { useEffect, useState } from "react"

/**
 * Product image upload/removal, and seeding from an existing product when
 * editing.
 *
 * Extracted from hooks/use-product-form.ts, which held this alongside ~40
 * other form fields spanning every product category (fashion, vehicles,
 * food/drink). Pulling image handling out on its own keeps it independently
 * testable and readable.
 *
 * `onError` reports an upload failure (or clears a previous one, on `null`)
 * to the caller rather than owning its own error state, since the form
 * shows one shared error banner for validation, image uploads and the
 * submit request alike.
 */

export function useProductImages(
  product: { images?: string[] | null } | null | undefined,
  open: boolean,
  onError: (message: string | null) => void,
) {
  const [images, setImages] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (product && open) {
      setImages(product.images || [])
    }
  }, [product, open])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImage(true)
    onError(null)

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

      setImages((prev) => [...prev, ...uploadedUrls])
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to upload images")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const reset = () => setImages([])

  return { images, setImages, uploadingImage, handleImageUpload, handleRemoveImage, reset }
}
