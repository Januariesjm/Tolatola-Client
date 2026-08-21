"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { clientApiDelete, clientApiGet, clientApiPost } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { logger } from "@/lib/logger"
import { filterTransporters, isTransporterActive, type Transporter } from "@/lib/admin/transporters"

/**
 * Loading, searching and administering the transporter list.
 *
 * Extracted from components/admin/transporter-management-tab.tsx, mirroring
 * hooks/use-admin-vendors.ts: the filtered list is derived with useMemo rather
 * than kept as a second piece of state re-set by hand inside every mutation
 * handler.
 */

const log = logger.child("admin.transporters")

export interface AdminTransporters {
  transporters: Transporter[]
  /** `transporters` narrowed by `searchQuery`. */
  filteredTransporters: Transporter[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  isLoading: boolean
  toggleActive: (transporter: Transporter) => Promise<void>
  /** Returns true when the transporter was deleted, so the caller can close its dialog. */
  deleteTransporter: (transporterId: string) => Promise<boolean>
}

export function useAdminTransporters(): AdminTransporters {
  const [transporters, setTransporters] = useState<Transporter[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const filteredTransporters = useMemo(() => filterTransporters(transporters, searchQuery), [transporters, searchQuery])

  const fetchTransporters = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await clientApiGet<{ data: Transporter[] }>("admin/transporters")
      setTransporters(response.data || [])
    } catch (error) {
      log.error("error fetching transporters", error)
      toast({
        title: "Error",
        description: "Failed to load transporters",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchTransporters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleActive = async (transporter: Transporter) => {
    try {
      const newStatus = !isTransporterActive(transporter)
      await clientApiPost(`admin/transporters/${transporter.id}/${newStatus ? "activate" : "deactivate"}`)

      toast({
        title: newStatus ? "Transporter Activated" : "Transporter Deactivated",
        description: `${transporter.users?.full_name || "Transporter"} has been ${newStatus ? "activated" : "deactivated"}`,
      })

      setTransporters((previous) => previous.map((t) => (t.id === transporter.id ? { ...t, is_active: newStatus } : t)))
    } catch (error) {
      log.error("error toggling transporter status", error)
      toast({
        title: "Error",
        description: "Failed to update transporter status",
        variant: "destructive",
      })
    }
  }

  const deleteTransporter = async (transporterId: string) => {
    try {
      await clientApiDelete(`admin/transporters/${transporterId}`)
      toast({
        title: "Transporter Deleted",
        description: "The transporter has been permanently deleted.",
      })
      setTransporters((previous) => previous.filter((t) => t.id !== transporterId))
      return true
    } catch (error) {
      log.error("error deleting transporter", error)
      toast({
        title: "Error",
        description: "Failed to delete transporter account",
        variant: "destructive",
      })
      return false
    }
  }

  return { transporters, filteredTransporters, searchQuery, setSearchQuery, isLoading, toggleActive, deleteTransporter }
}
