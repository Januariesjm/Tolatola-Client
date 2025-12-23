"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface PayoutApprovalTabProps {
  payouts: any[]
}

export function PayoutApprovalTab({ payouts }: PayoutApprovalTabProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [processing, setProcessing] = useState<string | null>(null)

  const handleApprove = async (payoutId: string) => {
    setProcessing(payoutId)
    try {
      const response = await fetch("/api/admin/payouts/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId }),
      })

      if (response.ok) {
        toast({
          title: "Payout approved",
          description: "The payout has been approved and will be processed",
        })
        router.refresh()
      } else {
        throw new Error("Failed to approve payout")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve payout",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (payoutId: string) => {
    setProcessing(payoutId)
    try {
      const response = await fetch("/api/admin/payouts/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId }),
      })

      if (response.ok) {
        toast({
          title: "Payout rejected",
          description: "The payout request has been rejected",
        })
        router.refresh()
      } else {
        throw new Error("Failed to reject payout")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject payout",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const pendingPayouts = payouts.filter((p) => p.status === "pending")

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payout Requests</CardTitle>
          <CardDescription>Review and approve vendor payout requests</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingPayouts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending payout requests</p>
          ) : (
            <div className="space-y-4">
              {pendingPayouts.map((payout) => (
                <Card key={payout.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <span className="font-semibold">TZS {Number(payout.amount).toLocaleString()}</span>
                          <Badge variant="outline">{payout.status}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Vendor ID: {payout.vendor_id}</p>
                          <p>Payment Method: {payout.payment_method}</p>
                          <p>Details: {payout.payment_details?.details || "N/A"}</p>
                          <p>Requested: {new Date(payout.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(payout.id)}
                          disabled={processing === payout.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(payout.id)}
                          disabled={processing === payout.id}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Payouts History */}
      <Card>
        <CardHeader>
          <CardTitle>All Payouts</CardTitle>
          <CardDescription>Complete payout history</CardDescription>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No payouts yet</p>
          ) : (
            <div className="space-y-2">
              {payouts.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {payout.status === "completed" && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {payout.status === "pending" && <Clock className="h-4 w-4 text-yellow-600" />}
                    {payout.status === "failed" && <XCircle className="h-4 w-4 text-red-600" />}
                    <div>
                      <p className="font-medium">TZS {Number(payout.amount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payout.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      payout.status === "completed"
                        ? "default"
                        : payout.status === "failed"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {payout.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
