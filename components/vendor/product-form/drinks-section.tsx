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
 * Drink section selector.
 *
 * Sliced verbatim from add-product-dialog.tsx, whose markup was byte-identical
 * to edit-product-dialog.tsx here. Takes the whole form state so the JSX did not
 * need rewriting, and renders its own visibility condition.
 */
export function ProductDrinksSection({ form }: { form: ProductFormState }) {
  const { drinkSection, isDrinks, setDrinkSection } = form

  return (
    <>
      {isDrinks && (
        <div className="border-t pt-4 mt-4 space-y-4 animate-in fade-in duration-300">
          <h4 className="font-bold text-sm text-stone-900">Drinks Details</h4>
          <div className="space-y-2">
            <Label>Section</Label>
            {drinkSection ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-200 rounded-md text-sm text-stone-700">
                <span className="font-medium">{drinkSection === "alcoholic" ? "🍹 Alcoholic" : "🥤 Non-Alcoholic"}</span>
                <span className="text-stone-400 text-xs">(derived from subcategory)</span>
              </div>
            ) : (
              <Select value={drinkSection} onValueChange={setDrinkSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alcoholic">Alcoholic</SelectItem>
                  <SelectItem value="non_alcoholic">Non-Alcoholic</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      )}
    </>
  )
}
