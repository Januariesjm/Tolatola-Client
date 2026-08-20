"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { clientApiGet } from "@/lib/api-client"
import { createClient } from "@/lib/supabase/client"
import { logger } from "@/lib/logger"
import type { DatePeriod } from "@/components/admin/date-range-filter"

const log = logger.child("vendor.orders")

const TAB_NEW = "new"
const TAB_PREPARING = "preparing"
const TAB_READY = "ready"
const TAB_COMPLETED = "completed"

/**
 * Maps an order status to the tab that should be shown when deep-linking to it.
 * Module scope on purpose: it is static, and it used to be declared *below* the
 * effect that reads it.
 */
export const STATUS_TO_TAB: Record<string, string> = {
  processing: TAB_PREPARING,
  ready_for_pickup: TAB_READY,
  shipped: TAB_COMPLETED,
  delivered: TAB_COMPLETED,
  confirmed: TAB_NEW,
}

/** An order row as this tab renders it. */
export interface VendorOrder {
  id: string
  status: string
  [key: string]: unknown
}

/**
 * Orders data layer for the vendor dashboard: initial load, Supabase realtime
 * subscriptions, a 15s polling fallback, and deep-link expansion.
 *
 * Extracted from components/vendor/vendor-orders-tab.tsx, which was over the
 * 500-line limit and mixed four effects with its markup.
 */
export function useVendorOrders(shopId: string, initialOrderId?: string) {
  const [orders, setOrders] = useState<VendorOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(TAB_NEW)
  const [period, setPeriod] = useState<DatePeriod>("all")
  const { toast } = useToast()

  const prevOrderCountRef = useRef(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchOrders = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true)
      else setIsRefreshing(true)
      try {
        const res = await clientApiGet<{ orders: VendorOrder[] }>(`shops/${shopId}/orders`)
        const newOrders = res.orders || []

        // Show toast if new orders arrived during silent refresh
        if (silent && newOrders.length > prevOrderCountRef.current && prevOrderCountRef.current > 0) {
          const diff = newOrders.length - prevOrderCountRef.current
          toast({
            title: `${diff} New Order${diff > 1 ? "s" : ""} 🔔`,
            description: "You have new orders waiting to be processed.",
          })
        }
        prevOrderCountRef.current = newOrders.length
        setOrders(newOrders)
      } catch (err) {
        log.error("failed to load orders", err, { shopId })
      }
      setIsLoading(false)
      setIsRefreshing(false)
    },
    [shopId, toast],
  )

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Supabase Realtime Subscriptions for immediate updates
  useEffect(() => {
    const supabase = createClient()

    // Subscribe to changes on order_items matching this shop
    const itemsChannel = supabase
      .channel("vendor-order-items")
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items", filter: `shop_id=eq.${shopId}` }, () =>
        fetchOrders(true),
      )
      .subscribe()

    // Subscribe to changes on orders table (since status updates happen there)
    // RLS will restrict what the client receives if properly configured
    const ordersChannel = supabase
      .channel("vendor-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchOrders(true))
      .subscribe()

    return () => {
      supabase.removeChannel(itemsChannel)
      supabase.removeChannel(ordersChannel)
    }
  }, [shopId, fetchOrders])

  // Auto-refresh orders every 15 seconds (fallback)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(true) // silent refresh
    }, 15000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  // Handle initial expansion if orderId is provided
  useEffect(() => {
    if (!isLoading && initialOrderId && orders.length > 0) {
      const order = orders.find((o) => o.id === initialOrderId)
      if (order) {
        setExpandedOrders(new Set([initialOrderId]))
        // Determine correct tab
        const destTab = STATUS_TO_TAB[order.status] || (["pending", "paid", "confirmed"].includes(order.status) ? TAB_NEW : TAB_NEW)
        setActiveTab(destTab)

        // Scroll into view (optional but helpful)
        setTimeout(() => {
          document.getElementById(`order-${initialOrderId}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
        }, 500)
      }
    }
  }, [isLoading, initialOrderId, orders])

  const toggleOrderDetails = (orderId: string) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedOrders(newExpanded)
  }

  return {
    orders,
    isLoading,
    isRefreshing,
    expandedOrders,
    updatingOrderId,
    setUpdatingOrderId,
    activeTab,
    setActiveTab,
    period,
    setPeriod,
    fetchOrders,
    toggleOrderDetails,
  }
}
