"use client"

import { useEffect, useRef } from "react"
import { toast } from "@/hooks/use-toast"
import { useSupportChat } from "@/hooks/use-support-chat"
import { useSupportInactivity } from "@/hooks/use-support-inactivity"
import { useSupportMessaging } from "@/hooks/use-support-messaging"
import { useSupportSession } from "@/hooks/use-support-session"
import { SupportChatHeader } from "@/components/support/support-chat-header"
import { SupportComposer } from "@/components/support/support-composer"
import { SupportMessageBubble } from "@/components/support/support-message-bubble"
import { SUPPORT_AGENT_AVATAR, SUPPORT_AGENT_NAME } from "@/lib/support/agent-profile"
import { createBotMessage, type ChatMessage } from "@/lib/support/chat-message"

const INITIAL_WELCOME_MSG: ChatMessage = createBotMessage(
  "welcome-1",
  "Welcome to Tola! I'm Moureen Tyler, your 24/7 digital agent to help you with whatever you may need! 😊 Ask a question or upload an image/PDF document.",
)

/**
 * The floating support chat.
 *
 * This composes the pane and owns only what spans more than one part of it.
 * Everything else lives beside the thing that uses it:
 *
 *   - transcript + realtime subscription -> hooks/use-support-chat
 *   - auth and ticket restoration        -> hooks/use-support-session
 *   - idle warning and termination       -> hooks/use-support-inactivity
 *   - sending, uploading, escalating     -> hooks/use-support-messaging
 *   - attachment rules, endpoint lists   -> lib/support/*
 *
 * It was previously ~820 lines holding all of that inline.
 */
export function FloatingSupportWidget() {
  const session = useSupportSession()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // These three are mutually dependent: the transcript resets the idle timer, the
  // idle timer appends to the transcript, and its expiry tears the whole session
  // down. Late-bound refs break the cycle so the hooks can still be called in a
  // fixed order. Both hooks read their callbacks from refs internally, so the
  // indirection costs nothing at runtime.
  const registerActivityRef = useRef<() => void>(() => {})
  const endSessionRef = useRef<(reason: "user" | "inactivity") => void>(() => {})

  const chat = useSupportChat({
    conversationId: session.liveConversationId,
    initialMessages: [INITIAL_WELCOME_MSG],
    onActivity: () => registerActivityRef.current(),
  })

  const inactivity = useSupportInactivity({
    onPrompt: () =>
      chat.setMessages((prev) => [
        ...prev,
        createBotMessage(
          `inactivity-${Date.now()}`,
          "Notice: Your chat session has been inactive for 1 hour. Would you like to continue or end the chat session?",
          { showInactivityPrompt: true },
        ),
      ]),
    onExpire: () => endSessionRef.current("inactivity"),
  })
  registerActivityRef.current = inactivity.registerActivity

  const messaging = useSupportMessaging({
    messages: chat.messages,
    setMessages: chat.setMessages,
    broadcastMessage: chat.broadcastMessage,
    liveConversationId: session.liveConversationId,
    setLiveConversationId: session.setLiveConversationId,
    activeTicket: session.activeTicket,
    setActiveTicket: session.setActiveTicket,
    userToken: session.userToken,
    registerActivity: inactivity.registerActivity,
  })

  /** Tears the session down completely; a new one starts from the welcome message. */
  const handleEndChatSession = (reason: "user" | "inactivity" = "user") => {
    inactivity.dismissPrompt()
    session.setActiveTicket(null)
    session.setLiveConversationId(null)
    chat.setMessages([INITIAL_WELCOME_MSG])
    messaging.resetComposer()
    session.setIsOpen(false)

    toast({
      title: reason === "inactivity" ? "Session Ended Due to Inactivity" : "Chat Session Ended",
      description: "Your support chat session has been fully terminated. You can open a new session anytime.",
    })
  }
  endSessionRef.current = handleEndChatSession

  const handleContinueChatSession = () => {
    inactivity.registerActivity()
    chat.setMessages((prev) => [
      ...prev,
      createBotMessage(
        `resumed-${Date.now()}`,
        `Great! Your chat session has been resumed. How else can ${SUPPORT_AGENT_NAME} help you today?`,
      ),
    ])
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chat.messages, messaging.isTyping, inactivity.promptActive, messaging.selectedAttachment])

  // The auth pages have their own support entry point; a floating pane over a
  // sign-in form covers the submit button on small screens.
  if (!session.isAuthenticated && typeof window !== "undefined" && window.location.pathname.includes("/auth")) {
    return null
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <button
          onClick={() => {
            inactivity.registerActivity()
            session.setIsOpen(!session.isOpen)
          }}
          className="relative group transition-transform hover:scale-105 active:scale-95 focus:outline-none"
          aria-label="Open support chat"
        >
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 border-white bg-white shadow-2xl relative overflow-hidden flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SUPPORT_AGENT_AVATAR} alt={`${SUPPORT_AGENT_NAME} AI Agent`} className="h-full w-full object-cover rounded-full" />
            <span className="absolute -top-1 -left-1 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-red-600 border-2 border-white text-[10px] sm:text-[11px] font-black text-white shadow">
              1
            </span>
          </div>
        </button>
      </div>

      {session.isOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] transition-opacity" onClick={() => session.setIsOpen(false)} />
      )}

      {session.isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-24 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[380px] h-[480px] max-h-[calc(100vh-120px)] sm:h-[500px] sm:max-h-[calc(100vh-140px)] rounded-3xl bg-slate-50 shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          <SupportChatHeader
            onClose={() => session.setIsOpen(false)}
            liveConversationId={session.liveConversationId}
            activeTicket={session.activeTicket}
          />

          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-sm">
            {chat.messages.map((msg) => (
              <SupportMessageBubble
                key={msg.id}
                message={msg}
                isLiveConversation={Boolean(session.liveConversationId)}
                isEscalating={messaging.isEscalating}
                onEscalate={messaging.handleEscalateToHuman}
                inactivityPromptActive={inactivity.promptActive}
                secondsRemaining={inactivity.secondsRemaining}
                onContinueSession={handleContinueChatSession}
                onEndSession={() => handleEndChatSession("user")}
              />
            ))}
            {messaging.isTyping && (
              <div className="flex gap-2 items-center text-slate-400 text-xs italic">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={SUPPORT_AGENT_AVATAR} alt={SUPPORT_AGENT_NAME} className="h-6 w-6 rounded-full object-cover" />
                {SUPPORT_AGENT_NAME} is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <SupportComposer
            inputText={messaging.inputText}
            onInputTextChange={messaging.setInputText}
            onSend={() => messaging.handleSendMessage()}
            selectedAttachment={messaging.selectedAttachment}
            onClearAttachment={() => messaging.setSelectedAttachment(null)}
            onFileSelect={messaging.handleFileSelect}
            isUploading={messaging.isUploading}
            isTyping={messaging.isTyping}
            isLiveConversation={Boolean(session.liveConversationId)}
          />
        </div>
      )}
    </>
  )
}
