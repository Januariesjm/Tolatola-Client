\"use client\"

import { useState, useEffect } from \"react\"
import { useParams } from \"next/navigation\"
import Link from \"next/link\"
import { Card, CardContent, CardHeader, CardTitle } from \"../../../components/ui/card\"
import { Button } from \"../../../components/ui/button\"
import { Badge } from \"../../../components/ui/badge\"
import { MessageSquare, Loader2, AlertCircle } from \"lucide-react\"
import type { DisputeStatus } from \"../../../lib/types\"
import SiteHeader from \"../../../components/layout/site-header\"

const STATUS_LABELS: Record<string, string> = {
  UNDER_REVIEW: "Under Review",
  RESOLVED: "Resolved",
  REFUNDED: "Refunded",
}

export default function DisputeStatusPage() {
  const params = useParams()
  const id = params.id as string
  const [data, setData] = useState<{
    dispute_id: string
    order_id: string
    reason: string
    status: DisputeStatus
    description?: string
    created_at: string
    updated_at: string
    timeline?: Array<{ action: string; at: string }>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError("Invalid dispute.")
      return
    }
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"
    fetch(`${base.replace(/\/$/, "")}/disputes/${id}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load dispute.")
        return r.json()
      })
      .then((d) => setData(d.data || d))
      .catch((e) => setError(e?.message || "Failed to load dispute."))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading dispute…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader user={null} profile={null} kycStatus={null} />
        <main className="container max-w-lg mx-auto px-4 py-12">
          <Card className="border-2 border-destructive/20">
            <CardContent className="pt-6">
              <p className="text-destructive font-medium">{error || "Dispute not found."}</p>
              <Button asChild className="mt-4" variant="outline">
                <Link href="/track">Track order</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <SiteHeader user={null} profile={null} kycStatus={null} />
      <main className="container max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/track" className="text-sm text-muted-foreground hover:text-primary">
            ← Track order
          </Link>
        </div>
        <Card className="border-2 shadow-xl rounded-2xl overflow-hidden mb-6">
          <CardHeader className="bg-muted/30">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-xl font-mono">{data.dispute_id}</CardTitle>
              <Badge variant="secondary" className="capitalize">
                {STATUS_LABELS[data.status] || data.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Order: {data.order_id} • Reason: {data.reason}
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {data.description && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Description
                </h3>
                <p className="text-sm">{data.description}</p>
              </div>
            )}
            {data.timeline && data.timeline.length > 0 && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Timeline
                </h3>
                <ul className="space-y-2">
                  {data.timeline.map((item, i) => (
                    <li key={i} className="flex justify-between items-start gap-4 text-sm">
                      <span>{item.action}</span>
                      <span className="text-muted-foreground whitespace-nowrap">
                        {new Date(item.at).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="pt-4 border-t">
              <Button asChild variant="outline" className="rounded-xl w-full sm:w-auto">
                <Link href="/contact" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Support chat
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
