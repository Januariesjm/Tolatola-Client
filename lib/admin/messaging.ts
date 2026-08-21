/**
 * Recipient shape, row mappers, and search rules for the admin direct
 * messaging tab.
 *
 * Extracted from components/admin/messaging-tab.tsx, where the per-role API
 * response mapping and both search predicates (recipients, activity log) were
 * inline in the component body.
 */

export type RecipientRole = "customer" | "vendor" | "transporter"

/** A selectable message recipient, normalized across the three source tables. */
export interface UserDetails {
  id: string
  name: string
  email: string
  phone?: string
  /** The id a message actually gets sent to -- not always the same as `id` (see mapVendors/mapTransporters). */
  recipientId: string
}

interface CustomerRow {
  id: string
  full_name?: string | null
  email?: string | null
  phone?: string | null
}

/** `GET admin/customers` rows -> UserDetails. `id` and `recipientId` are the same for customers. */
export function mapCustomers(rows: CustomerRow[]): UserDetails[] {
  return rows.map((c) => ({
    id: c.id,
    name: c.full_name || "Unnamed Customer",
    email: c.email as string,
    phone: c.phone || "",
    recipientId: c.id,
  }))
}

interface VendorRow {
  id: string
  user_id?: string | null
  business_name?: string | null
  phone?: string | null
  users?: { full_name?: string | null; email?: string | null; phone?: string | null } | null
}

/**
 * `GET admin/vendors` rows -> UserDetails.
 *
 * `recipientId` is the joined user's id, not the vendor row's own id -- a
 * message is sent to the person, and the vendor row and the user row have
 * different ids.
 */
export function mapVendors(rows: VendorRow[]): UserDetails[] {
  return rows.map((v) => ({
    id: v.id,
    name: v.business_name || v.users?.full_name || "Unnamed Vendor",
    email: v.users?.email || "",
    phone: v.phone || v.users?.phone || "",
    recipientId: v.user_id || v.id,
  }))
}

interface TransporterRow {
  id: string
  user_id?: string | null
  business_name?: string | null
  phone?: string | null
  users?: { full_name?: string | null; email?: string | null; phone?: string | null } | null
}

/**
 * `GET admin/transporters` rows -> UserDetails.
 *
 * Unlike mapVendors, `recipientId` has no fallback to the row's own id if
 * `user_id` is missing -- matching the original inline mapper exactly rather
 * than introducing a fallback that would change which id a message sends to.
 */
export function mapTransporters(rows: TransporterRow[]): UserDetails[] {
  return rows.map((t) => ({
    id: t.id,
    name: t.users?.full_name || t.business_name || "Unnamed Transporter",
    email: t.users?.email || "",
    phone: t.phone || t.users?.phone || "",
    recipientId: t.user_id as string,
  }))
}

/**
 * Recipients matching `query`, capped at 5.
 *
 * An empty query returns nothing rather than the whole list -- the composer
 * shows suggestions only once the admin has typed something.
 */
export function filterRecipients(users: UserDetails[], query: string): UserDetails[] {
  const trimmed = query.trim()
  if (!trimmed) return []

  const needle = trimmed.toLowerCase()
  return users
    .filter(
      (u) => u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle) || u.phone?.toLowerCase().includes(needle),
    )
    .slice(0, 5)
}

export interface ActivityLogDetails {
  recipient_user_id: string
  recipient_email: string
  recipient_name: string
  subject: string
  channels: {
    sendEmail: boolean
    sendInApp: boolean
  }
  results?: unknown
}

export interface ActivityLog {
  id: string
  admin_id: string
  action: string
  resource: string
  details: ActivityLogDetails
  created_at: string
  admin: {
    full_name: string
    email: string
  }
}

/** Activity logs whose recipient, subject or sending admin matches `query`. An empty query matches everything. */
export function filterActivityLogs(logs: ActivityLog[], query: string): ActivityLog[] {
  const trimmed = query.trim()
  if (!trimmed) return logs

  const needle = trimmed.toLowerCase()
  return logs.filter(
    (log) =>
      log.details?.recipient_name?.toLowerCase().includes(needle) ||
      log.details?.recipient_email?.toLowerCase().includes(needle) ||
      log.details?.subject?.toLowerCase().includes(needle) ||
      log.admin?.full_name?.toLowerCase().includes(needle),
  )
}
