/**
 * Vendor shape and search rules for the admin vendor list.
 *
 * Extracted from components/admin/vendor-management-tab.tsx, where the search
 * predicate was an inline seven-way `||` chain inside a `useEffect`. Pure and
 * testable here: which fields an admin can search by is a product decision, and
 * it should be visible without reading a component.
 */

/** A vendor row as `GET admin/vendors` returns it. */
export interface Vendor {
  id: string
  user_id?: string
  business_name: string
  tin_number: string
  nida_number: string
  address: string
  district: string
  region: string
  ward: string
  kyc_status: string
  is_active?: boolean | null
  business_license_url?: string
  created_at: string
  updated_at: string
  users?: {
    email: string
    full_name: string
    phone?: string
    vendor_type?: string
  }
  phone?: string
  shops?: Array<{
    id: string
    name: string
  }>
}

/** Display names for the vendor types the registration form offers. */
export const VENDOR_TYPE_LABELS: Record<string, string> = {
  producer: "Producer",
  manufacturer: "Manufacturer",
  supplier: "Supplier",
  wholesaler: "Wholesaler",
  retail_trader: "Retail Trader",
}

/**
 * Label for a vendor type, falling back to the raw value.
 *
 * Falls back rather than showing nothing: a type the backend adds before this
 * map is updated should still be visible to an admin. Callers decide what an
 * absent type reads as, so nothing is invented here.
 */
export function vendorTypeLabel(type: string): string {
  return VENDOR_TYPE_LABELS[type] ?? type
}

/**
 * Fields an admin can search a vendor by.
 *
 * Includes both identity documents (TIN, NIDA) because support requests arrive
 * quoting either, and both phone slots because the number lives on the vendor
 * row for some records and on the joined user for others.
 */
export function matchesVendorQuery(vendor: Vendor, query: string): boolean {
  const needle = query.toLowerCase()

  return Boolean(
    vendor.business_name?.toLowerCase().includes(needle) ||
    vendor.users?.email?.toLowerCase().includes(needle) ||
    vendor.users?.full_name?.toLowerCase().includes(needle) ||
    vendor.tin_number?.toLowerCase().includes(needle) ||
    vendor.nida_number?.toLowerCase().includes(needle) ||
    vendor.users?.phone?.toLowerCase().includes(needle) ||
    vendor.phone?.toLowerCase().includes(needle),
  )
}

/** Filters the list, treating a blank query as "everything". */
export function filterVendors(vendors: Vendor[], query: string): Vendor[] {
  if (query.trim() === "") return vendors
  return vendors.filter((vendor) => matchesVendorQuery(vendor, query))
}

/**
 * Whether a vendor counts as active.
 *
 * A missing `is_active` means active: the column was added after vendors
 * already existed, and those rows are not deactivated.
 */
export function isVendorActive(vendor: Pick<Vendor, "is_active">): boolean {
  return vendor.is_active ?? true
}
