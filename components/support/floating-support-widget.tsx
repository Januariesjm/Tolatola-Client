"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Send, Minus, X, Headphones, RefreshCw, LogOut, MessageCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { sendMessage as sendLiveMessage } from "@/app/actions/messaging"
import { toast } from "@/hooks/use-toast"

const AISHA_AVATAR = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.tolatola.co"

const INITIAL_WELCOME_MSG: ChatMessage = {
    id: "welcome-1",
    sender: "bot",
    text: "Welcome to Tola! I'm Aisha, your 24/7 digital agent to help you with whatever you may need! 😊 Choose one of the following topics or type your question.",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
}

const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000 // 1 hour
const TERMINATION_COUNTDOWN_SEC = 120 // 2 minutes

interface ChatMessage {
    id: string
    sender: "bot" | "user" | "agent"
    text: string
    timestamp: string
    showEscalationOption?: boolean
    showInactivityPrompt?: boolean
}

export function FloatingSupportWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [activeTicket, setActiveTicket] = useState<any>(null)
    const [liveConversationId, setLiveConversationId] = useState<string | null>(null)

    // AI Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME_MSG])
    const [inputText, setInputText] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const [isEscalating, setIsEscalating] = useState(false)

    // Inactivity Lifecycle State
    const lastActivityRef = useRef<number>(Date.now())
    const [inactivityPromptActive, setInactivityPromptActive] = useState(false)
    const [secondsRemaining, setSecondsRemaining] = useState<number>(TERMINATION_COUNTDOWN_SEC)

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [userToken, setUserToken] = useState<string | null>(null)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const channelRef = useRef<any>(null)

    const resetActivityTimer = () => {
        lastActivityRef.current = Date.now()
        if (inactivityPromptActive) {
            setInactivityPromptActive(false)
        }
    }

    useEffect(() => {
        const init = async () => {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()

            if (session?.user) {
                setIsAuthenticated(true)
                setUserToken(session.access_token)
                setCurrentUserId(session.user.id)

                // Check for existing open support ticket
                const { data: tickets } = await supabase
                    .from("support_tickets")
                    .select("*, conversations:conversation_id(*)")
                    .eq("user_id", session.user.id)
                    .in("status", ["open", "in_progress"])
                    .order("created_at", { ascending: false })
                    .limit(1)

                if (tickets && tickets.length > 0) {
                    setActiveTicket(tickets[0])
                    if (tickets[0].conversation_id) {
                        setLiveConversationId(tickets[0].conversation_id)
                    }
                }
            }
        }
        init()

        const handleOpenSupport = () => setIsOpen(true)
        window.addEventListener("open-support-chat", handleOpenSupport)
        return () => window.removeEventListener("open-support-chat", handleOpenSupport)
    }, [])

    // Subscribe to realtime messages from admin support agent when live conversation is active
    useEffect(() => {
        if (!liveConversationId) return

        const supabase = createClient()
        const channel = supabase
            .channel(`support-live:${liveConversationId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `conversation_id=eq.${liveConversationId}`,
                },
                (payload: any) => {
                    const newMsg = payload.new
                    // Only show messages from the admin/support agent or chatbot (not from the current user)
                    if (newMsg && (newMsg.sender_type === "agent" || newMsg.sender_type === "bot")) {
                        const agentMsg: ChatMessage = {
                            id: `live-${newMsg.id}`,
                            sender: newMsg.sender_type === "bot" ? "bot" : "agent",
                            text: newMsg.message || "[Attachment]",
                            timestamp: new Date(newMsg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                        }
                        setMessages((prev) => {
                            if (prev.some(m => m.id === agentMsg.id || m.id === `live-${newMsg.id}`)) return prev
                            return [...prev, agentMsg]
                        })
                        resetActivityTimer()
                    }
                }
            )
            .on(
                "broadcast",
                { event: "message" },
                (payload: any) => {
                    console.log("[Support Widget] Broadcast message received:", payload)
                    const newMsg = payload.payload
                    if (newMsg && (newMsg.sender_type === "agent" || newMsg.sender_type === "bot")) {
                        const agentMsg: ChatMessage = {
                            id: `live-${newMsg.id}`,
                            sender: newMsg.sender_type === "bot" ? "bot" : "agent",
                            text: newMsg.message || "[Attachment]",
                            timestamp: new Date(newMsg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                        }
                        setMessages((prev) => {
                            if (prev.some(m => m.id === agentMsg.id || m.id === `live-${newMsg.id}`)) return prev
                            return [...prev, agentMsg]
                        })
                        resetActivityTimer()
                    }
                }
            )
            .subscribe()

        channelRef.current = channel

        return () => {
            supabase.removeChannel(channel)
            channelRef.current = null
        }
    }, [liveConversationId, currentUserId])

    // 1-Hour Inactivity Monitor
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now()
            const elapsed = now - lastActivityRef.current

            if (elapsed >= INACTIVITY_TIMEOUT_MS && !inactivityPromptActive) {
                setInactivityPromptActive(true)
                setSecondsRemaining(TERMINATION_COUNTDOWN_SEC)

                const promptMsg: ChatMessage = {
                    id: `inactivity-${now}`,
                    sender: "bot",
                    text: "Notice: Your chat session has been inactive for 1 hour. Would you like to continue or end the chat session?",
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                    showInactivityPrompt: true,
                }
                setMessages((prev) => [...prev, promptMsg])
            }
        }, 15000)

        return () => clearInterval(interval)
    }, [inactivityPromptActive])

    // Termination countdown ticker when prompt is active
    useEffect(() => {
        let ticker: NodeJS.Timeout | null = null
        if (inactivityPromptActive) {
            ticker = setInterval(() => {
                setSecondsRemaining((prev) => {
                    if (prev <= 1) {
                        handleEndChatSession("inactivity")
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        }
        return () => {
            if (ticker) clearInterval(ticker)
        }
    }, [inactivityPromptActive])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, isTyping, inactivityPromptActive])

    const handleContinueChatSession = () => {
        resetActivityTimer()
        const resMsg: ChatMessage = {
            id: `resumed-${Date.now()}`,
            sender: "bot",
            text: "Great! Your chat session has been resumed. How else can Aisha help you today?",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        }
        setMessages((prev) => [...prev, resMsg])
    }

    const handleEndChatSession = (reason: "user" | "inactivity" = "user") => {
        setInactivityPromptActive(false)
        setActiveTicket(null)
        setLiveConversationId(null)
        setMessages([INITIAL_WELCOME_MSG])
        setInputText("")
        setIsOpen(false)

        toast({
            title: reason === "inactivity" ? "Session Ended Due to Inactivity" : "Chat Session Ended",
            description: "Your support chat session has been fully terminated. You can open a new session anytime.",
        })
    }

    const handleSendMessage = async (customText?: string) => {
        const text = (customText || inputText).trim()
        if (!text) return

        resetActivityTimer()

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: "user",
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        }

        setMessages((prev) => [...prev, userMsg])
        if (!customText) setInputText("")

        // If connected to live human support, also send the message to the conversation
        if (liveConversationId) {
            try {
                const result = await sendLiveMessage(
                    liveConversationId,
                    text,
                    undefined,
                    undefined,
                    userToken ? "user" : "guest"
                )
                if (result.message && channelRef.current) {
                    channelRef.current.send({
                        type: "broadcast",
                        event: "message",
                        payload: result.message,
                    })
                }
            } catch (e) {
                console.error("Error sending live message:", e)
            }
            // Don't call AI — user is chatting with a human agent now
            return
        }

        setIsTyping(true)

        try {
            const chatHistory = messages.map((m) => ({ sender: m.sender, text: m.text }))
            const base = (process.env.NEXT_PUBLIC_API_URL || "https://api.tolatola.co").replace(/\/$/, "")
            const endpoints = [
                `${base}/api/support/ai-chat`,
                `${base}/support/ai-chat`,
                "https://api.tolatola.co/api/support/ai-chat",
                "https://api.tolatola.co/support/ai-chat",
            ]

            let data: any = null
            for (const url of endpoints) {
                try {
                    const res = await fetch(url, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            ...(userToken ? { Authorization: `Bearer ${userToken}` } : {}),
                        },
                        body: JSON.stringify({ message: text, history: chatHistory }),
                    })
                    if (res.ok) {
                        data = await res.json()
                        break
                    }
                } catch (err) {
                    // Try next endpoint
                }
            }

            if (data?.response) {
                const botMsg: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    sender: "bot",
                    text: data.response,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                    showEscalationOption: data.needs_human,
                }
                setMessages((prev) => [...prev, botMsg])

                if (data.ticket) {
                    setActiveTicket(data.ticket)
                }

                const convId = data.conversation?.id || data.ticket?.conversation_id
                if (convId) {
                    console.log("[AI Chat] Live conversation established automatically:", convId)
                    setLiveConversationId(convId)
                }
            } else {
                throw new Error("Invalid AI response")
            }
        } catch (e) {
            const botMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: "bot",
                text: "I couldn't quite process that. Would you like me to connect you directly with human support?",
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                showEscalationOption: true,
            }
            setMessages((prev) => [...prev, botMsg])
        } finally {
            setIsTyping(false)
            resetActivityTimer()
        }
    }

    const handleEscalateToHuman = async () => {
        console.log("[Support Escalation] handleEscalateToHuman triggered", {
            isAuthenticated,
            hasUserToken: !!userToken,
            activeTicketId: activeTicket?.id,
            liveConversationId,
        })

        resetActivityTimer()

        // If conversation is already established, confirm connection immediately
        if (liveConversationId && activeTicket) {
            console.log("[Support Escalation] Active conversation already present:", liveConversationId)
            const connectedMsg: ChatMessage = {
                id: `connected-${Date.now()}`,
                sender: "bot",
                text: `✅ Connected to Tola Human Support!\n\nTicket #${activeTicket.id.substring(0, 8)} is active. A support agent will review your chat and respond shortly.\n\nYou can continue typing your messages here — the support team will see them in real-time.`,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            }
            setMessages((prev) => [...prev, connectedMsg])
            return
        }

        setIsEscalating(true)

        // Step 1: Show "Connecting..." message immediately
        const connectingMsg: ChatMessage = {
            id: `connecting-${Date.now()}`,
            sender: "bot",
            text: "🔄 Connecting you to an available support agent... Please wait.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        }
        setMessages((prev) => [...prev, connectingMsg])

        try {
            const lastMsg = [...messages].reverse().find((m) => m.sender === "user")
            const subject = lastMsg ? lastMsg.text.slice(0, 45) : "General Support Request"
            const body = messages.map((m) => `${m.sender.toUpperCase()}: ${m.text}`).join("\n")

            const base = (process.env.NEXT_PUBLIC_API_URL || "https://api.tolatola.co").replace(/\/$/, "")
            const endpoints = [
                `${base}/api/support/tickets`,
                `${base}/support/tickets`,
                "https://api.tolatola.co/api/support/tickets",
                "https://api.tolatola.co/support/tickets",
            ]

            const headers: Record<string, string> = { "Content-Type": "application/json" }
            if (userToken) {
                headers["Authorization"] = `Bearer ${userToken}`
            }

            let result: any = null
            for (const url of endpoints) {
                try {
                    console.log("[Support Escalation] Posting ticket to:", url)
                    const res = await fetch(url, {
                        method: "POST",
                        headers,
                        body: JSON.stringify({
                            subject,
                            message: body,
                            priority: "medium",
                            guestName: "Guest User",
                            guestEmail: "guest@tola.co",
                            history: messages.map((m) => ({ sender: m.sender, text: m.text })),
                        }),
                    })
                    if (res.ok) {
                        result = await res.json()
                        console.log("[Support Escalation] Ticket created successfully:", result)
                        break
                    }
                } catch (fetchErr) {
                    console.warn("[Support Escalation] Failed endpoint:", url, fetchErr)
                }
            }

            if (!result || (!result.ticket && !result.id)) {
                throw new Error("Could not connect to support service. Please try again.")
            }

            const ticket = result.ticket || result
            const convId = result.conversation?.id || ticket.conversation_id

            setActiveTicket({ ...ticket, conversation_id: convId })
            if (convId) {
                setLiveConversationId(convId)
            }

            // Replace connecting message with connected message
            setMessages((prev) => {
                const filtered = prev.filter((m) => m.id !== connectingMsg.id)
                const connectedMsg: ChatMessage = {
                    id: `connected-${Date.now()}`,
                    sender: "bot",
                    text: `✅ Connected to Tola Human Support!\n\nTicket #${ticket.id.substring(0, 8)} has been created and assigned to our support team. A support agent will review your chat and respond shortly.\n\nYou can continue typing your messages here — the support team will see them in real-time.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                }
                return [...filtered, connectedMsg]
            })
        } catch (e: any) {
            console.error("[Support Escalation Error]", e)
            setMessages((prev) => {
                const filtered = prev.filter((m) => m.id !== connectingMsg.id)
                const errorMsg: ChatMessage = {
                    id: `error-${Date.now()}`,
                    sender: "bot",
                    text: `❌ Failed to connect to human support: ${e.message || "Unknown error"}. Please try again.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                    showEscalationOption: true,
                }
                return [...filtered, errorMsg]
            })
        } finally {
            setIsEscalating(false)
            resetActivityTimer()
        }
    }

    if (!isAuthenticated && typeof window !== "undefined" && window.location.pathname.includes("/auth")) {
        return null
    }

    return (
        <>
            {/* FAB Trigger - Works on Mobile and Desktop Website */}
            <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <button
                    onClick={() => {
                        resetActivityTimer()
                        setIsOpen(!isOpen)
                    }}
                    className="relative group transition-transform hover:scale-105 active:scale-95 focus:outline-none"
                    aria-label="Open support chat"
                >
                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 border-white bg-white shadow-2xl relative overflow-hidden flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={AISHA_AVATAR} alt="Aisha AI Agent" className="h-full w-full object-cover rounded-full" />
                        <span className="absolute -top-1 -left-1 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-red-600 border-2 border-white text-[10px] sm:text-[11px] font-black text-white shadow">
                            1
                        </span>
                    </div>
                </button>
            </div>

            {/* Click-Outside Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Support Chat Window Pane */}
            {isOpen && (
                <div className="fixed bottom-4 right-4 sm:bottom-24 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[380px] h-[460px] max-h-[calc(100vh-120px)] sm:h-[480px] sm:max-h-[calc(100vh-140px)] rounded-3xl bg-slate-50 shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                    {/* Header Banner */}
                    <div className="bg-[#e6d7b8] px-4 pt-3 pb-4 flex flex-col items-center relative text-stone-900 border-b border-amber-200/60 shadow-sm">

                        {/* Minimize Action Button (Top Left) */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsOpen(false)
                            }}
                            className="absolute top-3 left-3 flex items-center gap-1 text-xs font-semibold text-stone-700 bg-amber-200/60 hover:bg-amber-300/80 px-2.5 py-1 rounded-full transition-colors z-10"
                            aria-label="Minimize chat window"
                        >
                            <Minus className="h-3.5 w-3.5" />
                            <span>Minimize</span>
                        </button>

                        {/* CLOSE BUTTON (X) - TOP RIGHT */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsOpen(false)
                            }}
                            className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center rounded-full bg-stone-900/10 hover:bg-red-600 hover:text-white text-stone-900 shadow-sm transition-all duration-150 active:scale-90 z-10"
                            title="Close Chat Window"
                            aria-label="Close support chat pane"
                        >
                            <X className="h-5 w-5 stroke-[2.5]" />
                        </button>

                        <div className="relative mt-1">
                            <div className="h-16 w-16 rounded-full border-3 border-white bg-white shadow-md overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={AISHA_AVATAR} alt="Aisha Avatar" className="h-full w-full object-cover" />
                            </div>
                            <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                        </div>

                        <h3 className="font-bold text-base mt-1.5 text-stone-900">Hello, I'm Aisha</h3>
                        <p className="text-[11px] font-semibold text-stone-700">TOLA Digital Agent</p>
                    </div>

                    {/* Live Support Connection Banner */}
                    {liveConversationId && activeTicket && (
                        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-emerald-800 truncate">
                                    Connected to Live Support
                                </p>
                                <p className="text-[10px] text-emerald-600">
                                    Ticket #{activeTicket.id?.substring(0, 8)} · Messages sync in real-time
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Messages Body */}
                    <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-sm">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-2 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                            >
                                {msg.sender !== "user" && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={AISHA_AVATAR}
                                        alt={msg.sender === "agent" ? "Support Agent" : "Aisha"}
                                        className="h-7 w-7 rounded-full object-cover border border-slate-200 mt-1"
                                    />
                                )}
                                <div
                                    className={`p-3 rounded-2xl space-y-2 ${
                                        msg.sender === "user"
                                            ? "bg-blue-600 text-white rounded-tr-none"
                                            : msg.sender === "agent"
                                            ? "bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-sm rounded-tl-none"
                                            : "bg-white text-slate-900 border border-slate-200/80 shadow-sm rounded-tl-none"
                                    }`}
                                >
                                    {/* Agent label for live support messages */}
                                    {msg.sender === "agent" && (
                                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                                            Support Agent
                                        </span>
                                    )}
                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                    <span className={`text-[10px] block ${
                                        msg.sender === "user" ? "text-blue-100 text-right"
                                        : msg.sender === "agent" ? "text-emerald-500"
                                        : "text-slate-400"
                                    }`}>
                                        {msg.timestamp}
                                    </span>

                                    {/* Human Escalation Button */}
                                    {msg.showEscalationOption && !liveConversationId && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                console.log("[UI Click] Connect to Human Support button clicked by user")
                                                handleEscalateToHuman()
                                            }}
                                            disabled={isEscalating}
                                            className="w-full mt-2 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-colors cursor-pointer shadow-md"
                                        >
                                            <Headphones className="h-3.5 w-3.5" />
                                            {isEscalating ? "Connecting to Support..." : "Connect to Human Support"}
                                        </button>
                                    )}

                                    {/* Inactivity Termination Action Prompt */}
                                    {msg.showInactivityPrompt && inactivityPromptActive && (
                                        <div className="pt-2 border-t border-slate-100 space-y-2">
                                            <p className="text-xs font-bold text-amber-700">
                                                Ending automatically in {Math.floor(secondsRemaining / 60)}m {secondsRemaining % 60}s...
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={handleContinueChatSession}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1 rounded-lg"
                                                >
                                                    <RefreshCw className="h-3 w-3" /> Continue
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEndChatSession("user")}
                                                    className="border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold gap-1 rounded-lg"
                                                >
                                                    <LogOut className="h-3 w-3" /> End Chat
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex gap-2 items-center text-slate-400 text-xs italic">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={AISHA_AVATAR} alt="Aisha" className="h-6 w-6 rounded-full object-cover" />
                                Aisha is typing...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer Input Bar */}
                    <div className="p-3 bg-white border-t border-slate-200 flex flex-col items-center">
                        <div className="w-full flex items-center bg-slate-100 border border-slate-300 rounded-full px-3 py-1 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                placeholder={liveConversationId ? "Type message to support agent..." : "Type your message"}
                                className="flex-1 bg-transparent text-sm text-slate-900 border-none outline-none px-2 py-1.5"
                            />
                            <button
                                type="button"
                                onClick={() => handleSendMessage()}
                                disabled={!inputText.trim()}
                                className="h-8 w-8 rounded-full bg-slate-400 disabled:opacity-40 hover:bg-blue-600 text-white flex items-center justify-center transition-colors"
                            >
                                <Send className="h-3.5 w-3.5 ml-0.5" />
                            </button>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 font-medium">
                            {liveConversationId ? "Live Support · TOLA" : "asksuite · TOLA AI Agent"}
                        </span>
                    </div>
                </div>
            )}
        </>
    )
}
