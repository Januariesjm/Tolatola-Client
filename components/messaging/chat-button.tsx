"use client"

import { useState } from "react"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatDialog } from "./chat-dialog"
import { getOrCreateConversation } from "@/app/actions/messaging"
import { toast } from "@/hooks/use-toast"
import { logger } from "@/lib/logger"

const log = logger.child("messaging.chat-button")

interface ChatButtonProps {
  shopId?: string
  shopName?: string
  productId?: string
  productName?: string
  receiverId?: string
  orderId?: string
  label?: string
}

export function ChatButton({ shopId, shopName, productId, productName, receiverId, orderId, label }: ChatButtonProps) {
  const [open, setOpen] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleOpenChat = async () => {
    log.debug("handleOpenChat clicked", { shopId, productId, productName, receiverId, orderId })
    setLoading(true)
    try {
      const result = await getOrCreateConversation(shopId, productId, receiverId, orderId)
      log.debug("getOrCreateConversation result", { result })

      if (result.error) {
        log.error("error in getOrCreateConversation", result.error)
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else if (result.conversation) {
        log.debug("opening chat dialog for conversation", { conversationId: result.conversation.id })
        setConversationId(result.conversation.id)
        setOpen(true)
      } else {
        log.warn("no error but no conversation returned")
      }
    } catch (err: any) {
      log.error("panic in handleOpenChat", err)
      toast({
        title: "Unexpected Error",
        description: err.message || "Failed to open chat",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={handleOpenChat} disabled={loading} variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
        <MessageSquare className="mr-2 h-5 w-5" />
        {loading ? "Loading..." : label || "Chat with Seller"}
      </Button>

      {conversationId && (
        <ChatDialog
          open={open}
          onOpenChange={setOpen}
          conversationId={conversationId}
          shopName={shopName || "Seller"}
          productName={productName}
        />
      )}
    </>
  )
}
