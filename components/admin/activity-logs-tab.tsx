"use client"

import { useState, useEffect } from "react"
import { createClient } from "../../lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"
import { Badge } from "../ui/badge"
import { Loader2, Search, Filter } from "lucide-react"
import { Input } from "../ui/input"
import { format } from "date-fns"

interface ActivityLog {
  id: string
  admin_id: string
  action: string
  resource: string
  details: any
  created_at: string
  admin: {
    full_name: string
    email: string
  }
}

export function ActivityLogsTab() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from("admin_activity_logs")
        .select(`
          *,
          admin:admin_id (full_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) throw error
      
      // Ensure data conforms to ActivityLog type by picking correct fields
      const formattedData = (data || []).map(log => ({
        ...log,
        admin: Array.isArray(log.admin) ? log.admin[0] : (log.admin || { full_name: "Unknown", email: "" })
      })) as ActivityLog[]

      setLogs(formattedData)
    } catch (err) {
      console.error("Error fetching logs:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.admin?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.admin?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatAction = (action: string) => {
    const formatted = action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
    switch(action) {
      case "approve": return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{formatted}</Badge>
      case "reject": return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{formatted}</Badge>
      case "activate": return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{formatted}</Badge>
      case "deactivate": return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100">{formatted}</Badge>
      case "assign_role": return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">{formatted}</Badge>
      default: return <Badge variant="outline">{formatted}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Activity Logs</h2>
          <p className="text-sm text-slate-500">Track all administrative actions across the platform.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search logs..."
              className="pl-8 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Timestamp</th>
                <th className="px-6 py-4 font-semibold">Admin</th>
                <th className="px-6 py-4 font-semibold">Action</th>
                <th className="px-6 py-4 font-semibold">Resource</th>
                <th className="px-6 py-4 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-sm text-muted-foreground">Loading activity logs...</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No activity logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      {format(new Date(log.created_at), "MMM d, yyyy HH:mm:ss")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{log.admin?.full_name || "Unknown Admin"}</div>
                      <div className="text-xs text-slate-500">{log.admin?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatAction(log.action)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 truncate max-w-[200px]" title={log.resource}>
                      {log.resource}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-500 max-w-[300px] truncate" title={JSON.stringify(log.details)}>
                        {Object.keys(log.details).length > 0 ? JSON.stringify(log.details) : "-"}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
