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
 * Service pricing fields, shown instead of stock for service categories.
 *
 * Sliced verbatim from add-product-dialog.tsx, whose markup was byte-identical
 * to edit-product-dialog.tsx here. Takes the whole form state so the JSX did not
 * need rewriting, and renders its own visibility condition.
 */
export function ProductServicesSection({ form }: { form: ProductFormState }) {
  const {
    categories,
    deliveryAvailable,
    isServices,
    name,
    parentCategoryId,
    setCategoryId,
    setDeliveryAvailable,
    setDrinkSection,
    setParentCategoryId,
    setSubCategoryId,
    setVehicleSection,
    subCategoryId,
  } = form

  return (
    <>
      {isServices ? (
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="delivery_available"
              checked={deliveryAvailable}
              onChange={(e) => setDeliveryAvailable(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-primary focus:ring-primary cursor-pointer"
            />
            <Label htmlFor="delivery_available" className="text-sm font-bold text-stone-900 cursor-pointer">
              Offer Home Delivery / On-Site Visit
            </Label>
          </div>
          <p className="text-xs text-muted-foreground ml-6">
            Check this if your service includes home delivery or on-site visits to the customer's location. Uncheck if service is rendered
            at your business premises or remotely.
          </p>
        </div>
      ) : (
        <div className="flex items-center space-x-2 py-2">
          <input
            type="checkbox"
            id="delivery_available"
            checked={deliveryAvailable}
            onChange={(e) => setDeliveryAvailable(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
          />
          <Label htmlFor="delivery_available" className="text-sm font-medium leading-none cursor-pointer">
            Delivery available handled by Tola
          </Label>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select
          value={parentCategoryId}
          onValueChange={(val) => {
            setParentCategoryId(val)
            const subs = categories.filter((c) => c.parent_id === val)
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
            {categories
              .filter((c) => !c.parent_id)
              .map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {categories.filter((c) => c.parent_id === parentCategoryId).length > 0 && (
        <div className="space-y-2 animate-in fade-in duration-300">
          <Label htmlFor="subcategory">Subcategory *</Label>
          <Select
            value={subCategoryId}
            onValueChange={(val) => {
              setSubCategoryId(val)
              setCategoryId(val)
              // Auto-derive vehicle_section from subcategory slug
              const subCat = categories.find((c) => c.id === val)
              if (subCat?.slug === "spare-parts") {
                setVehicleSection("spare_part")
              } else if (subCat?.slug === "vehicles-sub") {
                setVehicleSection("vehicle")
              } else if (subCat?.slug === "non-alcoholic") {
                setDrinkSection("non_alcoholic")
              } else if (subCat?.slug === "alcoholic") {
                setDrinkSection("alcoholic")
              } else {
                // Reset vehicle section for subcategories that don't auto-derive
                setVehicleSection("")
              }
            }}
          >
            <SelectTrigger id="subcategory">
              <SelectValue placeholder="Select a subcategory" />
            </SelectTrigger>
            <SelectContent>
              {categories
                .filter((c) => c.parent_id === parentCategoryId)
                .map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  )
}
