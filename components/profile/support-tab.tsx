"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, PlusCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createSupportTicket } from "@/app/actions/support"
import { ChatDialog } from "@/components/messaging/chat-dialog"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface SupportTabProps {
    tickets: any[]
}

export default function SupportTab({ tickets }: SupportTabProps) {
    const router = useRouter()
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [chatOpen, setChatOpen] = useState(false)
    const [selectedTicket, setSelectedTicket] = useState<any>(null)

    // Form state
    const [subject, setSubject] = useState("")
    const [message, setMessage] = useState("")
    const [priority, setPriority] = useState("low")

    const handleCreateTicket = async () => {
        if (!subject || !message) return

        setLoading(true)
        const result = await createSupportTicket(subject, message, priority)
        setLoading(false)

        if (result.error) {
            toast({
                title: "Error",
                description: result.error,
                variant: "destructive",
            })
        } else {
            toast({
                title: "Success",
                description: "Support ticket created successfully",
            })
            setCreateDialogOpen(false)
            setSubject("")
            setMessage("")
            setPriority("low")
            router.refresh() // Refresh to show new ticket

            // Open chat immediately? Optional.
            // setSelectedTicket(result.ticket)
            // setChatOpen(true)
        }
    }

    const openChat = (ticket: any) => {
        setSelectedTicket(ticket)
        setChatOpen(true)
    }

    const statusColors: Record<string, string> = {
        open: "bg-red-500",
        in_progress: "bg-yellow-500",
        resolved: "bg-green-500",
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-zinc-500 text-sm">Manage your support requests and chat with agents.</p>
                </div>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Ticket
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create Support Ticket</DialogTitle>
                            <DialogDescription>
                                Describe your issue and we'll connect you with an agent.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="subject" className="text-right">Subject</Label>
                                <Input
                                    id="subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="priority" className="text-right">Priority</Label>
                                <Select value={priority} onValueChange={setPriority}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="message" className="text-right">Message</Label>
                                <Textarea
                                    id="message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateTicket} disabled={loading}>
                                {loading ? "Creating..." : "Create Ticket"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {tickets.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-zinc-500">
                        You don't have any support tickets yet.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {tickets.map((ticket) => (
                        <Card key={ticket.id} className="overflow-hidden">
                            <div className="p-6">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                                            <Badge className={statusColors[ticket.status]}>{ticket.status}</Badge>
                                        </div>
                                        <p className="text-sm text-zinc-500 line-clamp-2">{ticket.message}</p>
                                        <p className="text-xs text-zinc-400">Created: {new Date(ticket.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <Button onClick={() => openChat(ticket)} variant={ticket.status === 'resolved' ? "outline" : "default"}>
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        {ticket.status === 'resolved' ? "View Chat" : "Chat with Support"}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {selectedTicket && (
                <ChatDialog
                    open={chatOpen}
                    onOpenChange={setChatOpen}
                    conversationId={selectedTicket.conversation_id}
                    shopName="Customer Support"
                    productName={`Ticket #${selectedTicket.id.substring(0, 8)}: ${selectedTicket.subject}`}
                />
            )}
        </div>
    )
}
