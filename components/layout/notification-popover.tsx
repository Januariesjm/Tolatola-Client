"use client"

import { useEffect, useState } from "react"
import { Bell, MessageSquare } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getUserConversations } from "@/app/actions/messaging"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

export function NotificationPopover() {
    const [conversations, setConversations] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const supabase = createClient()

    const loadConversations = async () => {
        const result = await getUserConversations()
        if (result.conversations) {
            setConversations(result.conversations)
            // For now, we simulate unread count based on conversations with no last_message_at or just some logic
            // Ideally, the backend would return an unread count per conversation
            const count = result.conversations.filter((c: any) => c.unread_count > 0).length
            setUnreadCount(count)
        }
    }

    useEffect(() => {
        loadConversations()

        // Subscribe to new messages for any conversation the user is part of
        const channel = supabase
            .channel("global_notifications")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                },
                () => {
                    loadConversations()
                },
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground">
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-2 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && <span className="text-xs text-muted-foreground">{unreadCount} unread</span>}
                </div>
                <ScrollArea className="h-80">
                    {conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-8 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {conversations.map((conv) => (
                                <Link
                                    key={conv.id}
                                    href="/messages"
                                    className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors border-b last:border-0"
                                >
                                    <Avatar className="h-10 w-10 flex-shrink-0">
                                        <AvatarImage src={conv.shop?.logo_url || conv.customer?.profile_image_url || ""} />
                                        <AvatarFallback>{(conv.shop?.name || conv.customer?.full_name || "U").charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-medium truncate">{conv.shop?.name || conv.customer?.full_name || conv.vendor?.full_name || "Chat"}</p>
                                            {conv.unread_count > 0 && <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {conv.last_message || "New conversation started"}
                                        </p>
                                        <span className="text-[10px] text-muted-foreground mt-1 block">
                                            {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString() : "Just now"}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-2 border-t text-center">
                    <Link href="/messages">
                        <Button variant="ghost" size="sm" className="w-full text-xs">
                            View all messages
                        </Button>
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    )
}
