"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { clientApiGet, clientApiPost } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { 
  Send, 
  Loader2, 
  Search, 
  User, 
  Store, 
  Truck, 
  Mail, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  XCircle,
  X,
  History
} from "lucide-react"

type RecipientRole = "customer" | "vendor" | "transporter"

interface UserDetails {
  id: string
  name: string
  email: string
  phone?: string
  recipientId: string
}

interface ActivityLog {
  id: string
  admin_id: string
  action: string
  resource: string
  details: {
    recipient_user_id: string
    recipient_email: string
    recipient_name: string
    subject: string
    channels: {
      sendEmail: boolean
      sendInApp: boolean
    }
    results?: any
  }
  created_at: string
  admin: {
    full_name: string
    email: string
  }
}

export function MessagingTab() {
  const { toast } = useToast()
  
  // Compose message state
  const [role, setRole] = useState<RecipientRole>("customer")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRecipient, setSelectedRecipient] = useState<UserDetails | null>(null)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sendEmail, setSendEmail] = useState(true)
  const [sendInApp, setSendInApp] = useState(true)
  const [isSending, setIsSending] = useState(false)

  // Recipients cache
  const [customers, setCustomers] = useState<UserDetails[]>([])
  const [vendors, setVendors] = useState<UserDetails[]>([])
  const [transporters, setTransporters] = useState<UserDetails[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // History logs state
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [logSearchQuery, setLogSearchQuery] = useState("")

  // Fetch history on load
  useEffect(() => {
    fetchLogs()
  }, [])

  // Fetch users when role changes if not already fetched
  useEffect(() => {
    fetchUsersForRole(role)
  }, [role])

  const fetchUsersForRole = async (targetRole: RecipientRole) => {
    if (targetRole === "customer" && customers.length > 0) return
    if (targetRole === "vendor" && vendors.length > 0) return
    if (targetRole === "transporter" && transporters.length > 0) return

    setLoadingUsers(true)
    try {
      if (targetRole === "customer") {
        const response = await clientApiGet<{ data: any[] }>("admin/customers")
        const list = (response.data || []).map((c: any) => ({
          id: c.id,
          name: c.full_name || "Unnamed Customer",
          email: c.email,
          phone: c.phone || "",
          recipientId: c.id
        }))
        setCustomers(list)
      } else if (targetRole === "vendor") {
        const response = await clientApiGet<{ data: any[] }>("admin/vendors")
        const list = (response.data || []).map((v: any) => ({
          id: v.id,
          name: v.business_name || v.users?.full_name || "Unnamed Vendor",
          email: v.users?.email || "",
          phone: v.phone || v.users?.phone || "",
          recipientId: v.user_id || v.id
        }))
        setVendors(list)
      } else if (targetRole === "transporter") {
        const response = await clientApiGet<{ data: any[] }>("admin/transporters")
        const list = (response.data || []).map((t: any) => ({
          id: t.id,
          name: t.users?.full_name || t.business_name || "Unnamed Transporter",
          email: t.users?.email || "",
          phone: t.phone || t.users?.phone || "",
          recipientId: t.user_id
        }))
        setTransporters(list)
      }
    } catch (error) {
      console.error("Error loading recipients:", error)
      toast({
        title: "Error",
        description: `Failed to load ${targetRole}s list.`,
        variant: "destructive"
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from("admin_activity_logs")
        .select(`
          *,
          admin:admin_id (full_name, email)
        `)
        .eq("action", "send_message")
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error
      
      const formattedData = (data || []).map(log => ({
        ...log,
        admin: Array.isArray(log.admin) ? log.admin[0] : (log.admin || { full_name: "Unknown Admin", email: "" })
      })) as ActivityLog[]

      setLogs(formattedData)
    } catch (err) {
      console.error("Error fetching admin messaging logs:", err)
    } finally {
      setLoadingLogs(false)
    }
  }

  const handleSend = async () => {
    if (!selectedRecipient) {
      toast({
        title: "Validation Error",
        description: "Please select a message recipient.",
        variant: "destructive",
      })
      return
    }

    if (!subject.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a subject.",
        variant: "destructive",
      })
      return
    }

    if (!message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a message.",
        variant: "destructive",
      })
      return
    }

    if (!sendEmail && !sendInApp) {
      toast({
        title: "Validation Error",
        description: "Please select at least one channel (Email or In-App).",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    try {
      const response = await clientApiPost<{ message?: string; success?: boolean }>("/admin/send-message", {
        userId: selectedRecipient.recipientId,
        subject: subject.trim(),
        message: message.trim(),
        sendEmail,
        sendInApp,
      })

      toast({
        title: "Success",
        description: response?.message || "Direct message sent successfully.",
      })
      
      // Reset composer fields
      setSubject("")
      setMessage("")
      setSelectedRecipient(null)
      setSearchQuery("")
      
      // Refresh history
      fetchLogs()
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  // Get users for active role
  const getActiveUsers = () => {
    if (role === "customer") return customers
    if (role === "vendor") return vendors
    return transporters
  }

  // Filter users based on query
  const filteredUsers = getActiveUsers().filter(u => {
    if (!searchQuery.trim()) return false // Don't show options if search query is empty
    const query = searchQuery.toLowerCase()
    return (
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.phone?.toLowerCase().includes(query)
    )
  }).slice(0, 5) // limit to top 5 matches

  // Filter logs based on query
  const filteredLogs = logs.filter(log => {
    if (!logSearchQuery.trim()) return true
    const query = logSearchQuery.toLowerCase()
    return (
      log.details?.recipient_name?.toLowerCase().includes(query) ||
      log.details?.recipient_email?.toLowerCase().includes(query) ||
      log.details?.subject?.toLowerCase().includes(query) ||
      log.admin?.full_name?.toLowerCase().includes(query)
    )
  })

  const getRoleIcon = (roleType: string) => {
    switch (roleType) {
      case "vendor": return <Store className="h-4 w-4 text-emerald-500" />
      case "transporter": return <Truck className="h-4 w-4 text-blue-500" />
      default: return <User className="h-4 w-4 text-purple-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Direct Messaging & Email Service</h2>
        <p className="text-sm text-slate-500">
          Send direct messages and emails to vendors, customers, or transporters directly from the TOLA platform.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Composer Form Card */}
        <Card className="border-slate-200 shadow-sm lg:col-span-7 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Compose Direct Message
            </CardTitle>
            <CardDescription>
              Write a message and dispatch it through email, in-app notifications, or both.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Role Selection */}
            <div className="space-y-2">
              <Label>Select Recipient Group</Label>
              <Select 
                value={role} 
                onValueChange={(val) => {
                  setRole(val as RecipientRole)
                  setSelectedRecipient(null)
                  setSearchQuery("")
                }}
                disabled={isSending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose group..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customers</SelectItem>
                  <SelectItem value="vendor">Vendors</SelectItem>
                  <SelectItem value="transporter">Transporters</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Recipient Search/Selection */}
            <div className="space-y-2 relative">
              <Label>Recipient</Label>
              {selectedRecipient ? (
                <div className="flex items-center justify-between border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                      {getRoleIcon(role)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-800">{selectedRecipient.name}</div>
                      <div className="text-xs text-slate-500">{selectedRecipient.email}</div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-full"
                    onClick={() => {
                      setSelectedRecipient(null)
                      setSearchQuery("")
                    }}
                    disabled={isSending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder={`Type name, email, or phone of ${role}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      disabled={isSending || loadingUsers}
                    />
                    {loadingUsers && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                    )}
                  </div>

                  {/* Search Results Dropdown */}
                  {searchQuery.trim() !== "" && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-[200px] overflow-y-auto divide-y divide-slate-100">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <div 
                            key={user.id}
                            className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                            onClick={() => {
                              setSelectedRecipient(user)
                              setSearchQuery("")
                            }}
                          >
                            <div>
                              <div className="font-medium text-sm text-slate-800">{user.name}</div>
                              <div className="text-xs text-slate-500">{user.email}</div>
                            </div>
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase">Select</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-slate-500">
                          No matching {role}s found.
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Subject Input */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Enter message subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isSending}
              />
            </div>

            {/* Message Body */}
            <div className="space-y-2">
              <Label htmlFor="message">Message Content</Label>
              <Textarea
                id="message"
                placeholder="Write your message here..."
                className="min-h-[150px] resize-y"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isSending}
              />
            </div>

            {/* Channels Select */}
            <div className="space-y-2 pt-2">
              <Label className="text-slate-700">Communication Channels</Label>
              <div className="flex flex-row gap-6 p-3 bg-slate-50/50 rounded-lg border border-slate-200">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendEmailTab"
                    checked={sendEmail}
                    onCheckedChange={(checked) => setSendEmail(!!checked)}
                    disabled={isSending}
                  />
                  <Label htmlFor="sendEmailTab" className="font-normal cursor-pointer select-none text-sm text-slate-600">
                    Send Email
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendInAppTab"
                    checked={sendInApp}
                    onCheckedChange={(checked) => setSendInApp(!!checked)}
                    disabled={isSending}
                  />
                  <Label htmlFor="sendInAppTab" className="font-normal cursor-pointer select-none text-sm text-slate-600">
                    In-App Notification
                  </Label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button onClick={handleSend} disabled={isSending} className="w-full h-11 bg-primary text-white font-medium shadow-sm hover:bg-primary/95">
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Dispatching Messages...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* History Log Card */}
        <Card className="border-slate-200 shadow-sm lg:col-span-5 bg-white">
          <CardHeader className="pb-3 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-slate-500" />
                Sent Messages Log
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={fetchLogs}>
                <Clock className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              History of direct messages dispatched by admins.
            </CardDescription>
            <div className="relative mt-3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search history logs..."
                className="pl-8 bg-slate-50/50"
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100">
              {loadingLogs ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  <p className="mt-2 text-xs text-slate-500">Loading delivery history...</p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No messaging activity logs found.
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const details = log.details || {}
                  const ch = details.channels || {}
                  return (
                    <div key={log.id} className="p-4 hover:bg-slate-50/30 transition-colors space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-sm text-slate-800">{details.recipient_name || "Unnamed"}</div>
                          <div className="text-xs text-slate-400">{details.recipient_email}</div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                          {format(new Date(log.created_at), "MMM d, HH:mm")}
                        </span>
                      </div>

                      <div className="text-sm text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                        <div className="font-semibold text-xs text-slate-500 mb-0.5">Subject: {details.subject}</div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="text-slate-500">
                          By: <span className="font-medium">{log.admin?.full_name || "Admin"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {ch.sendEmail && (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-sky-50 text-sky-700 border-sky-200">
                              Email
                            </Badge>
                          )}
                          {ch.sendInApp && (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-indigo-50 text-indigo-700 border-indigo-200">
                              In-App
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
