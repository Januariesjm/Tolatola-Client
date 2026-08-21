"use client"

/**
 * Sent-messages history card for the admin messaging tab.
 *
 * Extracted verbatim from components/admin/messaging-tab.tsx. Presentational
 * -- the logs are already filtered by the caller (lib/admin/messaging.ts).
 */

import { format } from "date-fns"
import { Clock, History, Loader2, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { ActivityLog } from "@/lib/admin/messaging"

export interface MessagingHistoryCardProps {
  logs: ActivityLog[]
  loading: boolean
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  onRefresh: () => void
}

export function MessagingHistoryCard({
  logs: filteredLogs,
  loading: loadingLogs,
  searchQuery: logSearchQuery,
  onSearchQueryChange,
  onRefresh,
}: MessagingHistoryCardProps) {
  return (
    <Card className="border-slate-200 shadow-sm lg:col-span-5 bg-white">
      <CardHeader className="pb-3 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-slate-500" />
            Sent Messages Log
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={onRefresh}>
            <Clock className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>History of direct messages dispatched by admins.</CardDescription>
        <div className="relative mt-3">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Search history logs..."
            className="pl-8 bg-slate-50/50"
            value={logSearchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100">
          {loadingLogs ? (
            <div className="p-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              <p className="mt-2 text-xs text-slate-500">Loading delivery history...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No messaging activity logs found.</div>
          ) : (
            filteredLogs.map((log) => {
              const details = log.details || {}
              const ch = details.channels || {}
              return (
                <div key={log.id} className="p-4 hover:bg-slate-50/30 transition-colors space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-sm text-slate-800">{details.recipient_name || "Unnamed"}</div>
                      <div className="text-xs text-slate-400">{details.recipient_email}</div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                      {format(new Date(log.created_at), "MMM d, HH:mm")}
                    </span>
                  </div>

                  <div className="text-sm text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                    <div className="font-semibold text-xs text-slate-500 mb-0.5">Subject: {details.subject}</div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="text-slate-500">
                      By: <span className="font-medium">{log.admin?.full_name || "Admin"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {ch.sendEmail && (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-sky-50 text-sky-700 border-sky-200">
                          Email
                        </Badge>
                      )}
                      {ch.sendInApp && (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-indigo-50 text-indigo-700 border-indigo-200">
                          In-App
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
