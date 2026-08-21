"use client"

/**
 * One support ticket's card in the admin tickets list.
 *
 * Extracted verbatim from components/admin/support-tickets-tab.tsx.
 * Presentational -- message counts, unread state and the resolved/deleting
 * flags are all computed by the caller.
 */

import { AlertCircle, CheckCircle, Clock, Loader2, MessageSquare, Trash2, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { departmentBadgeStyle, isTicketResolved, PRIORITY_COLORS, STATUS_COLORS, type SupportTicketLike } from "@/lib/admin/support-tickets"

export interface SupportTicketCardProps {
  ticket: SupportTicketLike & { id: string; priority?: string | null; created_at: string; conversation_id?: string | null }
  index: number
  messageCount: number
  hasUnreadReply: boolean
  isDeleting: boolean
  onOpenChat: () => void
  onResolve: () => void
  onDelete: () => void
}

export function SupportTicketCard({
  ticket,
  index,
  messageCount: msgCount,
  hasUnreadReply: hasNewUserMsg,
  isDeleting,
  onOpenChat,
  onResolve,
  onDelete,
}: SupportTicketCardProps) {
  const isResolved = isTicketResolved(ticket.status)
  const deptInfo = departmentBadgeStyle(ticket.department)

  return (
    <Card
      key={ticket.id}
      className={`transition-all hover:shadow-md border ${
        hasNewUserMsg
          ? "border-emerald-500/60 bg-emerald-500/5 dark:bg-emerald-950/10 shadow-emerald-500/5"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                #{index + 1}
              </span>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">{ticket.subject}</CardTitle>
              <Badge variant="outline" className={`text-[11px] font-semibold ${deptInfo.className}`}>
                {deptInfo.label}
              </Badge>
              {hasNewUserMsg && (
                <Badge className="bg-emerald-500 text-white text-[10px] animate-pulse px-2 py-0.5">New Reply Received</Badge>
              )}
            </div>
            <CardDescription className="text-xs flex items-center gap-1.5 text-slate-500">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span>
                From: <strong>{ticket.users?.full_name || ticket.users?.email || ticket.guest_name || "Customer User"}</strong>
              </span>
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={`text-xs font-medium ${STATUS_COLORS[ticket.status || ""] || ""}`}>
              {ticket.status?.replace("_", " ")}
            </Badge>
            <Badge variant="outline" className={`text-xs font-medium ${PRIORITY_COLORS[ticket.priority || ""] || ""}`}>
              {ticket.priority} priority
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          {ticket.description}
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              {new Date(ticket.created_at).toLocaleDateString()} at{" "}
              {new Date(ticket.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            {msgCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300/50 text-[11px] flex items-center gap-1"
              >
                <MessageSquare className="h-3 w-3" />
                {msgCount} {msgCount === 1 ? "Message" : "Messages"}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={hasNewUserMsg ? "default" : "outline"}
              onClick={onOpenChat}
              className={`text-xs h-8 ${
                hasNewUserMsg
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              Open Live Chat {msgCount > 0 && `(${msgCount})`}
            </Button>

            {!isResolved && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onResolve}
                className="text-xs h-8 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                Resolve
              </Button>
            )}

            {/* Individual Delete Button for Super Admin */}
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              disabled={isDeleting}
              className="text-xs h-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
              title="Delete ticket permanently"
            >
              {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
