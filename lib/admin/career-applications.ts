/**
 * Career application shape, search/filter rules and status counts for the
 * admin HR applications list.
 *
 * Extracted from components/admin/hr-applications-subtab.tsx, where the search
 * predicate and the per-status counts were inline in the component body.
 */

export interface CareerApplication {
  id: string
  full_name: string
  email: string
  phone?: string
  position: string
  cover_letter?: string
  cv_url: string
  cv_filename?: string
  certificates_url?: string
  certificates_filename?: string
  application_letter_url?: string
  application_letter_filename?: string
  status: "pending" | "reviewed" | "shortlisted" | "rejected"
  admin_notes?: string
  created_at: string
  updated_at: string
}

/** The distinct positions applied for, alphabetically -- for the position filter's options. */
export function distinctPositions(applications: CareerApplication[]): string[] {
  return [...new Set(applications.map((a) => a.position))].sort()
}

/**
 * Fields an admin can search an application by: name, email or position.
 */
export function matchesApplicationQuery(application: CareerApplication, query: string): boolean {
  const needle = query.toLowerCase()

  return (
    application.full_name.toLowerCase().includes(needle) ||
    application.email.toLowerCase().includes(needle) ||
    application.position.toLowerCase().includes(needle)
  )
}

export interface ApplicationFilters {
  query: string
  statusFilter: string
  positionFilter: string
}

/** Filters by search query, status and position. "all" matches every status/position. */
export function filterApplications(
  applications: CareerApplication[],
  { query, statusFilter, positionFilter }: ApplicationFilters,
): CareerApplication[] {
  return applications.filter((app) => {
    const matchesSearch = !query || matchesApplicationQuery(app, query)
    const matchesStatus = statusFilter === "all" || app.status === statusFilter
    const matchesPosition = positionFilter === "all" || app.position === positionFilter

    return matchesSearch && matchesStatus && matchesPosition
  })
}

export interface ApplicationStatusCounts {
  all: number
  pending: number
  reviewed: number
  shortlisted: number
  rejected: number
}

/** Counts applications per status, plus the total under `all`. */
export function countApplicationsByStatus(applications: CareerApplication[]): ApplicationStatusCounts {
  return {
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    reviewed: applications.filter((a) => a.status === "reviewed").length,
    shortlisted: applications.filter((a) => a.status === "shortlisted").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  }
}

/** "Aug 21, 2026" -- the date format used throughout this list. */
export function formatApplicationDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}
