/**
 * A catalogue row as the admin product table receives it from
 * `GET admin/products`.
 *
 * Only the fields the table reads. Everything past `id` is optional because the
 * list endpoint spans every category and includes the `shops`/`categories`
 * joins only when the query selects them -- the UI already falls back for each.
 */
export interface AdminProduct {
  id: string
  name?: string | null
  price?: number | null
  description?: string | null
  image_url?: string | null
  stock_quantity?: number | null
  /** "approved" | "pending" | "rejected" in practice, compared case-insensitively. */
  status?: string | null
  /** Drives the newest/oldest sort; missing rows sort as the epoch. */
  created_at?: string | null
  categories?: { name?: string | null } | null
  /** Joined shop, itself carrying the joined vendor that owns it. */
  shops?: {
    name?: string | null
    vendors?: { business_name?: string | null } | null
  } | null
}

export interface AdminRolePermission {
  id: string
  role_name: string
  access_level: number
  description?: string
  permissions: string[]
}

export interface AdminRoleUser {
  id: string
  email?: string
  full_name?: string
  department?: string
  role?: AdminRolePermission
  permissions: string[]
}

export interface AdminDashboardStats {
  totalUsers?: number
  totalVendors?: number
  totalTransporters?: number
  totalOrders?: number
  totalRevenue?: number
  pendingKyc?: number
  activeSubscriptions?: number
  [key: string]: unknown
}

export interface AdminOrder {
  id: string
  order_number?: string
  customer_id?: string
  vendor_id?: string
  total_amount: number
  status: string
  created_at: string
  items?: unknown[]
  customer?: {
    full_name?: string
    email?: string
    phone?: string
  }
  [key: string]: unknown
}

export interface AdminPayout {
  id: string
  vendor_id?: string
  amount: number
  status: "pending" | "approved" | "rejected" | "paid" | string
  created_at: string
  vendor?: {
    store_name?: string
    email?: string
  }
  [key: string]: unknown
}

export interface AdminTicket {
  id: string
  ticket_number?: string
  subject: string
  department?: string
  status: string
  priority?: string
  created_at: string
  user_id?: string
  [key: string]: unknown
}

export interface AdminPromotion {
  id: string
  title: string
  code?: string
  discount_percentage?: number
  discount_amount?: number
  is_active: boolean
  start_date?: string
  end_date?: string
  [key: string]: unknown
}

export interface IncompleteRegistration {
  id: string
  email?: string
  full_name?: string
  phone?: string
  role?: string
  recovery_status: "pending" | "contacted" | "recovered" | "abandoned" | string
  created_at: string
  [key: string]: unknown
}

export interface AdminDashboardContentProps {
  stats: any
  pendingVendors: any[]
  pendingTransporters: any[]
  pendingCustomerKyc: any[]
  pendingProducts: any[]
  allProducts: any[]
  orders: AdminOrder[]
  transactions: any[]
  payouts: AdminPayout[]
  tickets: AdminTicket[]
  promotions: any[]
  subscriptions: any[]
  adminRole: AdminRoleUser | null
  initialAgents?: any[]
  vendorTypesAnalytics?: any
  careerApplications?: any[]
  hrInterviews?: any[]
  hrStaffRecords?: any[]
  hrContracts?: any[]
  hrAttendance?: any[]
  incompleteRegistrations?: any[]
}
