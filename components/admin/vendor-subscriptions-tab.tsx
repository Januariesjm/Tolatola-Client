"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Crown, Eye, Sparkles, Star, Zap } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface VendorSubscriptionsTabProps {
  subscriptions: any[]
}

export function VendorSubscriptionsTab({ subscriptions: initialSubscriptions }: VendorSubscriptionsTabProps) {
  const [subscriptions, setSubscriptions] = useState<any[]>(initialSubscriptions || [])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  useEffect(() => {
    if (!initialSubscriptions || initialSubscriptions.length === 0) {
      loadSubscriptions()
    } else {
      calculateStats(initialSubscriptions)
    }
  }, [initialSubscriptions])

  const calculateStats = (data: any[]) => {
    const planCounts = data.reduce((acc: any, sub: any) => {
      const planName = sub.plan?.name || "Unknown"
      acc[planName] = (acc[planName] || 0) + 1
      return acc
    }, {})
    setStats(planCounts)
  }

  const loadSubscriptions = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      // Load active subscriptions with vendor and plan details
      const { data: subsData } = await supabase
        .from("vendor_subscriptions")
        .select(
          `
          *,
          vendor:vendors(
            business_name,
            user:users(full_name, email)
          ),
          plan:subscription_plans(*)
        `,
        )
        .eq("status", "active")
        .order("created_at", { ascending: false })

      if (subsData) {
        setSubscriptions(subsData)
      }

      // Calculate stats
      const { data: statsData } = await supabase
        .from("vendor_subscriptions")
        .select("plan_id, subscription_plans(name)")

      if (statsData) {
        const planCounts = statsData.reduce((acc: any, sub: any) => {
          const planName = sub.subscription_plans?.name || "Unknown"
          acc[planName] = (acc[planName] || 0) + 1
          return acc
        }, {})

        setStats(planCounts)
      }
    } catch (error) {
      console.error("Error loading subscriptions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (subscription: any) => {
    setSelectedSubscription(subscription)
    setShowDetailsDialog(true)
  }

  const getPlanIcon = (planName: string) => {
    switch (planName?.toLowerCase()) {
      case "free":
        return <Zap className="h-4 w-4" />
      case "basic":
        return <Star className="h-4 w-4" />
      case "premium":
        return <Sparkles className="h-4 w-4" />
      case "pro":
        return <Crown className="h-4 w-4" />
      default:
        return null
    }
  }

  const getPlanBadgeColor = (planName: string) => {
    switch (planName?.toLowerCase()) {
      case "free":
        return "bg-gray-100 text-gray-900"
      case "basic":
        return "bg-blue-100 text-blue-900"
      case "premium":
        return "bg-purple-100 text-purple-900"
      case "pro":
        return "bg-amber-100 text-amber-900"
      default:
        return "bg-muted"
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading subscriptions...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats).map(([planName, count]) => (
            <Card key={planName}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {getPlanIcon(planName)}
                  {planName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count as number}</div>
                <p className="text-xs text-muted-foreground">active vendors</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Subscriptions</CardTitle>
          <CardDescription>Manage vendor subscription plans</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{subscription.vendor?.business_name}</p>
                      <p className="text-sm text-muted-foreground">{subscription.vendor?.user?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPlanBadgeColor(subscription.plan?.name)}>
                      {getPlanIcon(subscription.plan?.name)}
                      <span className="ml-1">{subscription.plan?.name}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                      {subscription.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(subscription.started_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {subscription.expires_at ? new Date(subscription.expires_at).toLocaleDateString() : "Never"}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{subscription.plan?.price?.toLocaleString()} TZS</span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(subscription)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
            <DialogDescription>
              {selectedSubscription?.vendor?.business_name} - {selectedSubscription?.plan?.name} Plan
            </DialogDescription>
          </DialogHeader>

          {selectedSubscription && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Vendor</p>
                  <p className="text-sm">{selectedSubscription.vendor?.business_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{selectedSubscription.vendor?.user?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Plan</p>
                  <Badge className={getPlanBadgeColor(selectedSubscription.plan?.name)}>
                    {selectedSubscription.plan?.name}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Cost</p>
                  <p className="text-sm font-semibold">{selectedSubscription.plan?.price?.toLocaleString()} TZS</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={selectedSubscription.status === "active" ? "default" : "secondary"}>
                    {selectedSubscription.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Auto Renew</p>
                  <p className="text-sm">{selectedSubscription.auto_renew ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Started</p>
                  <p className="text-sm">{new Date(selectedSubscription.started_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Expires</p>
                  <p className="text-sm">
                    {selectedSubscription.expires_at
                      ? new Date(selectedSubscription.expires_at).toLocaleDateString()
                      : "Never"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Plan Features</p>
                <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
                  {selectedSubscription.plan?.product_limit ? (
                    <p>• Up to {selectedSubscription.plan.product_limit} products</p>
                  ) : (
                    <p>• Unlimited products</p>
                  )}
                  {selectedSubscription.plan?.has_verification_badge && <p>• Verification badge</p>}
                  {selectedSubscription.plan?.has_analytics && (
                    <p>• {selectedSubscription.plan.analytics_level} analytics</p>
                  )}
                  {selectedSubscription.plan?.has_promotions && <p>• Promotions & discounts</p>}
                  {selectedSubscription.plan?.has_consultation && <p>• Business consultation</p>}
                  <p>• {selectedSubscription.plan?.support_level} support</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
