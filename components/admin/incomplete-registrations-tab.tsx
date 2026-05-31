"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Filter,
  UserPlus,
  Clock,
  Phone,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Store,
  Truck,
  ShoppingCart,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Send,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { format, formatDistanceToNow } from "date-fns"

interface IncompleteRegistrationsTabProps {
  registrations: any[]
}

export function IncompleteRegistrationsTab({ registrations }: IncompleteRegistrationsTabProps) {
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

  // Counts
  const pending = registrations.filter((r) => r.recovery_status === "pending").length
  const contacted = registrations.filter((r) => r.recovery_status === "contacted").length
  const completed = registrations.filter((r) => r.recovery_status === "completed").length
  const notInterested = registrations.filter((r) => r.recovery_status === "not_interested").length

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    contacted: "bg-blue-100 text-blue-700 border-blue-200",
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    not_interested: "bg-slate-100 text-slate-500 border-slate-200",
    active: "bg-sky-100 text-sky-700 border-sky-200",
  }

  const statusLabel: Record<string, string> = {
    pending: "Pending",
    contacted: "Contacted",
    completed: "Completed",
    not_interested: "Not Interested",
    active: "Active",
  }

  const typeIcons: Record<string, React.ReactNode> = {
    customer: <ShoppingCart className="h-4 w-4 text-emerald-600" />,
    vendor: <Store className="h-4 w-4 text-blue-600" />,
    transporter: <Truck className="h-4 w-4 text-indigo-600" />,
  }

  const stepLabels: Record<string, string> = {
    started: "Just Started",
    account_details: "Account Details",
    kyc_type: "KYC Type Selected",
    business_info: "Business Info",
    vehicle_info: "Vehicle Info",
    location: "Location Details",
    documents: "Document Upload",
    submit: "Ready to Submit",
  }

  const updateStatus = async (id: string, status: string, notes?: string) => {
    setProcessing(id)
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
      const response = await fetch(`${apiBase}/admin/incomplete-registrations/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, notes }),
      })
      if (response.ok) {
        toast({
          title: "Status updated",
          description: `Registration marked as ${statusLabel[status] || status}.`,
        })
        router.refresh()
      } else {
        throw new Error("Failed to update status")
      }
    } catch {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Incomplete Registrations</h3>
          <p className="text-slate-500 text-sm mt-1">
            Users who started registration but didn&apos;t complete it. Follow up to help them finish.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl border-slate-200 shadow-sm"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 rounded-xl border-slate-200 px-4 gap-2">
                <Filter className="h-4 w-4" />
                <span>{statusFilter === "all" ? "Status" : statusLabel[statusFilter]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
              <DropdownMenuLabel>Recovery Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {["all", "pending", "contacted", "completed", "not_interested"].map((s) => (
                <DropdownMenuCheckboxItem key={s} checked={statusFilter === s} onCheckedChange={() => setStatusFilter(s)}>
                  {s === "all" ? "All Status" : statusLabel[s]}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 rounded-xl border-slate-200 px-4 gap-2">
                <UserPlus className="h-4 w-4" />
                <span>{typeFilter === "all" ? "Type" : typeFilter}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
              <DropdownMenuLabel>User Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {["all", "customer", "vendor", "transporter"].map((t) => (
                <DropdownMenuCheckboxItem key={t} checked={typeFilter === t} onCheckedChange={() => setTypeFilter(t)}>
                  {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm rounded-xl border-amber-200 bg-white cursor-pointer hover:shadow-md transition-all" onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Pending</CardTitle>
            <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">{pending}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm rounded-xl border-blue-200 bg-white cursor-pointer hover:shadow-md transition-all" onClick={() => setStatusFilter(statusFilter === "contacted" ? "all" : "contacted")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Contacted</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Phone className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{contacted}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm rounded-xl border-emerald-200 bg-white cursor-pointer hover:shadow-md transition-all" onClick={() => setStatusFilter(statusFilter === "completed" ? "all" : "completed")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Completed</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{completed}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm rounded-xl border-slate-200 bg-white cursor-pointer hover:shadow-md transition-all" onClick={() => setStatusFilter(statusFilter === "not_interested" ? "all" : "not_interested")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Not Interested</CardTitle>
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-slate-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-600">{notInterested}</div>
          </CardContent>
        </Card>
      </div>

      {/* Records */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50/50">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <UserPlus className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No incomplete registrations</h3>
            <p className="text-slate-500 mt-1 text-sm">No records match your current filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((reg, index) => {
            const isExpanded = expandedId === reg.id
            return (
              <Card key={reg.id} className="shadow-sm hover:shadow-md transition-all border-slate-200 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4">
                    {/* Main Row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-slate-400 w-6 text-center">#{index + 1}</span>
                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                          reg.user_type === "vendor" ? "bg-blue-100" :
                          reg.user_type === "transporter" ? "bg-indigo-100" : "bg-emerald-100"
                        }`}>
                          {typeIcons[reg.user_type] || <ShoppingCart className="h-5 w-5 text-emerald-600" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900">{reg.full_name || "Anonymous"}</span>
                            <Badge variant="outline" className={`rounded-lg px-2.5 py-0.5 text-[11px] font-semibold border ${statusColors[reg.recovery_status] || ""}`}>
                              {statusLabel[reg.recovery_status] || reg.recovery_status}
                            </Badge>
                            <Badge variant="outline" className="rounded-lg px-2.5 py-0.5 text-[11px] font-semibold capitalize">
                              {reg.user_type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-slate-500 flex-wrap">
                            {reg.email && <span>{reg.email}</span>}
                            {reg.phone && <span>{reg.phone}</span>}
                            <span className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Step: {stepLabels[reg.last_step] || reg.last_step}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Last active {formatDistanceToNow(new Date(reg.last_activity_at), { addSuffix: true })}
                            {" · "}Created {format(new Date(reg.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {/* Quick Actions */}
                        {reg.phone && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl gap-1.5 text-xs"
                              asChild
                            >
                              <a href={`tel:${reg.phone}`}>
                                <Phone className="h-3.5 w-3.5" />
                                Call
                              </a>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl gap-1.5 text-xs"
                              asChild
                            >
                              <a href={`sms:${reg.phone}`}>
                                <MessageSquare className="h-3.5 w-3.5" />
                                SMS
                              </a>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl gap-1.5 text-xs text-green-700 border-green-200 hover:bg-green-50"
                              asChild
                            >
                              <a href={`https://wa.me/${reg.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer">
                                <Send className="h-3.5 w-3.5" />
                                WhatsApp
                              </a>
                            </Button>
                          </>
                        )}

                        {reg.recovery_status === "pending" && (
                          <Button
                            size="sm"
                            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs"
                            onClick={() => setContactModal({ id: reg.id, name: reg.full_name || "User" })}
                            disabled={processing === reg.id}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Mark Contacted
                          </Button>
                        )}

                        {(reg.recovery_status === "pending" || reg.recovery_status === "contacted") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl gap-1.5 text-xs text-slate-500 border-slate-200"
                            onClick={() => updateStatus(reg.id, "not_interested")}
                            disabled={processing === reg.id}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Not Interested
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-xl px-2"
                          onClick={() => setExpandedId(isExpanded ? null : reg.id)}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 pt-4 mt-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Saved Form Data</h4>
                            {reg.form_data && Object.keys(reg.form_data).length > 0 ? (
                              <div className="space-y-2">
                                {Object.entries(reg.form_data).map(([key, value]) => (
                                  <div key={key} className="flex justify-between items-center py-1 border-b border-slate-50">
                                    <span className="text-xs font-medium text-slate-500 capitalize">{key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}</span>
                                    <span className="text-sm font-semibold text-slate-800">{String(value) || "—"}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-400 italic">No form data captured</p>
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Contact History</h4>
                            {reg.contacted_at ? (
                              <div className="space-y-2">
                                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                                  <span className="text-xs font-medium text-slate-500">Contacted At</span>
                                  <span className="text-sm font-semibold text-slate-800">{format(new Date(reg.contacted_at), "MMM d, yyyy 'at' p")}</span>
                                </div>
                                {reg.contact_notes && (
                                  <div className="mt-2">
                                    <span className="text-xs font-medium text-slate-500">Notes</span>
                                    <p className="text-sm text-slate-700 mt-1 p-3 bg-slate-50 rounded-xl">{reg.contact_notes}</p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-400 italic">No contact history yet</p>
                            )}

                            <div className="mt-4 space-y-2">
                              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                                <span className="text-xs font-medium text-slate-500">Session ID</span>
                                <span className="text-xs font-mono text-slate-600">{reg.session_id?.slice(0, 20)}...</span>
                              </div>
                              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                                <span className="text-xs font-medium text-slate-500">Expires</span>
                                <span className="text-sm text-slate-800">{format(new Date(reg.expires_at), "MMM d, yyyy")}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Contact Notes Modal */}
      <Dialog open={!!contactModal} onOpenChange={(open) => !open && setContactModal(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Mark as Contacted</DialogTitle>
            <DialogDescription>
              Add notes about your follow-up with {contactModal?.name || "this user"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="e.g., Called the user, explained registration steps. Will follow up tomorrow."
              value={contactNotes}
              onChange={(e) => setContactNotes(e.target.value)}
              className="min-h-[120px] rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactModal(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={() => contactModal && updateStatus(contactModal.id, "contacted", contactNotes)}
              className="rounded-xl bg-blue-600 hover:bg-blue-700"
              disabled={processing === contactModal?.id}
            >
              {processing ? "Saving..." : "Mark as Contacted"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
