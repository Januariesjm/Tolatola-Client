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
 * Colourways and sizes, with optional per-variant pricing.
 *
 * Sliced verbatim from add-product-dialog.tsx, whose markup was byte-identical
 * to edit-product-dialog.tsx here. Takes the whole form state so the JSX did not
 * need rewriting, and renders its own visibility condition.
 */
export function ProductFashionSection({ form }: { form: ProductFormState }) {
  const {
    colors,
    handleAddColor,
    handleAddSize,
    handleColorImageUpload,
    handleRemoveColor,
    handleRemoveSize,
    isFashion,
    name,
    newColorImage,
    newColorName,
    newColorPrice,
    newSize,
    newSizePrice,
    price,
    setNewColorName,
    setNewColorPrice,
    setNewSize,
    setNewSizePrice,
    sizePrices,
    sizes,
    uploadingColorImage,
  } = form

  return (
    <>
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
                      <span className="text-[10px] text-stone-500 font-normal ml-1">(TZS {sizePrices[size].toLocaleString()})</span>
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
                  <Label htmlFor="color-name" className="text-xs text-stone-500">
                    Color Name
                  </Label>
                  <Input
                    id="color-name"
                    placeholder="e.g. Cherry Red"
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="color-price" className="text-xs text-stone-500">
                    Price (Optional)
                  </Label>
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
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl border bg-white shadow-sm">
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
                          <span className="text-[10px] text-stone-500 font-normal block">TZS {color.price.toLocaleString()}</span>
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
    </>
  )
}
