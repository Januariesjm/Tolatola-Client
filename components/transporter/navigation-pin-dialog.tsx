"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { clientApiPost } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { logger } from "@/lib/logger"

const log = logger.child("transporter.navigation-pin-dialog")

interface NavigationPinDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignmentId: string
  onSuccess: () => void
}

export function NavigationPinDialog({ open, onOpenChange, assignmentId, onSuccess }: NavigationPinDialogProps) {
  const [pin, setPin] = useState("")
  const [verifying, setVerifying] = useState(false)
  const { toast } = useToast()

  const handleVerify = async () => {
    if (!assignmentId || pin.trim().length !== 4) return
    setVerifying(true)
    try {
      await clientApiPost(`assignments/${assignmentId}/verify-pin`, { pin: pin.trim() })
      toast({
        title: "Delivery verified!",
        description: "Your delivery has been completed and your escrow payout released.",
      })
      onOpenChange(false)
      setPin("")
      onSuccess()
    } catch (error: any) {
      log.error("PIN verification error", error)
      toast({
        variant: "destructive",
        title: "PIN verification failed",
        description: error?.message || "Please check the 4-digit PIN with the customer and try again.",
      })
    } finally {
      setVerifying(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
        if (!nextOpen) setPin("")
      }}
    >
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Verify Delivery 📦</DialogTitle>
          <DialogDescription className="text-sm text-stone-500">
            Enter the 4-digit Delivery PIN sent to the customer&apos;s phone to release your payout and complete this trip.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Input
            type="text"
            maxLength={4}
            placeholder="e.g. 1234"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="text-center text-3xl tracking-[0.5em] font-extrabold h-14 rounded-xl"
            autoFocus
          />
          <Button
            onClick={handleVerify}
            disabled={verifying || pin.length !== 4}
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-sm"
          >
            {verifying ? "Verifying..." : "Verify & Complete Delivery"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
