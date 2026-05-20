"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import {
  Search,
  RefreshCw,
  Store,
  Users,
  Truck,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface AgentRegistrationsTabProps {
  initialRegistrations: any[]
  agent: any
}

export function AgentRegistrationsTab({
  initialRegistrations,
  agent,
}: AgentRegistrationsTabProps) {
  const { toast } = useToast()
  const [registrations, setRegistrations] = useState<any[]>(initialRegistrations)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(false)

  // Fetch registrations helper
  const fetchRegistrations = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"

      let path = "agents/registrations"
      const params: string[] = []
      if (typeFilter !== "all") params.push(`type=${typeFilter}`)
      if (statusFilter !== "all") params.push(`status=${statusFilter}`)
      if (search.trim() !== "") params.push(`search=${encodeURIComponent(search)}`)
      if (params.length > 0) path += `?${params.join("&")}`

      const response = await fetch(`${apiBase}/${path}`, {
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      })

      if (!response.ok) throw new Error("Failed to fetch registrations")
      const res = await response.json()
      setRegistrations(res?.data || [])
    } catch (err) {
      console.error("[REGISTRATIONS TAB] Fetch failed:", err)
      toast({
        title: "Load Error",
        description: "Failed to fetch registrations list.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchRegistrations()
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Search and Filters panel */}
      <Card className="shadow-sm rounded-xl border border-slate-200 bg-white">
        <CardContent className="p-4 md:p-6">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Search Input */}
            <div className="space-y-1.5 md:col-span-2">
              <span className="text-xs font-bold text-slate-700">Search User</span>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by Name, Phone, or Email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 rounded-xl border-slate-200 text-xs md:text-sm"
                />
              </div>
            </div>

            {/* Registration Type Filter */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700">Registration Type</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs md:text-sm bg-white text-slate-700 outline-none focus:border-slate-300"
              >
                <option value="all">All</option>
                <option value="vendor">Vendors</option>
                <option value="customer">Customers</option>
                <option value="transporter">Transporters</option>
              </select>
            </div>

            {/* Search and Refresh buttons */}
            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs md:text-sm h-10"
              >
                Search
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={fetchRegistrations}
                disabled={isLoading}
                className="rounded-xl border-slate-200 h-10 px-3 hover:bg-slate-50"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                ) : (
                  <RefreshCw className="h-4 w-4 text-slate-500" />
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Main Registrations List Table */}
      <Card className="shadow-sm rounded-xl border border-slate-200 bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between py-4">
          <CardTitle className="text-sm font-bold text-slate-800">
            Total Registrations ({registrations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
              <span className="text-xs text-slate-400 font-bold">Loading list...</span>
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xs text-slate-400">No users found matching these filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-4 px-6">Full Name</th>
                    <th className="py-4 px-4">Category</th>
                    <th className="py-4 px-4">Phone Number</th>
                    <th className="py-4 px-4">Area / District</th>
                    <th className="py-4 px-4">Date Registered</th>
                    <th className="py-4 px-4">GPS Location</th>
                    <th className="py-4 px-6 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm">{reg.full_name}</span>
                          <span className="text-[10px] text-slate-400">{reg.email || "No Email"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 capitalize">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          reg.registration_type === "vendor" ? "bg-emerald-50 text-emerald-700" :
                          reg.registration_type === "customer" ? "bg-blue-50 text-blue-700" :
                          "bg-amber-50 text-amber-700"
                        }`}>
                          {reg.registration_type === "vendor" && <Store className="h-3 w-3" />}
                          {reg.registration_type === "customer" && <Users className="h-3 w-3" />}
                          {reg.registration_type === "transporter" && <Truck className="h-3 w-3" />}
                          {reg.registration_type}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono font-medium text-slate-600">
                        {reg.phone}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-slate-600 font-medium">
                          <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                          <span>
                            {reg.area ? `${reg.area}, ` : ""}
                            {reg.district || reg.region || "Tanzania"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {new Date(reg.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-[10px] text-slate-400">
                        {reg.gps_latitude && reg.gps_longitude ? (
                          <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                            {Number(reg.gps_latitude).toFixed(4)}, {Number(reg.gps_longitude).toFixed(4)}
                          </span>
                        ) : (
                          <span className="text-slate-300">Not captured</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold capitalize ${
                          reg.status === "active" ? "bg-emerald-100 text-emerald-800" :
                          reg.status === "pending" ? "bg-amber-100 text-amber-800" :
                          reg.status === "rejected" ? "bg-rose-100 text-rose-800" :
                          "bg-slate-100 text-slate-800"
                        }`}>
                          {reg.status === "active" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                          {reg.status === "pending" && <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />}
                          {reg.status === "rejected" && <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />}
                          {reg.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
