"use client"

/**
 * The admin transporter details dialog.
 *
 * Extracted verbatim from components/admin/transporter-management-tab.tsx.
 * Presentational: it renders one transporter and calls back for the three
 * actions it offers, so the mutations stay in hooks/use-admin-transporters.ts.
 */

import { MessageSquare, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import type { Transporter } from "@/lib/admin/transporters"

export interface TransporterDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Null while no transporter is selected; the dialog renders its shell only. */
  transporter: Transporter | null
  onDelete: (transporterId: string) => void
  onMessage: (transporter: Transporter) => void
}

export function TransporterDetailsDialog({
  open,
  onOpenChange,
  transporter: selectedTransporter,
  onDelete,
  onMessage,
}: TransporterDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transporter Details</DialogTitle>
          <DialogDescription>Full information for {selectedTransporter?.users?.full_name}</DialogDescription>
        </DialogHeader>
        {selectedTransporter && (
          <div className="grid md:grid-cols-2 gap-4 py-4">
            <div>
              <Label className="text-muted-foreground">Full Name</Label>
              <p className="font-medium">{selectedTransporter.users?.full_name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium">{selectedTransporter.users?.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Phone</Label>
              <p className="font-medium">{selectedTransporter.phone || selectedTransporter.users?.phone || "N/A"}</p>
            </div>
            {selectedTransporter.business_name && (
              <div>
                <Label className="text-muted-foreground">Business Name</Label>
                <p className="font-medium">{selectedTransporter.business_name}</p>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">Location</Label>
              <p className="font-medium">
                {selectedTransporter.region || selectedTransporter.district
                  ? `${selectedTransporter.region || ""}${selectedTransporter.region && selectedTransporter.district ? ", " : ""}${selectedTransporter.district || ""}`
                  : "N/A"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Vehicle Type</Label>
              <p className="font-medium">{selectedTransporter.vehicle_type}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Vehicle Registration</Label>
              <p className="font-medium">{selectedTransporter.vehicle_registration}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">License Number</Label>
              <p className="font-medium">{selectedTransporter.license_number}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">KYC Status</Label>
              <Badge variant="outline">{selectedTransporter.kyc_status}</Badge>
            </div>
            <div>
              <Label className="text-muted-foreground">Availability</Label>
              <Badge variant="outline">{selectedTransporter.availability_status}</Badge>
            </div>
            <div>
              <Label className="text-muted-foreground">Total Deliveries</Label>
              <p className="font-medium">{selectedTransporter.total_deliveries || 0}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Member Since</Label>
              <p className="font-medium">{new Date(selectedTransporter.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        )}
        <DialogFooter className="flex justify-between items-center w-full">
          <div className="flex gap-2">
            {selectedTransporter && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (
                    confirm(
                      `Are you absolutely sure you want to permanently delete this transporter? This action cannot be undone and will delete all their assignments, withdrawals, and user accounts.`,
                    )
                  ) {
                    onDelete(selectedTransporter.id)
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Transporter
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {selectedTransporter && (
              <Button
                variant="outline"
                onClick={() => {
                  onMessage(selectedTransporter)
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
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
