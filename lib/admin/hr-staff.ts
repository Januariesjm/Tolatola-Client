/**
 * Staff shape, status-tab/search/role/date filtering and per-status counts for
 * the admin HR staff list.
 *
 * Extracted from components/admin/hr-staff-subtab.tsx, where this was a
 * `useMemo` combining a status tab, a three-field search, a role filter and a
 * date range inline in the component body.
 */

export interface HRStaff {
  id: string
  full_name: string
  employee_id: string
  role: string
  department: string
  email: string
  phone: string
  join_date: string
  status: string
  manager?: string
  position?: string
  created_at?: string
}

export type StaffStatusTab = "active" | "suspended" | "inactive" | "terminated"

/**
 * Whether a staff record belongs on the given status tab.
 *
 * "inactive" also matches the legacy "exited" status value, which some older
 * records still carry.
 */
export function matchesStatusTab(staff: HRStaff, tab: StaffStatusTab): boolean {
  switch (tab) {
    case "active":
      return staff.status === "active"
    case "suspended":
      return staff.status === "suspended"
    case "inactive":
      return staff.status === "inactive" || staff.status === "exited"
    case "terminated":
      return staff.status === "terminated"
  }
}

/** Fields an admin can search a staff record by: name, email or employee id. */
export function matchesStaffQuery(staff: HRStaff, query: string): boolean {
  const needle = query.toLowerCase()

  return Boolean(
    staff.full_name?.toLowerCase().includes(needle) ||
    staff.email?.toLowerCase().includes(needle) ||
    staff.employee_id?.toLowerCase().includes(needle),
  )
}

/**
 * The date a record is filtered by: `created_at` when present, else
 * `join_date`. Older records predate the `created_at` column.
 */
function recordDate(staff: HRStaff): Date {
  return new Date(staff.created_at || staff.join_date)
}

export interface StaffFilters {
  statusTab: StaffStatusTab
  query: string
  role: string
  dateFrom: string
  dateTo: string
}

/**
 * Filters by status tab, search query, role and a created/joined date range.
 * "all" for `role` matches every role; an empty `dateFrom`/`dateTo` leaves
 * that bound unset.
 */
export function filterStaff(staff: HRStaff[], { statusTab, query, role, dateFrom, dateTo }: StaffFilters): HRStaff[] {
  return staff.filter((s) => {
    if (!matchesStatusTab(s, statusTab)) return false
    if (query && !matchesStaffQuery(s, query)) return false
    if (role !== "all" && s.role !== role) return false

    if (dateFrom && recordDate(s) < new Date(dateFrom)) return false

    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      if (recordDate(s) > to) return false
    }

    return true
  })
}

/** Distinct, non-empty roles present in the list. */
export function distinctRoles(staff: HRStaff[]): string[] {
  return Array.from(new Set(staff.map((s) => s.role).filter(Boolean)))
}

export interface StaffStatusCounts {
  active: number
  suspended: number
  exited: number
  terminated: number
}

/** Counts staff per status tab (see matchesStatusTab for what "exited" includes). */
export function countStaffByStatus(staff: HRStaff[]): StaffStatusCounts {
  return staff.reduce<StaffStatusCounts>(
    (acc, s) => {
      if (s.status === "active") acc.active++
      else if (s.status === "suspended") acc.suspended++
      else if (s.status === "inactive" || s.status === "exited") acc.exited++
      else if (s.status === "terminated") acc.terminated++
      return acc
    },
    { active: 0, suspended: 0, exited: 0, terminated: 0 },
  )
}
