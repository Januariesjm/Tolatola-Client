"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface SupportTicketsTabProps {
  tickets: any[]
}

export function SupportTicketsTab({ tickets }: SupportTicketsTabProps) {
  const router = useRouter()

  const handleResolve = async (ticketId: string) => {
    const supabase = createClient()
    await supabase.from("support_tickets").update({ status: "resolved" }).eq("id", ticketId)
    router.refresh()
  }

  const statusColors: Record<string, string> = {
    open: "bg-red-500",
    in_progress: "bg-yellow-500",
    resolved: "bg-green-500",
  }

  const priorityColors: Record<string, string> = {
    low: "bg-gray-500",
    medium: "bg-blue-500",
    high: "bg-orange-500",
    urgent: "bg-red-500",
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Support Tickets</h2>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No support tickets</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                    <CardDescription>
                      From: {ticket.users?.full_name || ticket.users?.email || "Unknown"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={statusColors[ticket.status]}>{ticket.status}</Badge>
                    <Badge className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{ticket.message}</p>
                <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-3">
                  <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                  {ticket.status !== "resolved" && (
                    <Button size="sm" onClick={() => handleResolve(ticket.id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Resolved
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
