"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"

interface RevokeAdminDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  adminName: string
  adminEmail: string
  onConfirm: (reason: string) => void
  isLoading?: boolean
}

export function RevokeAdminDialog({
  open,
  onOpenChange,
  adminName,
  adminEmail,
  onConfirm,
  isLoading = false,
}: RevokeAdminDialogProps) {
  const [reason, setReason] = useState("")

  const handleConfirm = () => {
    if (reason.trim().length < 10) {
      alert("Please provide a detailed reason (at least 10 characters)")
      return
    }
    onConfirm(reason)
    setReason("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Revoke Admin Access
          </DialogTitle>
          <DialogDescription>
            You are about to revoke admin access for <strong>{adminName}</strong> ({adminEmail}). This action will be
            logged and cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Revocation *</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a detailed reason for revoking this admin's access..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">Minimum 10 characters. This will be recorded in the system.</p>
          </div>

          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm">
            <p className="font-semibold text-destructive mb-1">Warning:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>The user will immediately lose all admin privileges</li>
              <li>This action will be permanently logged with your details</li>
              <li>The user will be able to see the revocation reason</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isLoading || reason.trim().length < 10}>
            {isLoading ? "Revoking..." : "Revoke Access"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
