/**
 * Transporter shape and search rules for the admin transporter list.
 *
 * Extracted from components/admin/transporter-management-tab.tsx, where the
 * search predicate was a six-way `||` chain inline inside a `useEffect`.
 */

/** A transporter row as `GET admin/transporters` returns it. */
export interface Transporter {
  id: string
  user_id: string
  vehicle_type: string
  vehicle_registration: string
  license_number: string
  kyc_status: string
  availability_status: string
  is_active?: boolean | null
  created_at: string
  updated_at: string
  total_deliveries: number
  users?: {
    email: string
    full_name: string
    phone?: string
  }
  phone?: string
  business_name?: string
  region?: string
  district?: string
  driver_license_url?: string
  id_document_url?: string
  license_document_url?: string
  vehicle_registration_document_url?: string
}

/**
 * Fields an admin can search a transporter by: the driver's name/email/phone,
 * the vehicle registration, the license number, and the phone on the
 * transporter row itself (older records carry it there instead of on the
 * joined user).
 */
export function matchesTransporterQuery(transporter: Transporter, query: string): boolean {
  const needle = query.toLowerCase()

  return Boolean(
    transporter.users?.full_name?.toLowerCase().includes(needle) ||
    transporter.users?.email?.toLowerCase().includes(needle) ||
    transporter.vehicle_registration?.toLowerCase().includes(needle) ||
    transporter.license_number?.toLowerCase().includes(needle) ||
    transporter.phone?.toLowerCase().includes(needle) ||
    transporter.users?.phone?.toLowerCase().includes(needle),
  )
}

/** Filters the list, treating a blank query as "everything". */
export function filterTransporters(transporters: Transporter[], query: string): Transporter[] {
  if (query.trim() === "") return transporters
  return transporters.filter((t) => matchesTransporterQuery(t, query))
}

/**
 * Whether a transporter counts as active.
 *
 * A missing `is_active` means active: the column was added after transporters
 * already existed, and those rows are not deactivated.
 */
export function isTransporterActive(transporter: Pick<Transporter, "is_active">): boolean {
  return transporter.is_active ?? true
}
