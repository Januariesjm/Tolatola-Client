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
