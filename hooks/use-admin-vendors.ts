"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { clientApiDelete, clientApiGet, clientApiPost } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { logger } from "@/lib/logger"
import { filterVendors, isVendorActive, type Vendor } from "@/lib/admin/vendors"

/**
 * Loading, searching and administering the vendor list.
 *
 * Extracted from components/admin/vendor-management-tab.tsx, which held nine
 * pieces of state and four handlers alongside 440 lines of markup.
 *
 * The filtered list is derived rather than stored. It used to be a second piece
 * of state kept in step by an effect *and* re-set by hand inside every mutation
 * handler -- three places that had to agree about the same list. Deriving it
 * means they cannot disagree.
 */

const log = logger.child("admin.vendors")

export interface AdminVendors {
  vendors: Vendor[]
  /** `vendors` narrowed by `searchQuery`. */
  filteredVendors: Vendor[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  isLoading: boolean
  /** Re-reads the list from the API. */
  refresh: () => Promise<void>
  /** Activates a deactivated vendor, or the reverse. */
  toggleActive: (vendor: Vendor) => Promise<void>
  /** Permanently deletes the vendor and everything related to it. */
  deleteVendor: (vendorId: string) => Promise<boolean>
}

export function useAdminVendors(): AdminVendors {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const filteredVendors = useMemo(() => filterVendors(vendors, searchQuery), [vendors, searchQuery])

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await clientApiGet<{ data: Vendor[] }>("admin/vendors")
      setVendors(response.data || [])
    } catch (error) {
      log.error("error fetching vendors", error)
      toast({
        title: "Error",
        description: "Failed to load vendors",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleActive = async (vendor: Vendor) => {
    try {
      const newStatus = !isVendorActive(vendor)
      await clientApiPost(`admin/vendors/${vendor.id}/${newStatus ? "activate" : "deactivate"}`)

      toast({
        title: newStatus ? "Vendor Activated" : "Vendor Deactivated",
        description: `${vendor.business_name} has been ${newStatus ? "activated" : "deactivated"}`,
      })

      setVendors((previous) => previous.map((v) => (v.id === vendor.id ? { ...v, is_active: newStatus } : v)))
    } catch (error) {
      log.error("error toggling vendor status", error)
      toast({
        title: "Error",
        description: "Failed to update vendor status",
        variant: "destructive",
      })
    }
  }

  /** Returns true when the vendor was deleted, so the caller can close its dialog. */
  const deleteVendor = async (vendorId: string) => {
    try {
      await clientApiDelete(`admin/vendors/${vendorId}`)
      toast({
        title: "Vendor Deleted",
        description: "The vendor and all related records have been permanently deleted.",
      })
      setVendors((previous) => previous.filter((v) => v.id !== vendorId))
      return true
    } catch (error) {
      log.error("error deleting vendor", error)
      toast({
        title: "Error",
        description: "Failed to delete vendor account",
        variant: "destructive",
      })
      return false
    }
  }

  return { vendors, filteredVendors, searchQuery, setSearchQuery, isLoading, refresh, toggleActive, deleteVendor }
}
