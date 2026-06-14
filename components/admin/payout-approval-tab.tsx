import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, Loader2, RefreshCcw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { DateRangeFilter, filterByDateRange, type DatePeriod } from "./date-range-filter"

interface PayoutApprovalTabProps {
  payouts: any[]
}

export function PayoutApprovalTab({ payouts }: PayoutApprovalTabProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [processing, setProcessing] = useState<string | null>(null)
  const [localPayouts, setLocalPayouts] = useState<any[]>(payouts)
  const [period, setPeriod] = useState<DatePeriod>("all")

  // Sync props to state if they change externally
  useEffect(() => {
    setLocalPayouts(payouts)
  }, [payouts])

  // Poll for processing payouts
  useEffect(() => {
    const processingPayouts = localPayouts.filter(p => p.status === "processing")
    
    if (processingPayouts.length === 0) return;

    let mounted = true;
    const pollStatuses = async () => {
      for (const p of processingPayouts) {
        try {
          const userType = p.user_type || "vendor"
          const res = await fetch(`/api/admin/payouts/${p.id}/status?userType=${userType}`)
          if (res.ok) {
            const data = await res.json()
            if (data.payout && data.payout.status !== "processing" && mounted) {
              // Update local state
              setLocalPayouts(prev => prev.map(item => item.id === p.id ? data.payout : item))
              
              toast({
                title: "Payout Status Updated",
                description: `Payout to ${p.user_id || p.vendor_id} is now ${data.payout.status}`,
              })
              router.refresh()
            }
          }
        } catch (e) {
          console.error("Failed to poll payout status", e)
        }
      }
    }

    const interval = setInterval(pollStatuses, 5000) // Poll every 5s
    
    return () => {
      mounted = false;
      clearInterval(interval)
    }
  }, [localPayouts, router, toast])

  const handleApprove = async (payoutId: string, userType: string) => {
    setProcessing(payoutId)
    try {
      const response = await fetch("/api/admin/payouts/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, userType }),
      })

      if (response.ok) {
        toast({
          title: "Payout approved",
          description: "The payout has been initiated and is now processing",
        })
        
        // Optimistically update to processing
        setLocalPayouts(prev => prev.map(p => p.id === payoutId ? { ...p, status: "processing" } : p))
        router.refresh()
      } else {
        let errMsg = "Failed to approve payout"
        try {
          const data = await response.json()
          if (data && data.error) {
            errMsg = data.error
          }
        } catch (e) {}
        throw new Error(errMsg)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve payout",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (payoutId: string, userType: string) => {
    setProcessing(payoutId)
    try {
      const response = await fetch("/api/admin/payouts/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, userType }),
      })

      if (response.ok) {
        toast({
          title: "Payout rejected",
          description: "The payout request has been rejected",
        })
        
        setLocalPayouts(prev => prev.map(p => p.id === payoutId ? { ...p, status: "failed" } : p))
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

  const manualRefresh = () => {
    router.refresh()
  }

  const dateFilteredPayouts = useMemo(() => filterByDateRange(localPayouts, period), [localPayouts, period])
  const pendingPayouts = dateFilteredPayouts.filter((p) => p.status === "pending")

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>Payout Requests</CardTitle>
              <CardDescription>Review and approve vendor payout requests</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <DateRangeFilter value={period} onChange={setPeriod} />
              <Button variant="outline" size="icon" onClick={manualRefresh}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {pendingPayouts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending payout requests</p>
          ) : (
            <div className="space-y-4">
              {pendingPayouts.map((payout, index) => (
                <Card key={payout.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-400 w-6 text-center">#{index + 1}</span>
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <span className="font-semibold">TZS {Number(payout.amount).toLocaleString()}</span>
                          <Badge variant="outline">{payout.status}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p className="capitalize">Type: {payout.user_type || "Vendor"}</p>
                          <p>User ID: {payout.user_id || payout.vendor_id}</p>
                          <p>Payment Method: {payout.payment_method}</p>
                          <p>Details: {payout.payment_details?.details || "N/A"}</p>
                          <p>Requested: {new Date(payout.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(payout.id, payout.user_type || "vendor")}
                          disabled={processing === payout.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(payout.id, payout.user_type || "vendor")}
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
          {dateFilteredPayouts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No payouts yet</p>
          ) : (
            <div className="space-y-2">
              {dateFilteredPayouts.map((payout, index) => (
                <div key={payout.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-400 w-6 text-center">#{index + 1}</span>
                    {payout.status === "completed" && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {payout.status === "pending" && <Clock className="h-4 w-4 text-yellow-600" />}
                    {payout.status === "processing" && <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />}
                    {payout.status === "failed" && <XCircle className="h-4 w-4 text-red-600" />}
                    <div>
                      <p className="font-medium">TZS {Number(payout.amount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground flex flex-col gap-0.5">
                        <span>{new Date(payout.created_at).toLocaleDateString()}</span>
                        {payout.approved_by_name && (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-500">
                            {payout.status === "failed" ? "Rejected by" : "Approved by"}: {payout.approved_by_name}
                          </span>
                        )}
                        {payout.status === "failed" && payout.failure_reason && (
                          <span className="text-red-500 font-medium dark:text-red-400">
                            Reason: {payout.failure_reason}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      payout.status === "completed"
                        ? "default"
                        : payout.status === "failed"
                          ? "destructive"
                          : payout.status === "processing"
                            ? "outline"
                            : "secondary"
                    }
                    className={payout.status === "processing" ? "border-orange-500 text-orange-600" : ""}
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
