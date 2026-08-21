"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { clientApiPut } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { logger, normalizeError } from "@/lib/logger"
import type { IncompleteRegistration } from "@/lib/types/admin"

const log = logger.child("admin.incomplete-registrations")

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  contacted: "Contacted",
  completed: "Completed",
  not_interested: "Not Interested",
  active: "Active",
}

/**
 * Search/status/type filtering, per-status counts, and the recovery-status
 * update mutation for the incomplete-registrations admin tab.
 *
 * `updateStatus` keeps the original endpoint's PUT verb via `clientApiPut`
 * (the sibling admin tabs' own status-update actions use POST against a
 * different backend route, so that isn't evidence this one takes POST too)
 * -- only the transport (raw `fetch` with a session cookie) changes to the
 * shared client (bearer token from the Supabase session), matching every
 * other admin tab's mutations.
 */
export function useIncompleteRegistrations(registrations: IncompleteRegistration[]) {
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [contactModal, setContactModal] = useState<{ id: string; name: string } | null>(null)
  const [contactNotes, setContactNotes] = useState("")
  const [processing, setProcessing] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return registrations.filter((r) => {
      if (statusFilter !== "all" && r.recovery_status !== statusFilter) return false
      if (typeFilter !== "all" && r.user_type !== typeFilter) return false
      const q = searchQuery.toLowerCase()
      const name = (r.full_name || "").toLowerCase()
      const email = (r.email || "").toLowerCase()
      const phone = (r.phone || "").toLowerCase()
      return name.includes(q) || email.includes(q) || phone.includes(q)
    })
  }, [registrations, searchQuery, statusFilter, typeFilter])

  const pending = registrations.filter((r) => r.recovery_status === "pending").length
  const contacted = registrations.filter((r) => r.recovery_status === "contacted").length
  const completed = registrations.filter((r) => r.recovery_status === "completed").length
  const notInterested = registrations.filter((r) => r.recovery_status === "not_interested").length

  const updateStatus = async (id: string, status: string, notes?: string) => {
    setProcessing(id)
    try {
      await clientApiPut(`admin/incomplete-registrations/${id}/status`, { status, notes })
      toast({
        title: "Status updated",
        description: `Registration marked as ${STATUS_LABEL[status] || status}.`,
      })
      router.refresh()
    } catch (error) {
      log.error("error updating registration status", normalizeError(error), { id, status })
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
      setContactModal(null)
      setContactNotes("")
    }
  }

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    expandedId,
    setExpandedId,
    contactModal,
    setContactModal,
    contactNotes,
    setContactNotes,
    processing,
    filtered,
    pending,
    contacted,
    completed,
    notInterested,
    updateStatus,
  }
}
