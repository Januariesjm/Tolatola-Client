export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: Record<string, any>
    Views: Record<string, any>
    Functions: Record<string, any>
    Enums: Record<string, any>
  }
}

// ——— Marketplace logistics (tolatola.co) ———

export const ORDER_STATUS = [
  "ORDER_RECEIVED",
  "PAYMENT_SECURED",
  "VENDOR_PREPARING",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERED",
] as const
export type OrderStatus = (typeof ORDER_STATUS)[number]

export const ESCROW_STATUS = ["HELD", "FROZEN", "RELEASED", "REFUNDED"] as const
export type EscrowStatus = (typeof ESCROW_STATUS)[number]

export const DISPUTE_STATUS = ["UNDER_REVIEW", "RESOLVED", "REFUNDED"] as const
export type DisputeStatus = (typeof DISPUTE_STATUS)[number]

export const COMPLAINT_REASON = ["Damaged", "Not Delivered", "Wrong Item"] as const
export type ComplaintReason = (typeof COMPLAINT_REASON)[number]

export interface TrackingSession {
  token: string
  orderId: string
  expiresAt?: string
}

export interface OrderTrackingInfo {
  order: {
    id: string
    order_number: string
    tracking_code: string
    status: OrderStatus | string
    payment_status: string
    escrow_status?: EscrowStatus
    estimated_arrival?: string | null
    shipping_address?: Record<string, unknown>
    delivery_confirmation_requested?: boolean
  }
  transporter?: {
    id?: string
    name: string
    phone_masked: string
    phone?: string
    driver_location?: { lat: number; lng: number; bearing?: number | null; speed?: number | null } | null
  }
  shop_location?: { lat: number; lng: number } | null
  timeline: Array<{ status: OrderStatus | string; label: string; completed_at?: string }>
  fund_status?: {
    status: string
    timeline: Array<{
      key: string
      label: string
      status: "completed" | "pending"
      description: string
    }>
  }
}

export interface DisputeInfo {
  id: string
  dispute_id: string
  order_id: string
  reason: string
  status: DisputeStatus
  description?: string
  created_at: string
  updated_at: string
  timeline?: Array<{ action: string; at: string }>
}
