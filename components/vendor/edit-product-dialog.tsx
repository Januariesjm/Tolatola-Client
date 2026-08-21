"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useProductForm, type EditableProduct } from "@/hooks/use-product-form"
import { ProductFormFields } from "./product-form/product-form-fields"

interface EditProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: EditableProduct
  onSuccess: () => void
}

/**
 * Update an existing product.
 *
 * Shares useProductForm and ProductFormFields with AddProductDialog; the only
 * differences are the labels and the hook's "edit" mode, which hydrates the
 * fields from `product` and PUTs instead of POSTing.
 */
export function EditProductDialog({ open, onOpenChange, product, onSuccess }: EditProductDialogProps) {
  const form = useProductForm({ open, onOpenChange, onSuccess, mode: "edit", product })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>Update your product information</DialogDescription>
        </DialogHeader>
        <ProductFormFields form={form} onCancel={() => onOpenChange(false)} submitLabel="Update Product" pendingLabel="Updating..." />
      </DialogContent>
    </Dialog>
  )
}
