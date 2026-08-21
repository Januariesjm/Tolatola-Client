"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useProductForm } from "@/hooks/use-product-form"
import { ProductFormFields } from "./product-form/product-form-fields"

interface AddProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shopId: string
  onSuccess: () => void
}

/**
 * Create a product under a shop.
 *
 * All state, validation and submission live in useProductForm; the fields live
 * in ProductFormFields, shared with EditProductDialog.
 */
export function AddProductDialog({ open, onOpenChange, shopId, onSuccess }: AddProductDialogProps) {
  const form = useProductForm({ open, onOpenChange, onSuccess, mode: "create", shopId })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>Add a new product to your shop</DialogDescription>
        </DialogHeader>
        <ProductFormFields form={form} onCancel={() => onOpenChange(false)} submitLabel="Add Product" pendingLabel="Adding..." />
      </DialogContent>
    </Dialog>
  )
}
