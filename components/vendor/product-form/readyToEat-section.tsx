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
 * Dietary info and prep time for prepared food.
 *
 * Sliced verbatim from add-product-dialog.tsx, whose markup was byte-identical
 * to edit-product-dialog.tsx here. Takes the whole form state so the JSX did not
 * need rewriting, and renders its own visibility condition.
 */
export function ProductReadyToEatSection({ form }: { form: ProductFormState }) {
  const { dietaryInfo, isReadyToEat, prepTime, setDietaryInfo, setPrepTime } = form

  return (
    <>
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
    </>
  )
}
