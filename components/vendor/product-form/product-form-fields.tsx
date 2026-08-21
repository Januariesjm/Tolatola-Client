"use client"

import { DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { ProductFormState } from "@/hooks/use-product-form"
import { ProductBasicsSection } from "./basics-section"
import { ProductServicesSection } from "./services-section"
import { ProductAgricultureSection } from "./agriculture-section"
import { ProductVehicleSection } from "./vehicle-section"
import { ProductReadyToEatSection } from "./readyToEat-section"
import { ProductDrinksSection } from "./drinks-section"
import { ProductFashionSection } from "./fashion-section"

interface ProductFormFieldsProps {
  form: ProductFormState
  onCancel: () => void
  /** Submit button label at rest, e.g. "Add Product". */
  submitLabel: string
  /** Submit button label while saving, e.g. "Adding...". */
  pendingLabel: string
}

/**
 * The vendor product form, shared by the add and edit dialogs.
 *
 * The two dialogs' markup was byte-identical apart from their titles and this
 * button's label, so it lives here once. Each section renders its own
 * category visibility condition.
 */
export function ProductFormFields({ form, onCancel, submitLabel, pendingLabel }: ProductFormFieldsProps) {
  return (
    <form onSubmit={form.handleSubmit}>
      <div className="space-y-4 py-4">
        <ProductBasicsSection form={form} />
        <ProductServicesSection form={form} />
        <ProductAgricultureSection form={form} />
        <ProductVehicleSection form={form} />
        <ProductReadyToEatSection form={form} />
        <ProductDrinksSection form={form} />
        <ProductFashionSection form={form} />
      </div>
      {form.error && <p className="text-sm text-destructive">{form.error}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onCancel()}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.isLoading || form.uploadingImage}>
          {form.isLoading ? pendingLabel : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )
}
