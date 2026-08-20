import {
  Activity,
  BarChart3,
  Briefcase,
  ClipboardList,
  CreditCard,
  Landmark,
  LifeBuoy,
  Mail,
  Network,
  Package,
  PackageSearch,
  Percent,
  Server,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  UserCircle2,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react"

/**
 * Single source of truth for the admin dashboard's navigation.
 *
 * The desktop sidebar and the mobile tab strip used to be two hand-maintained
 * lists of the same ~26 entries, each repeating its own permission check. They
 * had already drifted (the mobile strip is missing "Activity Logs"), and any new
 * tab had to be added in three places. Both now render from this array.
 *
 * Ordering here is the render order in both lists.
 */

/** Everything a nav item needs to decide visibility and badge counts. */
export interface AdminNavContext {
  permissions: string[]
  isSuperAdmin: boolean
  /** True when the admin has any role record at all. */
  hasAnyRole: boolean
  showAdminManagement: boolean
  canManageAgents: boolean
  counts: {
    pendingVendors: number
    pendingTransporters: number
    pendingCustomerKyc: number
    pendingProducts: number
    pendingPayouts: number
    pendingTickets: number
    pendingRecovery: number
    pendingHr: number
  }
}

export interface AdminNavItem {
  /** Tab value; must match the corresponding TabsContent. */
  key: string
  /** Sidebar label. */
  label: string
  /** Mobile tab label, which is often shorter than the sidebar's. */
  mobileLabel: string
  icon: LucideIcon
  /**
   * Pending count for this section. When present, the sidebar renders a badge
   * if the count is above zero, and the mobile label always appends "(n)".
   */
  count?: (ctx: AdminNavContext) => number
  /** False for items the mobile tab strip deliberately omits. */
  showInMobile?: boolean
  isVisible: (ctx: AdminNavContext) => boolean
}

const can = (permission: string) => (ctx: AdminNavContext) => ctx.permissions.includes(permission)

const canAny =
  (...permissions: string[]) =>
  (ctx: AdminNavContext) =>
    permissions.some((permission) => ctx.permissions.includes(permission))

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    key: "analytics",
    label: "Analytics",
    mobileLabel: "Analytics",
    icon: BarChart3,
    isVisible: can("view_analytics"),
  },
  {
    key: "kyc",
    label: "Vendor KYC",
    mobileLabel: "Vendor KYC",
    icon: ShieldCheck,
    count: (ctx) => ctx.counts.pendingVendors,
    isVisible: can("manage_kyc"),
  },
  {
    key: "transporter-kyc",
    label: "Transporter KYC",
    mobileLabel: "Transporter KYC",
    icon: Truck,
    count: (ctx) => ctx.counts.pendingTransporters,
    isVisible: can("manage_transporters"),
  },
  {
    key: "customer-kyc",
    label: "User KYC",
    mobileLabel: "User KYC",
    icon: UserCircle2,
    count: (ctx) => ctx.counts.pendingCustomerKyc,
    isVisible: can("manage_customers"),
  },
  {
    key: "products",
    label: "Product Approvals",
    mobileLabel: "Approvals",
    icon: Package,
    count: (ctx) => ctx.counts.pendingProducts,
    isVisible: can("manage_products"),
  },
  {
    key: "all-products",
    label: "Search & Delete Products",
    mobileLabel: "Search & Delete Products",
    icon: PackageSearch,
    isVisible: can("manage_products"),
  },
  {
    key: "orders",
    label: "Orders",
    mobileLabel: "Orders",
    icon: ShoppingCart,
    isVisible: can("manage_orders"),
  },
  {
    key: "finance",
    label: "Finance Hub",
    mobileLabel: "Finance Hub",
    icon: Landmark,
    isVisible: canAny("manage_transactions", "manage_payouts"),
  },
  {
    key: "payouts",
    label: "Payout Approvals",
    mobileLabel: "Payouts",
    icon: CreditCard,
    count: (ctx) => ctx.counts.pendingPayouts,
    isVisible: can("manage_payouts"),
  },
  {
    key: "support",
    label: "Support",
    mobileLabel: "Support",
    icon: LifeBuoy,
    count: (ctx) => ctx.counts.pendingTickets,
    // Any admin with a role can reach support, not just those with the
    // explicit permission.
    isVisible: (ctx) => ctx.permissions.includes("manage_support") || ctx.isSuperAdmin || ctx.hasAnyRole,
  },
  {
    key: "recovery",
    label: "Incomplete Registrations",
    mobileLabel: "Incomplete Reg",
    icon: UserPlus,
    count: (ctx) => ctx.counts.pendingRecovery,
    isVisible: can("manage_support"),
  },
  {
    key: "promotions",
    label: "Promotions",
    mobileLabel: "Promotions",
    icon: Percent,
    isVisible: can("manage_promotions"),
  },
  {
    key: "blog",
    label: "TOLA Journal",
    mobileLabel: "Journal",
    icon: Mail,
    isVisible: can("manage_blog"),
  },
  {
    key: "vendors",
    label: "Vendors",
    mobileLabel: "Vendors",
    icon: Store,
    isVisible: can("manage_vendors"),
  },
  {
    key: "transporters",
    label: "Transporters",
    mobileLabel: "Transporters",
    icon: Truck,
    isVisible: can("manage_transporters"),
  },
  {
    key: "customers",
    label: "Customers",
    mobileLabel: "Customers",
    icon: Users,
    isVisible: can("manage_customers"),
  },
  {
    key: "subscriptions",
    label: "Subscriptions",
    mobileLabel: "Subscriptions",
    icon: CreditCard,
    isVisible: can("manage_subscriptions"),
  },
  {
    key: "hr",
    label: "Human Resource",
    mobileLabel: "HR",
    icon: Briefcase,
    count: (ctx) => ctx.counts.pendingHr,
    isVisible: can("manage_hr"),
  },
  {
    key: "infrastructure",
    label: "Infrastructure",
    mobileLabel: "Infrastructure",
    icon: Server,
    isVisible: can("manage_system"),
  },
  {
    key: "api-integrations",
    label: "API & Integrations",
    mobileLabel: "API & Integrations",
    icon: Network,
    isVisible: can("manage_system"),
  },
  {
    key: "security-access",
    label: "Security & Access",
    mobileLabel: "Security & Access",
    icon: ShieldAlert,
    isVisible: can("manage_system"),
  },
  {
    key: "system-health",
    label: "System Health",
    mobileLabel: "System Health",
    icon: Activity,
    isVisible: can("manage_system"),
  },
  {
    key: "logs",
    label: "Activity Logs",
    mobileLabel: "Activity Logs",
    icon: BarChart3,
    // Pre-existing: the mobile tab strip has never included Activity Logs.
    showInMobile: false,
    isVisible: can("view_logs"),
  },
  {
    key: "messaging",
    label: "Direct Messaging",
    mobileLabel: "Direct Messaging",
    icon: Mail,
    isVisible: canAny("manage_vendors", "manage_customers", "manage_transporters"),
  },
  {
    key: "validation",
    label: "Market Validation",
    mobileLabel: "Validation",
    icon: ClipboardList,
    isVisible: can("view_analytics"),
  },
  {
    key: "agents",
    label: "Sales Agents",
    mobileLabel: "Sales Agents",
    icon: Users,
    isVisible: (ctx) => ctx.canManageAgents,
  },
  {
    key: "admins",
    label: "Admin Users",
    mobileLabel: "Admin Users",
    icon: UserCircle2,
    isVisible: (ctx) => ctx.showAdminManagement,
  },
]

/** Nav items the current admin may see, in render order. */
export function getVisibleNavItems(ctx: AdminNavContext): AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter((item) => item.isVisible(ctx))
}

/** Subset shown in the mobile tab strip. */
export function getMobileNavItems(ctx: AdminNavContext): AdminNavItem[] {
  return getVisibleNavItems(ctx).filter((item) => item.showInMobile !== false)
}

/** Mobile label, with the pending count appended when the item tracks one. */
export function getMobileLabel(item: AdminNavItem, ctx: AdminNavContext): string {
  return item.count ? `${item.mobileLabel} (${item.count(ctx)})` : item.mobileLabel
}
