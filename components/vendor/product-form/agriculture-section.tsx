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
 * Weight unit, required for agricultural produce.
 *
 * Sliced verbatim from add-product-dialog.tsx, whose markup was byte-identical
 * to edit-product-dialog.tsx here. Takes the whole form state so the JSX did not
 * need rewriting, and renders its own visibility condition.
 */
export function ProductAgricultureSection({ form }: { form: ProductFormState }) {
  const { isAgriculture, setWeightUnit, weightUnit } = form

  return (
    <>
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
    </>
  )
}
