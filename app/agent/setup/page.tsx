"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, ShieldCheck, Eye, EyeOff, KeyRound, Check } from "lucide-react"

export default function AgentSetupPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [agentName, setAgentName] = useState("")

  const supabase = createClient()

  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setError("Session yako imekwisha au haipo. Tafadhali bonyeza kiungo kwenye barua pepe yako tena, au wasiliana na msimamizi wako.")
          setIsVerifying(false)
          return
        }

        // Get user profile details
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"
        const res = await fetch(`${apiBase}/agents/my-role`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })

        const roleData = await res.json()
        if (!roleData.allowed) {
          setError("Akaunti hii haina ruhusa ya wakala. Wasiliana na msimamizi.")
          setIsVerifying(false)
          return
        }

        // Get full name from session user metadata or profile
        const fullName = session.user?.user_metadata?.full_name || "Mwanachama mpya"
        setAgentName(fullName)
        setIsVerifying(false)
      } catch (err) {
        console.error("Setup session check error:", err)
        setError("Imeshindikana kuthibitisha kikao chako.")
        setIsVerifying(false)
      }
    }

    checkSession()
  }, [])

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError("Nywila lazima iwe na angalau herufi 8 (Password must be at least 8 characters).")
      return
    }
    if (password !== confirmPassword) {
      setError("Nywila hazilingani (Passwords do not match).")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        throw updateError
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/agent")
      }, 2500)
    } catch (err: any) {
      setError(err?.message || "Imeshindikana kusasisha nywila. Jaribu tena.")
    } finally {
      setIsLoading(false)
    }
  }

  // Password criteria checklist
  const hasMinLength = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-emerald-500 animate-spin mx-auto" />
          <p className="text-slate-400 text-sm font-semibold">Tafadhali subiri, tunathibitisha kikao chako...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 selection:bg-emerald-500 selection:text-white">
      {/* Dynamic light effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-emerald-950/20">
          
          {/* Success screen */}
          {success ? (
            <div className="text-center py-8 space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-3xl text-emerald-400 shadow-xl shadow-emerald-500/10">
                <ShieldCheck className="h-10 w-10 animate-bounce" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white tracking-tight">Hongera! Nywila Imesasishwa</h2>
                <p className="text-sm text-slate-400">
                  Akaunti yako imekamilika kwa mafanikio. Tunakuhamishia kwenye dashibodi sasa hivi...
                </p>
              </div>
              <div className="pt-4">
                <Loader2 className="h-6 w-6 text-emerald-500 animate-spin mx-auto" />
              </div>
            </div>
          ) : (
            <>
              {/* Logo & Intro */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl mb-4 shadow-lg shadow-emerald-500/25">
                  <KeyRound className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Tengeneza Nywila Yako
                </h1>
                <p className="text-xs text-slate-400 mt-1.5 uppercase font-black tracking-widest text-emerald-400">
                  {agentName ? `Karibu, ${agentName}` : "TOLA Agent Portal"}
                </p>
                <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">
                  Weka nywila mpya na salama ili uweze kuingia na kuanza kufanya kazi kama wakala.
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                  <p className="text-xs text-rose-400 leading-relaxed font-semibold">{error}</p>
                  {!agentName && (
                    <Button 
                      variant="link" 
                      onClick={() => router.push("/agent/login")} 
                      className="text-xs text-emerald-400 p-0 h-auto mt-2 font-bold hover:text-emerald-300"
                    >
                      Nenda kwenye ukurasa wa kuingia (Login Page) →
                    </Button>
                  )}
                </div>
              )}

              {agentName && (
                <form onSubmit={handleSetupPassword} className="space-y-6">
                  {/* Password Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Nywila Mpya (New Password)
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Herufi 8 au zaidi"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl pr-12 focus:border-emerald-500 focus:ring-emerald-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Thibitisha Nywila (Confirm Password)
                    </label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Thibitisha nywila yako"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl focus:border-emerald-500 focus:ring-emerald-500/20"
                    />
                  </div>

                  {/* Password Strength Checklist */}
                  <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password Requirements:</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className={`h-4 w-4 rounded-full flex items-center justify-center ${hasMinLength ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-600"}`}>
                          <Check className="h-3 w-3" />
                        </div>
                        <span className={hasMinLength ? "text-slate-300" : "text-slate-500"}>Herufi 8+</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`h-4 w-4 rounded-full flex items-center justify-center ${hasUpper ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-600"}`}>
                          <Check className="h-3 w-3" />
                        </div>
                        <span className={hasUpper ? "text-slate-300" : "text-slate-500"}>Herufi Kubwa (A)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`h-4 w-4 rounded-full flex items-center justify-center ${hasLower ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-600"}`}>
                          <Check className="h-3 w-3" />
                        </div>
                        <span className={hasLower ? "text-slate-300" : "text-slate-500"}>Herufi Ndogo (a)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`h-4 w-4 rounded-full flex items-center justify-center ${hasNumber ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-600"}`}>
                          <Check className="h-3 w-3" />
                        </div>
                        <span className={hasNumber ? "text-slate-300" : "text-slate-500"}>Namba (0-9)</span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading || !hasMinLength || password !== confirmPassword}
                    className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-300"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Kusajili Nywila...
                      </>
                    ) : (
                      "Kamilisha Akaunti (Activate Account)"
                    )}
                  </Button>
                </form>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  )
}
