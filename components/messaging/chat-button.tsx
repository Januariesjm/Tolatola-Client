"use client"

import { useState } from "react"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatDialog } from "./chat-dialog"
import { getOrCreateConversation } from "@/app/actions/messaging"
import { toast } from "@/hooks/use-toast"

interface ChatButtonProps {
  shopId?: string
  shopName?: string
  productId?: string
  productName?: string
  receiverId?: string
  orderId?: string
}

export function ChatButton({ shopId, shopName, productId, productName, receiverId, orderId }: ChatButtonProps) {
  const [open, setOpen] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleOpenChat = async () => {
    setLoading(true)
    const result = await getOrCreateConversation(shopId, productId, receiverId, orderId)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else if (result.conversation) {
      setConversationId(result.conversation.id)
      setOpen(true)
    }
    setLoading(false)
  }

  return (
    <>
      <Button
        onClick={handleOpenChat}
        disabled={loading}
        variant="outline"
        size="lg"
        className="w-full sm:w-auto bg-transparent"
      >
        <MessageSquare className="mr-2 h-5 w-5" />
        {loading ? "Loading..." : "Chat with Seller"}
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
