"use client"

import Image from "next/image"
import { ImageIcon, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { ProductFormState } from "@/hooks/use-product-form"

/**
 * Name, description, price, stock, category pickers and images.
 *
 * Sliced verbatim from add-product-dialog.tsx, whose markup was byte-identical
 * to edit-product-dialog.tsx here. Takes the whole form state so the JSX did not
 * need rewriting, and renders its own visibility condition.
 */
export function ProductBasicsSection({ form }: { form: ProductFormState }) {
  const {
    description,
    handleImageUpload,
    handleRemoveImage,
    images,
    moq,
    name,
    price,
    qualityGrade,
    setDescription,
    setMoq,
    setName,
    setPrice,
    setQualityGrade,
    setStockQuantity,
    stockQuantity,
    uploadingImage,
  } = form

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Product Name *</Label>
        <Input id="name" placeholder="Product name" value={name} onChange={(e) => setName(e.target.value)} required />
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
                  <Image src={url || "/placeholder.svg"} alt={`Product ${index + 1}`} fill className="object-cover" />
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
            <Label htmlFor="images" className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-accent">
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
          <Input id="moq" type="number" placeholder="1" value={moq} onChange={(e) => setMoq(e.target.value)} required />
        </div>
      </div>
    </>
  )
}
