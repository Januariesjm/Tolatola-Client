"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Send, Minus, X, Headphones, UserCheck } from "lucide-react"
import { ChatDialog } from "@/components/messaging/chat-dialog"
import { createClient } from "@/lib/supabase/client"
import { createSupportTicket } from "@/app/actions/support"
import { toast } from "@/hooks/use-toast"

const AISHA_AVATAR = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.tolatola.co"

interface ChatMessage {
    id: string
    sender: "bot" | "user" | "agent"
    text: string
    timestamp: string
    showEscalationOption?: boolean
}

export function FloatingSupportWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [activeTicket, setActiveTicket] = useState<any>(null)
    const [chatOpen, setChatOpen] = useState(false)

    // AI Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: "welcome-1",
            sender: "bot",
            text: "Welcome to Tolatola! I'm Aisha, your 24/7 digital agent to help you with whatever you may need! 😊 Choose one of the following topics or type your question.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        },
    ])
    const [inputText, setInputText] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const [isEscalating, setIsEscalating] = useState(false)

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [userToken, setUserToken] = useState<string | null>(null)

    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const init = async () => {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()

            if (session?.user) {
                setIsAuthenticated(true)
                setUserToken(session.access_token)

                const { data: tickets } = await supabase
                    .from("support_tickets")
                    .select("*")
                    .eq("user_id", session.user.id)
                    .in("status", ["open", "in_progress"])
                    .order("created_at", { ascending: false })
                    .limit(1)

                if (tickets && tickets.length > 0) {
                    setActiveTicket(tickets[0])
                }
            }
        }
        init()

        const handleOpenSupport = () => setIsOpen(true)
        window.addEventListener("open-support-chat", handleOpenSupport)
        return () => window.removeEventListener("open-support-chat", handleOpenSupport)
    }, [])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, isTyping])

    const handleSendMessage = async (customText?: string) => {
        const text = (customText || inputText).trim()
        if (!text) return

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: "user",
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        }

        setMessages((prev) => [...prev, userMsg])
        if (!customText) setInputText("")
        setIsTyping(true)

        try {
            const chatHistory = messages.map((m) => ({ sender: m.sender, text: m.text }))
            const res = await fetch(`${API_BASE_URL}/support/ai-chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(userToken ? { Authorization: `Bearer ${userToken}` } : {}),
                },
                body: JSON.stringify({ message: text, history: chatHistory }),
            })

            const data = await res.json()
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
            } else {
                throw new Error("Invalid AI response")
            }
        } catch (e) {
            // Fallback response
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
        }
    }

    const handleEscalateToHuman = async () => {
        if (!isAuthenticated) {
            toast({ title: "Sign In Required", description: "Please sign in to start a live support ticket.", variant: "destructive" })
            return
        }

        setIsEscalating(true)
        try {
            const lastMsg = [...messages].reverse().find((m) => m.sender === "user")
            const subject = lastMsg ? lastMsg.text.slice(0, 45) : "General Inquiry"
            const body = messages.map((m) => `${m.sender.toUpperCase()}: ${m.text}`).join("\n")

            const result = await createSupportTicket(subject, body, "medium")
            if (result?.ticket) {
                setActiveTicket(result.ticket)
                const botMsg: ChatMessage = {
                    id: Date.now().toString(),
                    sender: "bot",
                    text: `✅ Connected! Ticket #${result.ticket.id.substring(0, 8)} created. Customer support will reply shortly.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                }
                setMessages((prev) => [...prev, botMsg])
            }
        } catch (e: any) {
            toast({ title: "Escalation Failed", description: e.message, variant: "destructive" })
        } finally {
            setIsEscalating(false)
        }
    }

    if (!isAuthenticated && typeof window !== "undefined" && window.location.pathname.includes("/auth")) {
        return null
    }

    return (
        <>
            {/* FAB Trigger Matching Image 1 */}
            <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative group transition-transform hover:scale-105 active:scale-95 focus:outline-none"
                >
                    <div className="h-16 w-16 rounded-full border-2 border-white bg-white shadow-2xl relative overflow-hidden flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={AISHA_AVATAR} alt="Aisha AI Agent" className="h-full w-full object-cover rounded-full" />
                        {/* Red Notification Badge '1' matching Image 1 */}
                        <span className="absolute -top-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 border-2 border-white text-[11px] font-black text-white shadow">
                            1
                        </span>
                    </div>
                </button>
            </div>

            {/* Chat Drawer / Popup Window Matching Image 2 */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-8rem)] rounded-3xl bg-slate-50 shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                    {/* Header Banner matching Image 2 */}
                    <div className="bg-[#e6d7b8] px-4 pt-4 pb-6 flex flex-col items-center relative text-stone-900 border-b border-amber-200/60 shadow-sm">
                        <div className="w-full flex justify-between items-center absolute top-3 px-4">
                            <button onClick={() => setIsOpen(false)} className="p-1 text-stone-700 hover:text-stone-900 transition-colors">
                                <Minus className="h-4 w-4" />
                            </button>
                            <button onClick={() => setIsOpen(false)} className="p-1 text-stone-700 hover:text-stone-900 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="relative mt-2">
                            <div className="h-20 w-20 rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={AISHA_AVATAR} alt="Aisha Avatar" className="h-full w-full object-cover" />
                            </div>
                            <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                        </div>

                        <h3 className="font-bold text-base mt-2 text-stone-900">Hello, I'm Aisha</h3>
                        <p className="text-xs font-medium text-stone-700 mt-0.5">TOLATOLA Digital Agent</p>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 text-sm">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-2 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                            >
                                {msg.sender !== "user" && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={AISHA_AVATAR} alt="Aisha" className="h-7 w-7 rounded-full object-cover border border-slate-200 mt-1" />
                                )}
                                <div
                                    className={`p-3.5 rounded-2xl space-y-1 ${
                                        msg.sender === "user"
                                            ? "bg-blue-600 text-white rounded-tr-none"
                                            : "bg-white text-slate-900 border border-slate-200/80 shadow-sm rounded-tl-none"
                                    }`}
                                >
                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                    <span className={`text-[10px] block ${msg.sender === "user" ? "text-blue-100 text-right" : "text-slate-400"}`}>
                                        {msg.timestamp}
                                    </span>

                                    {msg.showEscalationOption && !activeTicket && (
                                        <Button
                                            size="sm"
                                            onClick={handleEscalateToHuman}
                                            disabled={isEscalating}
                                            className="w-full mt-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold gap-2 rounded-xl py-2"
                                        >
                                            <Headphones className="h-3.5 w-3.5" />
                                            {isEscalating ? "Connecting..." : "Connect to Human Support"}
                                        </Button>
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
                                placeholder="Type your message"
                                className="flex-1 bg-transparent text-sm text-slate-900 border-none outline-none px-2 py-1.5"
                            />
                            <button
                                onClick={() => handleSendMessage()}
                                disabled={!inputText.trim()}
                                className="h-8 w-8 rounded-full bg-slate-400 disabled:opacity-40 hover:bg-blue-600 text-white flex items-center justify-center transition-colors"
                            >
                                <Send className="h-3.5 w-3.5 ml-0.5" />
                            </button>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 font-medium">asksuite · TOLATOLA AI Agent</span>
                    </div>
                </div>
            )}

            {/* Active Ticket Live Chat Dialog */}
            {activeTicket && (
                <ChatDialog
                    open={chatOpen}
                    onOpenChange={setChatOpen}
                    conversationId={activeTicket.conversation_id}
                    shopName="Customer Support"
                    productName={`Ticket #${activeTicket.id.substring(0, 8)}`}
                />
            )}
        </>
    )
}
