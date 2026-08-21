"use client"

import { Button } from "@/components/ui/button"
import { ExternalLink, FileText, Headphones, LogOut, RefreshCw } from "lucide-react"
import { SUPPORT_AGENT_AVATAR, SUPPORT_AGENT_NAME } from "@/lib/support/agent-profile"
import type { ChatMessage } from "@/lib/support/chat-message"

interface SupportMessageBubbleProps {
  message: ChatMessage
  /** Hides the escalation button once a human is already on the conversation. */
  isLiveConversation: boolean
  isEscalating: boolean
  onEscalate: () => void
  /** True while the idle prompt is live; gates the countdown actions. */
  inactivityPromptActive: boolean
  secondsRemaining: number
  onContinueSession: () => void
  onEndSession: () => void
}

/** Renders an image attachment inline, or a PDF as a download row. */
function MessageAttachment({ message }: { message: ChatMessage }) {
  if (!message.attachmentUrl) return null

  // Data URLs are checked too: a locally-previewed image has no attachmentType
  // until the upload resolves, and would otherwise render as a PDF row.
  const isImage = message.attachmentType?.startsWith("image/") || message.attachmentUrl.startsWith("data:image/")

  if (isImage) {
    return (
      <div className="my-1">
        <div className="relative overflow-hidden rounded-xl border border-white/20 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={message.attachmentUrl}
            alt="User Attachment"
            className="max-h-48 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => window.open(message.attachmentUrl, "_blank")}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="my-1">
      <a
        href={message.attachmentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors ${
          message.sender === "user"
            ? "bg-blue-700/60 border-blue-500 text-white hover:bg-blue-700"
            : "bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-900 hover:bg-slate-200"
        }`}
      >
        <div className="h-8 w-8 rounded-lg bg-red-500/20 text-red-600 flex items-center justify-center shrink-0">
          <FileText className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-xs font-bold">{message.attachmentName || "PDF Document"}</p>
          <p className={`text-[10px] ${message.sender === "user" ? "text-blue-200" : "text-slate-500"}`}>Click to view / download PDF</p>
        </div>
        <ExternalLink className="h-3.5 w-3.5 opacity-70" />
      </a>
    </div>
  )
}

/** Bubble background per sender: buyer, live agent, or bot. */
function bubbleClasses(sender: ChatMessage["sender"]): string {
  if (sender === "user") return "bg-blue-600 text-white rounded-tr-none"
  if (sender === "agent") return "bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-sm rounded-tl-none"
  return "bg-white text-slate-900 border border-slate-200/80 shadow-sm rounded-tl-none"
}

function timestampClasses(sender: ChatMessage["sender"]): string {
  if (sender === "user") return "text-blue-100 text-right"
  if (sender === "agent") return "text-emerald-500"
  return "text-slate-400"
}

/**
 * One transcript entry: avatar, attachment, text, timestamp, and whichever
 * inline action the message carries.
 *
 * Split out of components/support/floating-support-widget.tsx, where this was
 * ~120 lines inside the messages `.map()`, including the attachment branch and
 * both action blocks.
 */
export function SupportMessageBubble({
  message,
  isLiveConversation,
  isEscalating,
  onEscalate,
  inactivityPromptActive,
  secondsRemaining,
  onContinueSession,
  onEndSession,
}: SupportMessageBubbleProps) {
  return (
    <div className={`flex gap-2 max-w-[85%] ${message.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
      {message.sender !== "user" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={SUPPORT_AGENT_AVATAR}
          alt={message.sender === "agent" ? "Support Agent" : SUPPORT_AGENT_NAME}
          className="h-7 w-7 rounded-full object-cover border border-slate-200 mt-1"
        />
      )}
      <div className={`p-3 rounded-2xl space-y-2 ${bubbleClasses(message.sender)}`}>
        {message.sender === "agent" && (
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Support Agent</span>
        )}

        <MessageAttachment message={message} />

        <p className="leading-relaxed whitespace-pre-wrap">{message.text}</p>
        <span className={`text-[10px] block ${timestampClasses(message.sender)}`}>{message.timestamp}</span>

        {message.showEscalationOption && !isLiveConversation && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onEscalate()
            }}
            disabled={isEscalating}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-colors cursor-pointer shadow-md"
          >
            <Headphones className="h-3.5 w-3.5" />
            {isEscalating ? "Connecting to Support..." : "Connect to Human Support"}
          </button>
        )}

        {message.showInactivityPrompt && inactivityPromptActive && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <p className="text-xs font-bold text-amber-700">
              Ending automatically in {Math.floor(secondsRemaining / 60)}m {secondsRemaining % 60}s...
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                onClick={onContinueSession}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1 rounded-lg"
              >
                <RefreshCw className="h-3 w-3" /> Continue
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onEndSession}
                className="border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold gap-1 rounded-lg"
              >
                <LogOut className="h-3 w-3" /> End Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
