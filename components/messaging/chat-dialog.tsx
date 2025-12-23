"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Phone, Video, Send } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getConversationMessages, sendMessage, markMessagesAsRead } from "@/app/actions/messaging"
import { toast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { CallDialog } from "./call-dialog"

interface ChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId: string
  shopName: string
  productName?: string
}

interface Message {
  id: string
  message: string
  created_at: string
  sender_id: string
  sender: {
    id: string
    full_name: string
    profile_image_url?: string
  }
}

export function ChatDialog({ open, onOpenChange, conversationId, shopName, productName }: ChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [callDialogOpen, setCallDialogOpen] = useState(false)
  const [callType, setCallType] = useState<"voice" | "video">("voice")
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Load messages
  useEffect(() => {
    if (open && conversationId) {
      loadMessages()
      markMessagesAsRead(conversationId)

      // Get current user
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) setCurrentUserId(user.id)
      })

      // Subscribe to new messages
      const channel = supabase
        .channel(`conversation:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            loadMessages()
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [open, conversationId])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const loadMessages = async () => {
    const result = await getConversationMessages(conversationId)
    if (result.messages) {
      setMessages(result.messages)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSending(true)
    const result = await sendMessage(conversationId, newMessage.trim())

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      setNewMessage("")
    }
    setSending(false)
  }

  const handleCall = (type: "voice" | "video") => {
    setCallType(type)
    setCallDialogOpen(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{shopName}</DialogTitle>
                {productName && <p className="text-sm text-muted-foreground">{productName}</p>}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleCall("voice")}>
                  <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleCall("video")}>
                  <Video className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6" ref={scrollRef}>
            <div className="space-y-4 py-4">
              {messages.map((msg) => {
                const isOwnMessage = msg.sender_id === currentUserId
                return (
                  <div key={msg.id} className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={msg.sender.profile_image_url || "/placeholder.svg"} />
                      <AvatarFallback>{msg.sender.full_name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col ${isOwnMessage ? "items-end" : ""}`}>
                      <div
                        className={`rounded-lg px-4 py-2 max-w-[300px] ${
                          isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>

          <form onSubmit={handleSendMessage} className="border-t px-6 py-4">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={sending}
              />
              <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <CallDialog
        open={callDialogOpen}
        onOpenChange={setCallDialogOpen}
        conversationId={conversationId}
        callType={callType}
        shopName={shopName}
      />
    </>
  )
}
