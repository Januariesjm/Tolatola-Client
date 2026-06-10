"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { clientApiPost } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { Send, Loader2 } from "lucide-react"

interface AdminMessageDialogProps {
  isOpen: boolean
  onClose: () => void
  recipientId: string
  recipientName: string
}

export function AdminMessageDialog({ isOpen, onClose, recipientId, recipientName }: AdminMessageDialogProps) {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sendEmail, setSendEmail] = useState(true)
  const [sendInApp, setSendInApp] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()

  const handleSend = async () => {
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
        description: "Please select at least one message channel (Email or In-App).",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    try {
      const response = await clientApiPost<{ message?: string; success?: boolean }>("/admin/send-message", {
        userId: recipientId,
        subject,
        message,
        sendEmail,
        sendInApp,
      })

      toast({
        title: "Success",
        description: response?.message || "Message sent successfully.",
      })
      
      // Reset form and close
      setSubject("")
      setMessage("")
      setSendEmail(true)
      setSendInApp(true)
      onClose()
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Send Message
          </DialogTitle>
          <DialogDescription>
            Compose a message to <strong>{recipientName}</strong>. The message will be generated and dispatched directly from the platform.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Enter message subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSending}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message">Message Content</Label>
            <Textarea
              id="message"
              placeholder="Write your message here..."
              className="min-h-[120px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSending}
            />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Label>Communication Channels</Label>
            <div className="flex flex-row gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendEmail"
                  checked={sendEmail}
                  onCheckedChange={(checked) => setSendEmail(!!checked)}
                  disabled={isSending}
                />
                <Label htmlFor="sendEmail" className="font-normal cursor-pointer select-none">
                  Send Email
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendInApp"
                  checked={sendInApp}
                  onCheckedChange={(checked) => setSendInApp(!!checked)}
                  disabled={isSending}
                />
                <Label htmlFor="sendInApp" className="font-normal cursor-pointer select-none">
                  In-App Notification
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending} className="min-w-[120px]">
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
