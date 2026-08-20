"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Phone, Video, Send, Paperclip, ImageIcon, FileIcon, Loader2, ArrowDown, Bot, User, Headset, CheckCheck } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getConversationMessages, sendMessage, markMessagesAsRead, uploadChatFile } from "@/app/actions/messaging"
import { toast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { CallDialog } from "./call-dialog"
import { logger } from "@/lib/logger"

const log = logger.child("messaging.chat-dialog")

interface ChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId: string
  shopName: string
  productName?: string
  ticketDescription?: string
  isAdminView?: boolean
}

interface Message {
  id: string
  message: string
  attachment_url?: string
  attachment_type?: string
  created_at: string
  sender_id: string
  sender_type?: string
  sender: {
    id: string
    full_name: string
    profile_image_url?: string
  }
}

function parseHistoryText(text?: string): Message[] {
  if (!text || !text.trim()) return []

  const cleanText = text.replace(/^Escalated from Moureen Tyler AI Chat:\s*/i, "").trim()

  // Match prefixes like BOT:, USER:, GUEST:, AGENT:
  const prefixRegex = /(?:^|\n|\s)(BOT|USER|GUEST|AGENT):\s*/gi
  const matches: Array<{ tag: string; index: number; contentStart: number }> = []

  let match: RegExpExecArray | null
  while ((match = prefixRegex.exec(cleanText)) !== null) {
    matches.push({
      tag: match[1].toUpperCase(),
      index: match.index,
      contentStart: match.index + match[0].length,
    })
  }

  if (matches.length === 0) {
    return [
      {
        id: "hist-0",
        message: cleanText,
        created_at: new Date().toISOString(),
        sender_id: "",
        sender_type: "user",
        sender: { id: "", full_name: "Customer User" },
      },
    ]
  }

  const result: Message[] = []
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i]
    const nextIndex = i < matches.length - 1 ? matches[i + 1].index : cleanText.length
    const content = cleanText.slice(current.contentStart, nextIndex).trim()

    if (!content) continue

    const isBot = current.tag === "BOT"
    const isAgent = current.tag === "AGENT"
    const senderType = isBot ? "bot" : isAgent ? "agent" : "user"

    result.push({
      id: `parsed-${i}-${Date.now()}`,
      message: content,
      created_at: new Date(Date.now() - (matches.length - i) * 60000).toISOString(),
      sender_id: isBot ? "" : isAgent ? "agent" : "user",
      sender_type: senderType,
      sender: {
        id: isBot ? "" : isAgent ? "agent" : "user",
        full_name: isBot ? "Moureen Tyler (AI Agent)" : isAgent ? "Support Agent" : "Customer User",
      },
    })
  }

  return result
}

