"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import {
  MapPin,
  Laptop,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react"

interface AgentRegisterUserDialogProps {
  isOpen: boolean
  onClose: () => void
  type: "vendor" | "customer" | "transporter"
}

export function AgentRegisterUserDialog({
  isOpen,
  onClose,
  type,
}: AgentRegisterUserDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  // Form states
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [region, setRegion] = useState("")
  const [district, setDistrict] = useState("")
  const [area, setArea] = useState("")

  // Auto-captured metadata states
  const [gps, setGps] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null })
  const [gpsStatus, setGpsStatus] = useState<"loading" | "success" | "error">("loading")
  const [deviceInfo, setDeviceInfo] = useState("")

  // Load geo location and device user agent
  useEffect(() => {
    if (isOpen) {
      // Capture device info
      if (typeof window !== "undefined") {
        setDeviceInfo(navigator.userAgent)
      }

      // Capture GPS location
      setGpsStatus("loading")
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setGps({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            })
            setGpsStatus("success")
          },
          (error) => {
            console.error("GPS capturing failed:", error)
            setGpsStatus("error")
          },
          { enableHighAccuracy: true, timeout: 10000 }
        )
      } else {
        setGpsStatus("error")
      }
    }
  }, [isOpen])

  // Clear form on close
  const handleClose = () => {
    setFullName("")
    setPhone("")
    setEmail("")
    setRegion("")
    setDistrict("")
    setArea("")
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!fullName.trim() || !phone.trim()) {
      toast({
        title: "Kosa la Usajili",
        description: "Tafadhali jaza Jina Kamili na Namba ya Simu.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"

      const response = await fetch(`${apiBase}/agents/registrations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          registration_type: type,
          full_name: fullName,
          phone: phone,
          email: email || undefined,
          gps_latitude: gps.lat,
          gps_longitude: gps.lng,
          region: region || undefined,
          district: district || undefined,
          area: area || undefined,
          device_info: deviceInfo,
          referral_source: "agent_portal",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Registration failed")
      }

      toast({
        title: "Usajili Umefanikiwa!",
        description: `Mtumiaji ${fullName} amesajiliwa kikamilifu kama ${type}.`,
      })

      handleClose()
      // Refresh the page to show updated data
      window.location.reload()
    } catch (err: any) {
      console.error("[REGISTER DIALOG] Submission error:", err)
      toast({
        title: "Usajili Umeshindikana",
        description: err.message || "Hitilafu imetokea wakati wa usajili.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-full rounded-2xl p-6 overflow-hidden">
        <DialogHeader className="pb-4 border-b border-slate-100">
          <DialogTitle className="text-lg font-bold text-slate-900 capitalize">
            Usajili Mpya wa {type}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Jaza fomu hii kusajili mtumiaji mpya kwenye mfumo wa Tolatola.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs font-bold text-slate-700">Jina Kamili (Full Name) *</Label>
            <Input
              id="fullName"
              placeholder="Mf. Juma Kassim"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="rounded-xl border-slate-200"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-bold text-slate-700">Namba ya Simu *</Label>
            <Input
              id="phone"
              placeholder="Mf. 07XXXXXXXX au 2557XXXXXXXX"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-xl border-slate-200"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-bold text-slate-700">Barua Pepe (Email) — Si Lazima</Label>
            <Input
              id="email"
              placeholder="Mf. juma@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="region" className="text-xs font-bold text-slate-700">Mkoa (Region)</Label>
              <Input
                id="region"
                placeholder="Mf. Dar es Salaam"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="district" className="text-xs font-bold text-slate-700">Wilaya (District)</Label>
              <Input
                id="district"
                placeholder="Mf. Ilala"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="rounded-xl border-slate-200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="area" className="text-xs font-bold text-slate-700">Eneo (Area)</Label>
            <Input
              id="area"
              placeholder="Mf. Kariakoo, Sokoni"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="rounded-xl border-slate-200"
            />
          </div>

          {/* Metadata Auto-capture display indicator */}
          <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-2 mt-4">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Vipimo Vilivyokusanywa Kiotomatiki
            </h5>
            
            {/* GPS Capture Indicator */}
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <MapPin className="h-4 w-4 text-rose-500" />
                Eneo la GPS
              </span>
              <span>
                {gpsStatus === "loading" && (
                  <span className="flex items-center gap-1 text-slate-500 font-bold text-[10px]">
                    <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                    Inatafuta...
                  </span>
                )}
                {gpsStatus === "success" && (
                  <span className="flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Limesajiliwa
                  </span>
                )}
                {gpsStatus === "error" && (
                  <span className="flex items-center gap-1 text-slate-400 font-bold text-[10px]">
                    <AlertCircle className="h-3.5 w-3.5 text-slate-300" />
                    Haipatikani
                  </span>
                )}
              </span>
            </div>

            {/* Device Info */}
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <Laptop className="h-4 w-4 text-slate-500" />
                Kifaa cha Usajili
              </span>
              <span className="text-[10px] text-slate-400 font-bold max-w-[150px] truncate">
                {deviceInfo ? "Chrome/Safari Mobile" : "Inatambua..."}
              </span>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 flex flex-row items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="flex-1 rounded-xl text-slate-500 font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/10"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Inatuma...
                </>
              ) : (
                "Kamilisha Usajili"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
