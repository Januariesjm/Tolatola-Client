"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, Headphones, X } from "lucide-react"
import { ChatDialog } from "@/components/messaging/chat-dialog"
import { createClient } from "@/lib/supabase/client"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createSupportTicket } from "@/app/actions/support"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function FloatingSupportWidget() {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [activeTicket, setActiveTicket] = useState<any>(null)
    const [chatOpen, setChatOpen] = useState(false)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)

    // Create Form State
    const [subject, setSubject] = useState("")
    const [message, setMessage] = useState("")
    const [priority, setPriority] = useState("low")
    const [loading, setLoading] = useState(false)

    // Auth check
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                setIsAuthenticated(true)
                // Check for active ticket (latest open or in_progress)
                const { data: tickets } = await supabase
                    .from("support_tickets")
                    .select("*")
                    .eq("user_id", user.id)
                    .in("status", ["open", "in_progress"])
                    .order("created_at", { ascending: false })
                    .limit(1)

                if (tickets && tickets.length > 0) {
                    setActiveTicket(tickets[0])
                }
            }
        }

        checkAuthAndFetch()
    }, [])

    const handleFabClick = () => {
        if (!isAuthenticated) {
            toast({
                title: "Sign in required",
                description: "Please sign in to contact support.",
            })
            router.push("/auth/login")
            return
        }

        if (activeTicket) {
            setChatOpen(true)
        } else {
            setCreateDialogOpen(true)
        }
    }

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
                title: "Support Connected",
                description: "Ticket created. Connecting you to an agent...",
            })
            setCreateDialogOpen(false)
            // Set as active and open chat
            setActiveTicket(result.ticket)
            setChatOpen(true)

            setSubject("")
            setMessage("")
            setPriority("low")
        }
    }

    // If chat is closed, we might want to refresh checking for active tickets?
    // For now simple lifecycle is fine.

    if (!isAuthenticated && typeof window !== 'undefined' && window.location.pathname.includes('/auth')) {
        return null // Don't show on auth pages if not logged in
    }

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-1000">
                <Button
                    size="lg"
                    className="h-14 w-14 rounded-full shadow-2xl bg-indigo-600 hover:bg-indigo-700 text-white p-0 relative group"
                    onClick={handleFabClick}
                >
                    {activeTicket ? (
                        <>
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            <MessageCircle className="h-6 w-6" />
                        </>
                    ) : (
                        <Headphones className="h-6 w-6 text-white" />
                    )}

                    {/* Tooltip-ish hint */}
                    <span className="absolute right-full mr-4 bg-white text-stone-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {activeTicket ? "Resume Chat" : "Need Help?"}
                    </span>
                </Button>
            </div>

            {/* Create Ticket Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Contact Support</DialogTitle>
                        <DialogDescription>
                            How can we help you today? Start a chat with us.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="fab-subject">Subject/Topic</Label>
                            <Input
                                id="fab-subject"
                                placeholder="e.g. Order Issue"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="fab-priority">Priority</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low - General Inquiry</SelectItem>
                                    <SelectItem value="medium">Medium - Product Issue</SelectItem>
                                    <SelectItem value="high">High - Payment/Order</SelectItem>
                                    <SelectItem value="urgent">Urgent - Security/Account</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="fab-message">Message</Label>
                            <Textarea
                                id="fab-message"
                                placeholder="Describe your issue..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateTicket} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                            {loading ? "Starting..." : "Start Chat"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Actual Chat Dialog */}
            {activeTicket && (
                <ChatDialog
                    open={chatOpen}
                    onOpenChange={setChatOpen}
                    conversationId={activeTicket.conversation_id}
                    shopName="Customer Support"
                    productName={`Ticket #${activeTicket.id.substring(0, 8)}: ${activeTicket.subject}`}
                />
            )}
        </>
    )
}
