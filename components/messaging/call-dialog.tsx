"use client"

import { useState, useEffect } from "react"
import { Phone, PhoneOff, Video, Mic, MicOff } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { logCall } from "@/app/actions/messaging"
import { toast } from "@/hooks/use-toast"

interface CallDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId: string
  callType: "voice" | "video"
  shopName: string
}

export function CallDialog({ open, onOpenChange, conversationId, callType, shopName }: CallDialogProps) {
  const [callStatus, setCallStatus] = useState<"calling" | "connected" | "ended">("calling")
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (callStatus === "connected") {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [callStatus])

  const handleEndCall = async () => {
    const status = callStatus === "connected" ? "completed" : "missed"

    // Log the call
    await logCall(conversationId, "", callType, status, duration)

    setCallStatus("ended")
    onOpenChange(false)

    // Reset state
    setTimeout(() => {
      setCallStatus("calling")
      setDuration(0)
    }, 500)

    toast({
      title: "Call Ended",
      description: `${callType === "voice" ? "Voice" : "Video"} call ended after ${formatDuration(duration)}`,
    })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Simulate call connection after 2 seconds
  useEffect(() => {
    if (open && callStatus === "calling") {
      const timeout = setTimeout(() => {
        setCallStatus("connected")
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [open, callStatus])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {callType === "voice" ? "Voice Call" : "Video Call"} with {shopName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-8 space-y-6">
          {callStatus === "calling" && (
            <div className="text-center space-y-2">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                {callType === "voice" ? (
                  <Phone className="h-10 w-10 text-primary" />
                ) : (
                  <Video className="h-10 w-10 text-primary" />
                )}
              </div>
              <p className="text-lg font-medium">Calling...</p>
            </div>
          )}

          {callStatus === "connected" && (
            <div className="text-center space-y-2">
              <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                {callType === "voice" ? (
                  <Phone className="h-10 w-10 text-green-500" />
                ) : (
                  <Video className="h-10 w-10 text-green-500" />
                )}
              </div>
              <p className="text-lg font-medium">Connected</p>
              <p className="text-2xl font-mono">{formatDuration(duration)}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              variant={muted ? "default" : "outline"}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={() => setMuted(!muted)}
            >
              {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            <Button variant="destructive" size="icon" className="h-12 w-12 rounded-full" onClick={handleEndCall}>
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            This is a simulated call interface. To enable real calling,
            <br />
            integrate with a service like Twilio or WebRTC.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
