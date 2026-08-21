/**
 * Filter rules and display maps for the admin support tickets list.
 *
 * Extracted from components/admin/support-tickets-tab.tsx, where department
 * scoping, the status/search filter and the status/priority/department badge
 * styles were all inline in the component body.
 */

/** Tailwind classes per ticket status. */
export const STATUS_COLORS: Record<string, string> = {
  open: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  in_progress: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  resolved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
}

/** Tailwind classes per ticket priority. */
export const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-200",
  high: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-200",
  urgent: "bg-red-600 text-white shadow-sm",
}

export interface DepartmentBadgeStyle {
  label: string
  className: string
}

/** Display label and badge classes per support department. */
export const DEPARTMENT_BADGE_STYLES: Record<string, DepartmentBadgeStyle> = {
  general: {
    label: "General Support",
    className: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  it: {
    label: "IT Support",
    className: "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  },
  finance: {
    label: "Finance & Payouts",
    className: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  hr: {
    label: "Human Resources",
    className: "bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800",
  },
  vendor: {
    label: "Vendor Management",
    className: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  logistics: {
    label: "Logistics & Delivery",
    className: "bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800",
  },
}

/** `departmentBadgeStyles[dept]`, falling back to "General Support" for an unrecognised department. */
export function departmentBadgeStyle(department: string | null | undefined): DepartmentBadgeStyle {
  return DEPARTMENT_BADGE_STYLES[department || "general"] || DEPARTMENT_BADGE_STYLES.general
}

/** Ticket statuses that count as resolved -- includes two legacy spellings some older records still carry. */
export function isTicketResolved(status: string | null | undefined): boolean {
  return status === "resolved" || status === "completed" || status === "closed"
}

export interface SupportTicketLike {
  department?: string | null
  status?: string | null
  subject?: string | null
  description?: string | null
  users?: { full_name?: string | null; email?: string | null } | null
  guest_name?: string | null
}

/**
 * Narrows `tickets` to the departments the caller is allowed to see.
 *
 * A Super Admin sees everything, or one department (or "vendor", which also
 * includes "logistics" -- the vendor department historically covers both) via
 * `departmentFilter`. A department-scoped admin sees only their own
 * comma-separated list of departments. Anyone else sees everything.
 */
export function scopeTicketsByDepartment<T extends SupportTicketLike>(
  tickets: T[],
  options: { isSuperAdmin: boolean; departmentFilter: string; department?: string },
): T[] {
  const { isSuperAdmin, departmentFilter, department } = options

  return tickets.filter((ticket) => {
    const dept = ticket.department || "general"

    if (isSuperAdmin) {
      if (departmentFilter === "all") return true
      if (departmentFilter === "vendor") return dept === "vendor" || dept === "logistics"
      return dept === departmentFilter
    }

    if (department) {
      const allowedDepts = department.split(",").map((d) => d.trim())
      return allowedDepts.includes(dept)
    }

    return true
  })
}

/**
 * Fields an admin can search a ticket by: subject, description, and one of
 * the requester's name, email or guest name.
 *
 * Only one of those three is checked, not all of them: `full_name || email ||
 * guest_name` picks the first that exists, so a ticket with a full_name on
 * record is not searchable by the same user's email. Preserved from the
 * original inline predicate rather than widened to search all three, since
 * that would be a behavior change, not just an extraction.
 */
export function matchesTicketQuery(ticket: SupportTicketLike, query: string): boolean {
  const needle = query.toLowerCase()
  const name = ticket.users?.full_name || ticket.users?.email || ticket.guest_name || ""

  return Boolean(
    ticket.subject?.toLowerCase().includes(needle) ||
    ticket.description?.toLowerCase().includes(needle) ||
    name.toLowerCase().includes(needle),
  )
}

/** Filters already-department-scoped tickets by status and search query. */
export function filterTicketsByStatusAndQuery<T extends SupportTicketLike>(
  tickets: T[],
  options: { statusFilter: string; query: string },
): T[] {
  const { statusFilter, query } = options

  return tickets.filter((ticket) => {
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
    return matchesStatus && matchesTicketQuery(ticket, query)
  })
}

export interface TicketStatusCounts {
  open: number
  inProgress: number
  resolved: number
}

/** Counts tickets by status, folding every resolved-like status into one bucket. */
export function countTicketsByStatus(tickets: SupportTicketLike[]): TicketStatusCounts {
  return {
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => isTicketResolved(t.status)).length,
  }
}
