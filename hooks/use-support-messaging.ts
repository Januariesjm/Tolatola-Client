"use client"

import type React from "react"

import { useState } from "react"
import { sendMessage as sendLiveMessage, uploadChatFile } from "@/app/actions/messaging"
import { toast } from "@/hooks/use-toast"
import { logger, normalizeError } from "@/lib/logger"
import { buildSelectedAttachment, validateChatAttachment } from "@/lib/support/attachment"
import { buildSupportEndpoints } from "@/lib/support/support-endpoints"
import {
  chatTimestamp,
  createBotMessage,
  replaceMessage,
  toAiChatHistory,
  type AiChatRequestBody,
  type AiChatResponse,
  type ChatMessage,
  type EscalationResponse,
  type SelectedAttachment,
  type SupportTicket,
} from "@/lib/support/chat-message"

const log = logger.child("support.messaging")

/** Longest a message can be before it stops being usable as a ticket subject. */
const SUBJECT_MAX_LENGTH = 45

interface UseSupportMessagingOptions {
  messages: ChatMessage[]
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  /** Relays a just-sent message to the live channel; no-op without one. */
  broadcastMessage: (payload: unknown) => boolean
  liveConversationId: string | null
  setLiveConversationId: (id: string | null) => void
  activeTicket: SupportTicket | null
  setActiveTicket: (ticket: SupportTicket | null) => void
  userToken: string | null
  /** Resets the idle timer; the buyer typing counts as presence. */
  registerActivity: () => void
}

/**
 * Composer state and the two outbound flows: sending a message and escalating to
 * a human.
 *
 * Extracted from components/support/floating-support-widget.tsx, where
 * handleFileSelect, handleSendMessage and handleEscalateToHuman together were
 * ~200 lines inside the component body. Two behaviours are load-bearing and were
 * hard to see there:
 *
 *   - Once `liveConversationId` is set the AI is out of the loop entirely.
 *     handleSendMessage posts to the live conversation and returns before the
 *     AI branch, so a buyer talking to a human never gets bot replies mixed in.
 *   - A failed Supabase Storage upload is not fatal. The local data URL is used
 *     as the attachment instead, so the buyer still sees their file and the
 *     agent still gets something to look at.
 *
 * The `console.log` debug tracing that ran on every escalation is now logger
 * calls at debug level.
 */
