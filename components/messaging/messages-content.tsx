"use client"

import { useEffect, useState } from "react"
import { MessageSquare } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getUserConversations } from "@/app/actions/messaging"
import { ChatDialog } from "./chat-dialog"
import { createClient } from "@/lib/supabase/client"

interface Conversation {
  id: string
  last_message: string | null
  last_message_at: string | null
  customer: { id: string; full_name: string; profile_image_url?: string }
  vendor: { id: string; full_name: string; profile_image_url?: string }
  shop: { id: string; name: string; logo_url?: string; phone?: string }
}

export function MessagesContent() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [selectedShopName, setSelectedShopName] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadConversations()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id)
    })

    // Subscribe to new messages
    const channel = supabase
      .channel("conversations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
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

  const loadConversations = async () => {
    setLoading(true)
    const result = await getUserConversations()
    if (result.conversations) {
      setConversations(result.conversations)
    }
    setLoading(false)
  }

  const handleOpenChat = (conversation: Conversation) => {
    setSelectedConversation(conversation.id)
    setSelectedShopName(conversation.shop.name)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Messages</h1>
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>

        {conversations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
              <p className="text-muted-foreground text-center">Start chatting with sellers from product pages</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => {
              const isCustomer = conversation.customer.id === currentUserId
              const otherUser = isCustomer ? conversation.vendor : conversation.customer

              return (
                <Card
                  key={conversation.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleOpenChat(conversation)}
                >
                  <CardContent className="flex items-start gap-4 p-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conversation.shop.logo_url || otherUser.profile_image_url} />
                      <AvatarFallback>
                        {conversation.shop.name?.charAt(0) || otherUser.full_name?.charAt(0) || "S"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate">{conversation.shop.name}</h3>
                        {conversation.last_message_at && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(conversation.last_message_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.last_message || "Start a conversation"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {selectedConversation && (
          <ChatDialog
            open={!!selectedConversation}
            onOpenChange={(open) => !open && setSelectedConversation(null)}
            conversationId={selectedConversation}
            shopName={selectedShopName}
          />
        )}
      </div>
    </div>
  )
}