export function ChatDialog({
  open,
  onOpenChange,
  conversationId,
  shopName,
  productName,
  ticketDescription,
  isAdminView = false,
}: ChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [callDialogOpen, setCallDialogOpen] = useState(false)
  const [callType, setCallType] = useState<"voice" | "video">("voice")
  const [showScrollBottom, setShowScrollBottom] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const channelRef = useRef<any>(null)
  const supabase = createClient()

  // Auto-scroll to the bottom of the message list
  const scrollToBottom = (smooth = true) => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto" })
      }
      if (scrollRef.current) {
        const scrollElement = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]")
        if (scrollElement) {
          scrollElement.scrollTop = scrollElement.scrollHeight
        }
      }
    }, 60)
  }

  const loadMessages = async () => {
    if (!conversationId) return
    console.log("[ChatDialog] Loading messages for:", conversationId)
    const result = await getConversationMessages(conversationId)
    if (result.error) {
      log.error("error loading messages", result.error)
    }
    if (result.messages) {
      console.log(`[ChatDialog] Loaded ${result.messages.length} messages`)
      setMessages(result.messages)
      scrollToBottom(false)
    }
  }

  // Load messages & setup realtime listener
  useEffect(() => {
    if (open && conversationId) {
      console.log("[ChatDialog] Initializing for conversation:", conversationId)
      loadMessages()
      markMessagesAsRead(conversationId)

      // Get current user
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          console.log("[ChatDialog] Current user:", user.id)
          setCurrentUserId(user.id)
        }
      })

      // Subscribe to new messages on conversation channel
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
            console.log("[ChatDialog] Postgres Realtime message received:", payload)
            loadMessages()
          },
        )
        .on("broadcast", { event: "message" }, (payload: any) => {
          console.log("[ChatDialog] Broadcast message received:", payload)
          const newMsg = payload.payload
          if (newMsg) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
            scrollToBottom()
          }
        })
        .subscribe((status) => {
          console.log(`[ChatDialog] Realtime status for ${conversationId}:`, status)
        })

      channelRef.current = channel

      return () => {
        console.log("[ChatDialog] Cleaning up subscription for:", conversationId)
        supabase.removeChannel(channel)
        channelRef.current = null
      }
    }
  }, [open, conversationId])

  // Scroll to bottom when messages list updates
  useEffect(() => {
    scrollToBottom()
  }, [messages.length])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    const result = await uploadChatFile(formData)

    if (result.error) {
      toast({
        title: "Upload Failed",
        description: result.error,
        variant: "destructive",
      })
    } else if (result.url) {
      // Send message with attachment as agent
      const sendResult = await sendMessage(conversationId, "", result.url, result.type, "agent")
      if (sendResult.error) {
        toast({
          title: "Error",
          description: sendResult.error,
          variant: "destructive",
        })
      } else if (sendResult.message) {
        // Broadcast the message
        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "message",
            payload: sendResult.message,
          })
        }
        // Locally append to keep UI instantaneous
        setMessages((prev) => {
          if (prev.some((m) => m.id === sendResult.message.id)) return prev
          return [...prev, sendResult.message]
        })
        scrollToBottom()
      }
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSending(true)
    const result = await sendMessage(conversationId, newMessage.trim(), undefined, undefined, "agent")

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else if (result.message) {
      setNewMessage("")
      // Broadcast the message
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "message",
          payload: result.message,
        })
      }
      // Locally append to keep UI instantaneous
      setMessages((prev) => {
        if (prev.some((m) => m.id === result.message.id)) return prev
        return [...prev, result.message]
      })
      scrollToBottom()
    }
    setSending(false)
  }

  const handleCall = (type: "voice" | "video") => {
    setCallType(type)
    setCallDialogOpen(true)
  }

  const parsedHistory = parseHistoryText(ticketDescription)
  const displayMessages = (() => {
    if (parsedHistory.length === 0) return messages
    if (messages.length === 0) return parsedHistory

    const missingHistory = parsedHistory.filter((h) => !messages.some((m) => m.message.trim() === h.message.trim() || m.id === h.id))
    return [...missingHistory, ...messages]
  })()

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[540px] w-[calc(100vw-32px)] h-[min(650px,calc(100vh-80px))] !flex !flex-col p-0 overflow-hidden shadow-2xl border-slate-800 rounded-xl">
          {/* Header */}
          <DialogHeader className="px-6 py-3.5 bg-slate-900 text-white dark:bg-slate-950 border-b border-slate-800 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10 border border-emerald-500/40 shadow-sm">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-emerald-600 text-white font-bold">{shopName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-base font-semibold text-white">{shopName}</DialogTitle>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] px-1.5 py-0.5">
                      Live Support
                    </Badge>
                  </div>
                  <DialogDescription className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                    {productName || `Customer Support Live Chat`}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="hidden sm:inline-flex text-[11px] text-slate-300 border-slate-700 bg-slate-800/80 mr-1">
                  {displayMessages.length} {displayMessages.length === 1 ? "msg" : "msgs"}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800"
                  onClick={() => handleCall("voice")}
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800"
                  onClick={() => handleCall("video")}
                >
                  <Video className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Messages Area */}
          <div className="relative flex-1 min-h-0 bg-slate-50/70 dark:bg-slate-900/60">
            <ScrollArea className="h-full px-6" ref={scrollRef}>
              <div className="space-y-4 py-4">
                {displayMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                    <Headset className="h-10 w-10 mb-2 opacity-50 text-emerald-500" />
                    <p className="text-sm font-medium">No messages yet</p>
                    <p className="text-xs text-slate-400">Start typing below to reply to the user.</p>
                  </div>
                ) : (
                  displayMessages.map((msg) => {
                    if (!msg) return null
                    const isBot = msg.sender_type === "bot"
                    const isAgent = msg.sender_type === "agent" || (!isBot && msg.sender_id === currentUserId && isAdminView)
                    const isSelf = msg.sender_id === currentUserId

                    let alignRight = false
                    let senderName = "User"
                    let avatarIcon = <User className="h-4 w-4" />
                    let avatarBg = "bg-slate-200 text-slate-700 font-bold"
                    let badgeComponent = null
                    let bubbleStyle = ""

                    if (isBot) {
                      alignRight = false
                      senderName = "Moureen Tyler (AI Agent)"
                      avatarIcon = <Bot className="h-4 w-4" />
                      avatarBg = "bg-amber-500 text-white"
                      badgeComponent = (
                        <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] px-1 py-0 h-4 border-amber-300/40">
                          AI Assistant
                        </Badge>
                      )
                      bubbleStyle =
                        "bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-500/5 text-amber-950 dark:text-amber-100 border border-amber-300/60 dark:border-amber-700/50 rounded-tl-xs"
                    } else if (isAgent) {
                      alignRight = false
                      senderName = isSelf ? "You (Support Agent)" : msg.sender?.full_name || "Support Agent"
                      avatarIcon = <Headset className="h-4 w-4" />
                      avatarBg = "bg-blue-600 text-white"
                      badgeComponent = (
                        <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[9px] px-1 py-0 h-4 border-blue-300/40">
                          Support Agent
                        </Badge>
                      )
                      bubbleStyle =
                        "bg-blue-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-blue-200/80 dark:border-slate-700/70 rounded-tl-xs"
                    } else {
                      // Customer / User message
                      alignRight = true
                      senderName = isSelf && !isAdminView ? "You" : msg.sender?.full_name || shopName || "Customer User"
                      avatarIcon = <User className="h-4 w-4" />
                      avatarBg = "bg-emerald-600 text-white"
                      badgeComponent = isAdminView ? (
                        <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] px-1 py-0 h-4 border-emerald-300/40">
                          Customer
                        </Badge>
                      ) : null
                      bubbleStyle = "bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-tr-xs"
                    }

                    return (
                      <div key={msg.id} className={`flex gap-3 ${alignRight ? "flex-row-reverse" : "flex-row"}`}>
                        <Avatar className="h-8 w-8 mt-1 shrink-0 border shadow-xs">
                          <AvatarImage
                            src={
                              isBot
                                ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80"
                                : msg.sender?.profile_image_url || "/placeholder.svg"
                            }
                          />
                          <AvatarFallback className={avatarBg}>{avatarIcon}</AvatarFallback>
                        </Avatar>
                        <div className={`flex flex-col max-w-[78%] ${alignRight ? "items-end" : "items-start"}`}>
                          <div className="flex items-center gap-1.5 mb-1 px-0.5">
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{senderName}</span>
                            {badgeComponent}
                          </div>

                          {/* Speech Bubble */}
                          <div className={`rounded-2xl px-4 py-2.5 shadow-sm text-sm ${bubbleStyle}`}>
                            {msg.attachment_url && (
                              <div className="mb-2">
                                {msg.attachment_type?.startsWith("image/") ? (
                                  <img
                                    src={msg.attachment_url}
                                    alt="Attachment"
                                    className="rounded-lg max-w-full max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity border"
                                    onClick={() => window.open(msg.attachment_url, "_blank")}
                                  />
                                ) : (
                                  <a
                                    href={msg.attachment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 underline text-xs font-medium bg-slate-900/10 dark:bg-slate-100/10 p-2 rounded-md"
                                  >
                                    <FileIcon className="h-4 w-4 shrink-0" />
                                    View File Attachment
                                  </a>
                                )}
                              </div>
                            )}
                            {msg.message && <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>}
                          </div>

                          <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-slate-400">
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {alignRight && <CheckCheck className="h-3 w-3 text-emerald-500" />}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                {/* Scroll Target */}
                <div ref={messagesEndRef} className="h-1" />
              </div>
            </ScrollArea>
          </div>

          {/* Form Input Footer */}
          <form
            onSubmit={handleSendMessage}
            className="border-t border-slate-200 dark:border-slate-800 px-4 py-3 bg-white dark:bg-slate-950 shrink-0"
          >
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || uploading}
                title="Attach file"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </Button>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message to reply..."
                className="flex-1 bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 text-sm h-10"
                disabled={sending || uploading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
              />
              <Button
                type="button"
                size="icon"
                onClick={(e) => {
                  e.preventDefault()
                  handleSendMessage(e)
                }}
                disabled={sending || uploading || !newMessage.trim()}
                className="h-10 w-10 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-sm"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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