export function useSupportMessaging({
  messages,
  setMessages,
  broadcastMessage,
  liveConversationId,
  setLiveConversationId,
  activeTicket,
  setActiveTicket,
  userToken,
  registerActivity,
}: UseSupportMessagingOptions) {
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isEscalating, setIsEscalating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedAttachment, setSelectedAttachment] = useState<SelectedAttachment | null>(null)

  const appendMessage = (message: ChatMessage) => setMessages((prev) => [...prev, message])

  /** Validates the picked file and stages it, or explains why it was rejected. */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const file = input.files?.[0]
    if (!file) return

    const validation = validateChatAttachment(file)
    if (!validation.ok) {
      toast({ ...validation.error, variant: "destructive" })
      input.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setSelectedAttachment(buildSelectedAttachment(file, reader.result as string, validation.isPdf))
    }
    reader.readAsDataURL(file)

    // Cleared so picking the same file twice in a row still fires onChange.
    input.value = ""
  }

  /**
   * Uploads the staged file to storage, falling back to its local data URL.
   *
   * Returns the URL and content type to attach to the outgoing message.
   */
  const resolveAttachmentUrl = async (attachment: SelectedAttachment | null) => {
    let url = attachment?.previewUrl
    let type = attachment?.mimeType

    if (!attachment?.file) return { url, type }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", attachment.file)
      const uploadRes = await uploadChatFile(formData)
      if (uploadRes.url) {
        url = uploadRes.url
        type = uploadRes.type || attachment.mimeType
      }
    } catch (err) {
      // Non-fatal: the data URL still renders and still reaches the agent.
      log.warn("chat file upload failed, using local preview", err)
    } finally {
      setIsUploading(false)
    }

    return { url, type }
  }

  /** Asks the AI endpoint for a reply, trying each fallback URL in turn. */
  const requestAiReply = async (body: AiChatRequestBody): Promise<AiChatResponse | null> => {
    for (const url of buildSupportEndpoints("ai-chat")) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(userToken ? { Authorization: `Bearer ${userToken}` } : {}),
          },
          body: JSON.stringify(body),
        })
        if (res.ok) return await res.json()
      } catch (err) {
        log.debug("ai-chat endpoint unreachable, trying next", { url })
      }
    }
    return null
  }

  const handleSendMessage = async (customText?: string) => {
    const text = (customText || inputText).trim()
    if (!text && !selectedAttachment) return

    registerActivity()

    const attachment = selectedAttachment
    const { url: attachmentUrl, type: attachmentType } = await resolveAttachmentUrl(attachment)

    const userMsgText = text || (attachment ? `Attached document: ${attachment.name}` : "")
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: userMsgText,
      timestamp: chatTimestamp(),
      attachmentUrl,
      attachmentType,
      attachmentName: attachment?.name,
    }

    appendMessage(userMsg)
    if (!customText) setInputText("")
    setSelectedAttachment(null)

    // Talking to a human: the AI stays out of it.
    if (liveConversationId) {
      try {
        const result = await sendLiveMessage(liveConversationId, userMsgText, attachmentUrl, attachmentType, userToken ? "user" : "guest")
        if (result.message) {
          broadcastMessage(result.message)
        }
      } catch (err) {
        log.error("error sending live message", err)
      }
      return
    }

    setIsTyping(true)

    try {
      const requestBody: AiChatRequestBody = {
        message: userMsgText,
        history: toAiChatHistory(messages),
        attachmentUrl,
        attachmentType,
      }

      if (attachment) {
        requestBody.attachment = {
          data: attachment.base64Data,
          mimeType: attachment.mimeType,
          filename: attachment.name,
          url: attachmentUrl,
        }
      }

      const data = await requestAiReply(requestBody)
      if (!data?.response) throw new Error("Invalid AI response")

      appendMessage(
        createBotMessage(`${Date.now() + 1}`, data.response, {
          showEscalationOption: data.needs_human,
        }),
      )

      if (data.ticket) setActiveTicket(data.ticket)

      // The AI can open a human conversation on its own; adopt it so subsequent
      // messages go to the agent rather than back to the AI.
      const convId = data.conversation?.id || data.ticket?.conversation_id
      if (convId) {
        log.debug("live conversation established by ai-chat", { conversationId: convId })
        setLiveConversationId(convId)
      }
    } catch (err) {
      log.warn("ai-chat failed, offering escalation", err)
      appendMessage(
        createBotMessage(
          `${Date.now() + 1}`,
          "I couldn't quite process that attachment or message. Would you like me to connect you directly with human support?",
          { showEscalationOption: true },
        ),
      )
    } finally {
      setIsTyping(false)
      registerActivity()
    }
  }

  /** Creates a support ticket, trying each fallback URL in turn. */
  const requestEscalation = async (subject: string, body: string): Promise<EscalationResponse | null> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (userToken) headers["Authorization"] = `Bearer ${userToken}`

    for (const url of buildSupportEndpoints("tickets")) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({
            subject,
            message: body,
            priority: "medium",
            guestName: "Guest User",
            guestEmail: "guest@tola.co",
            history: toAiChatHistory(messages),
          }),
        })
        if (res.ok) return await res.json()
      } catch (err) {
        log.warn("support escalation endpoint failed", err, { url })
      }
    }
    return null
  }

  const handleEscalateToHuman = async () => {
    registerActivity()

    // Already connected: confirm rather than opening a second ticket.
    if (liveConversationId && activeTicket) {
      appendMessage(
        createBotMessage(
          `connected-${Date.now()}`,
          `✅ Connected to Tola Human Support!\n\nTicket #${activeTicket.id.substring(0, 8)} is active. A support agent will review your chat and respond shortly.\n\nYou can continue typing your messages here — the support team will see them in real-time.`,
        ),
      )
      return
    }

    setIsEscalating(true)

    const connectingMsg = createBotMessage(`connecting-${Date.now()}`, "🔄 Connecting you to an available support agent... Please wait.")
    appendMessage(connectingMsg)

    try {
      const lastUserMsg = [...messages].reverse().find((m) => m.sender === "user")
      const subject = lastUserMsg ? lastUserMsg.text.slice(0, SUBJECT_MAX_LENGTH) : "General Support Request"
      const transcript = messages.map((m) => `${m.sender.toUpperCase()}: ${m.text}`).join("\n")

      const result = await requestEscalation(subject, transcript)

      if (!result || (!result.ticket && !result.id)) {
        throw new Error("Could not connect to support service. Please try again.")
      }

      const ticket: Partial<SupportTicket> = result.ticket || result
      const convId = result.conversation?.id || ticket.conversation_id

      setActiveTicket({ ...ticket, id: ticket.id ?? "", conversation_id: convId })
      if (convId) setLiveConversationId(convId)

      setMessages((prev) =>
        replaceMessage(
          prev,
          connectingMsg.id,
          createBotMessage(
            `connected-${Date.now()}`,
            `✅ Connected to Tola Human Support!\n\nTicket #${(ticket.id ?? "").substring(0, 8)} has been created and assigned to our support team. A support agent will review your chat and respond shortly.\n\nYou can continue typing your messages here — the support team will see them in real-time.`,
          ),
        ),
      )
    } catch (err) {
      log.error("failed to escalate to human support", err)
      setMessages((prev) =>
        replaceMessage(
          prev,
          connectingMsg.id,
          createBotMessage(
            `error-${Date.now()}`,
            `❌ Failed to connect to human support: ${normalizeError(err).message || "Unknown error"}. Please try again.`,
            {
              showEscalationOption: true,
            },
          ),
        ),
      )
    } finally {
      setIsEscalating(false)
      registerActivity()
    }
  }

  /** Clears composer state when the session ends. */
  const resetComposer = () => {
    setInputText("")
    setSelectedAttachment(null)
  }

  return {
    inputText,
    setInputText,
    isTyping,
    isEscalating,
    isUploading,
    selectedAttachment,
    setSelectedAttachment,
    handleFileSelect,
    handleSendMessage,
    handleEscalateToHuman,
    resetComposer,
  }
}
