"use client"

import { Minus, X } from "lucide-react"
import { SUPPORT_AGENT_AVATAR, SUPPORT_AGENT_NAME, SUPPORT_AGENT_ROLE } from "@/lib/support/agent-profile"
import type { SupportTicket } from "@/lib/support/chat-message"

interface SupportChatHeaderProps {
  onClose: () => void
  /** Set once a human agent is on the conversation; shows the live banner. */
  liveConversationId: string | null
  activeTicket: SupportTicket | null
}

/**
 * Widget header: agent identity, the minimise/close controls, and the live
 * support banner.
 *
 * Split out of components/support/floating-support-widget.tsx. Minimise and
 * close both just hide the pane -- the conversation is kept, so reopening
 * resumes it. Ending a session for real is the "End Chat" action on the idle
 * prompt.
 */
export function SupportChatHeader({ onClose, liveConversationId, activeTicket }: SupportChatHeaderProps) {
  const stopAndClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
  }

  return (
    <>
      <div className="bg-[#e6d7b8] px-4 pt-3 pb-4 flex flex-col items-center relative text-stone-900 border-b border-amber-200/60 shadow-sm">
        <button
          type="button"
          onClick={stopAndClose}
          className="absolute top-3 left-3 flex items-center gap-1 text-xs font-semibold text-stone-700 bg-amber-200/60 hover:bg-amber-300/80 px-2.5 py-1 rounded-full transition-colors z-10"
          aria-label="Minimize chat window"
        >
          <Minus className="h-3.5 w-3.5" />
          <span>Minimize</span>
        </button>

        <button
          type="button"
          onClick={stopAndClose}
          className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center rounded-full bg-stone-900/10 hover:bg-red-600 hover:text-white text-stone-900 shadow-sm transition-all duration-150 active:scale-90 z-10"
          title="Close Chat Window"
          aria-label="Close support chat pane"
        >
          <X className="h-5 w-5 stroke-[2.5]" />
        </button>

        <div className="relative mt-1">
          <div className="h-16 w-16 rounded-full border-3 border-white bg-white shadow-md overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SUPPORT_AGENT_AVATAR} alt={`${SUPPORT_AGENT_NAME} Avatar`} className="h-full w-full object-cover" />
          </div>
          <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
        </div>

        <h3 className="font-bold text-base mt-1.5 text-stone-900">Hello, I'm {SUPPORT_AGENT_NAME}</h3>
        <p className="text-[11px] font-semibold text-stone-700">{SUPPORT_AGENT_ROLE}</p>
      </div>

      {liveConversationId && activeTicket && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-emerald-800 truncate">Connected to Live Support</p>
            <p className="text-[10px] text-emerald-600">Ticket #{activeTicket.id?.substring(0, 8)} · Messages sync in real-time</p>
          </div>
        </div>
      )}
    </>
  )
}
