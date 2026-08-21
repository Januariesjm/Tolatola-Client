"use client"

/**
 * The admin vendor details dialog.
 *
 * Extracted verbatim from components/admin/vendor-management-tab.tsx, which was
 * 631 lines. Presentational: it renders one vendor and calls back for the three
 * actions it offers, so the mutations stay in hooks/use-admin-vendors.ts.
 */

import { CheckCircle2, Eye, MessageSquare, Trash2, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { vendorTypeLabel, type Vendor } from "@/lib/admin/vendors"

export interface VendorDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Null while no vendor is selected; the dialog renders its shell only. */
  vendor: Vendor | null
  onToggleActive: (vendor: Vendor) => void
  onDelete: (vendorId: string) => void
  onViewDocument: (url: string) => void
  onMessage: (vendor: Vendor) => void
}

export function VendorDetailsDialog({
  open,
  onOpenChange,
  vendor,
  onToggleActive,
  onDelete,
  onViewDocument,
  onMessage,
}: VendorDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vendor Details</DialogTitle>
          <DialogDescription>Complete information for {vendor?.business_name}</DialogDescription>
        </DialogHeader>
        {vendor && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Business Name</Label>
                <p className="font-medium">{vendor.business_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{vendor.users?.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Full Name</Label>
                <p className="font-medium">{vendor.users?.full_name || "N/A"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <p className="font-medium">{vendor.users?.phone || vendor.phone || "N/A"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Vendor Type</Label>
                <p className="font-medium">{vendor.users?.vendor_type ? vendorTypeLabel(vendor.users.vendor_type) : "N/A"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">TIN Number</Label>
                <p className="font-medium">{vendor.tin_number}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">NIDA Number</Label>
                <p className="font-medium">{vendor.nida_number}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">KYC Status</Label>
                <Badge
                  className={
                    vendor.kyc_status === "approved" ? "bg-green-600" : vendor.kyc_status === "pending" ? "bg-yellow-500" : "bg-red-600"
                  }
                >
                  {vendor.kyc_status || "Pending"}
                </Badge>
              </div>
              <div>
                <Label className="text-muted-foreground">Account Status</Label>
                <Badge className={(vendor.is_active ?? true) ? "bg-green-600" : "bg-gray-500"}>
                  {(vendor.is_active ?? true) ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div>
                <Label className="text-muted-foreground">Address</Label>
                <p className="font-medium">{vendor.address || "N/A"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">District</Label>
                <p className="font-medium">{vendor.district || "N/A"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Region</Label>
                <p className="font-medium">{vendor.region || "N/A"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Ward</Label>
                <p className="font-medium">{vendor.ward || "N/A"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Created At</Label>
                <p className="font-medium">{new Date(vendor.created_at).toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Last Updated</Label>
                <p className="font-medium">{new Date(vendor.updated_at).toLocaleString()}</p>
              </div>
              {vendor.shops && vendor.shops.length > 0 && (
                <div className="md:col-span-2">
                  <Label className="text-muted-foreground">Shops</Label>
                  <div className="mt-2 space-y-1">
                    {vendor.shops.map((shop) => (
                      <Badge key={shop.id} variant="outline" className="mr-2">
                        {shop.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {vendor.business_license_url && (
                <div className="md:col-span-2">
                  <Label className="text-muted-foreground">Business License</Label>
                  <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={() => onViewDocument(vendor.business_license_url!)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Document
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <DialogFooter className="flex justify-between items-center w-full">
          <div className="flex gap-2">
            {vendor && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (
                    confirm(
                      `Are you absolutely sure you want to permanently delete "${vendor.business_name}"? This action cannot be undone and will delete all their products, shops, payouts, and user accounts.`,
                    )
                  ) {
                    onDelete(vendor.id)
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Vendor
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {vendor && (
              <Button
                variant="outline"
                onClick={() => {
                  onMessage(vendor)
                  onOpenChange(false)
                }}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {vendor && (
              <Button
                className={(vendor.is_active ?? true) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                onClick={() => {
                  onToggleActive(vendor)
                  onOpenChange(false)
                }}
              >
                {(vendor.is_active ?? true) ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Deactivate Account
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Activate Account
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
