"use client"

/**
 * The permanent-delete confirmation dialog for the admin product list.
 *
 * Extracted verbatim from components/admin/product-management-tab.tsx.
 * Presentational -- the delete request itself lives in the parent.
 */

import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { AdminProduct } from "@/lib/types/admin"

export interface DeleteProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: AdminProduct | null
  isDeleting: boolean
  error: string | null
  onConfirm: () => void
}

export function DeleteProductDialog({
  open,
  onOpenChange,
  product: productToDelete,
  isDeleting,
  error: deleteError,
  onConfirm,
}: DeleteProductDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600 font-bold text-xl">
            <AlertTriangle className="h-5 w-5" />
            Delete Product Permanently?
          </DialogTitle>
          <DialogDescription className="text-slate-600 pt-1 text-sm">
            This action cannot be undone. The product and all related marketplace data will be permanently purged from the system database.
          </DialogDescription>
        </DialogHeader>

        {productToDelete && (
          <div className="space-y-4 py-3">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="h-14 w-14 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0">
                <img
                  src={productToDelete.image_url || "/placeholder.svg"}
                  alt={productToDelete.name || ""}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-sm truncate">{productToDelete.name}</p>
                <p className="text-xs text-slate-500 truncate">
                  Shop: {productToDelete.shops?.name || "No Shop"} ({productToDelete.shops?.vendors?.business_name || "Vendor"})
                </p>
                <p className="text-xs font-semibold text-slate-700">
                  TZS {Number(productToDelete.price || 0).toLocaleString()} • ID: {productToDelete.id}
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
              <p className="font-semibold">Items that will be deleted:</p>
              <ul className="list-disc list-inside space-y-0.5 text-rose-700">
                <li>Product images & media files</li>
                <li>Customer shopping cart entries containing this item</li>
                <li>User wishlist & product likes</li>
                <li>Customer product reviews and ratings</li>
              </ul>
            </div>

            {deleteError && <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-xl text-xs">{deleteError}</div>}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting} className="rounded-xl border-slate-200">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 gap-2 font-medium"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Yes, Delete Permanently
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
