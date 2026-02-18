"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import { AlertTriangle, Upload, Loader2, AlertCircle } from "lucide-react"
import { clientApiPostPublic } from "../../../lib/api-client"
import { useToast } from "../../../hooks/use-toast"
import SiteHeader from "../../../components/layout/site-header"
import { COMPLAINT_REASON } from "../../../lib/types"

function RaiseComplaintInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const orderId = searchParams.get("orderId")
  const { toast } = useToast()
  const [reason, setReason] = useState<string>("")
  const [description, setDescription] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !orderId) {
      setError("Missing order context. Please open this page from the order status dashboard.")
    }
  }, [token, orderId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !orderId) return
    if (!reason.trim()) {
      setError("Please select a reason.")
      return
    }
    setError(null)
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("token", token)
      formData.append("order_id", orderId)
      formData.append("reason", reason)
      formData.append("description", description)
      if (photo) formData.append("photo", photo)

      const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"
      const res = await fetch(`${base.replace(/\/$/, "")}/tracking/complaint`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || data?.message || "Failed to submit complaint")

      const disputeId = data.dispute_id || data.data?.dispute_id
      toast({
        title: "Complaint submitted",
        description: "Escrow has been frozen. We'll review and get back to you.",
      })
      router.replace(disputeId ? `/disputes/${disputeId}` : "/track/status?token=" + encodeURIComponent(token))
    } catch (err: any) {
      const msg = err?.message || "Failed to submit complaint."
      setError(msg)
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (!token || !orderId) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader user={null} profile={null} kycStatus={null} />
        <main className="container max-w-lg mx-auto px-4 py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "Invalid link."}</AlertDescription>
          </Alert>
          <Button asChild className="mt-4">
            <Link href="/track">Track order</Link>
          </Button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={null} profile={null} kycStatus={null} />
      <main className="container max-w-lg mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href={`/track/status?token=${encodeURIComponent(token)}`}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← Back to order status
          </Link>
        </div>
        <Card className="border-2 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-xl font-black">Raise a complaint</CardTitle>
                <CardDescription>
                  Your payment will be frozen until the dispute is resolved. Our team will review and contact you.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger id="reason" className="rounded-xl h-12">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPLAINT_REASON.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what went wrong..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="rounded-xl resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Photo (optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    className="rounded-xl"
                    onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                  />
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit complaint"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function RaiseComplaintPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <RaiseComplaintInner />
    </Suspense>
  )
}
