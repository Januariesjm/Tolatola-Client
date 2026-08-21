"use client"

/**
 * The "Rates" sub-tab of the admin agent management page: editable referral
 * commission rates per registration type.
 *
 * Extracted verbatim from components/admin/agent-management-tab.tsx, with one
 * change beyond the extraction itself: the per-registration-type display
 * config was a literal re-created on every row of the `.map()`; it is now a
 * module-level constant, computed once rather than once per rate per render.
 */

import type React from "react"
import { Coins, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { AgentCommissionRate } from "@/lib/admin/agent-types"

const REGISTRATION_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; border: string }> = {
  vendor: { label: "Vendor Registration", icon: "🏪", color: "bg-emerald-50 text-emerald-800", border: "border-emerald-200" },
  customer: { label: "Customer Registration", icon: "👤", color: "bg-blue-50 text-blue-800", border: "border-blue-200" },
  transporter: { label: "Transporter Registration", icon: "🚚", color: "bg-amber-50 text-amber-800", border: "border-amber-200" },
}

export interface RatesSubTabProps {
  rates: AgentCommissionRate[]
  isUpdatingRates: boolean
  onRateAmountChange: (registrationType: string, value: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export function RatesSubTab({ rates, isUpdatingRates, onRateAmountChange, onSubmit }: RatesSubTabProps) {
  return (
    <Card className="shadow-sm rounded-xl border border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Coins className="h-4.5 w-4.5 text-teal-500" />
          Referral Commission Rates
        </CardTitle>
        <CardDescription className="text-xs">
          Set the commission amount (in TZS) agents earn for each type of referral registration. Changes apply immediately to all future
          referrals.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rates.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-xs text-slate-400">No commission rates configured yet.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {rates.map((rate) => {
                const typeConfig: Record<string, { label: string; icon: string; color: string; border: string }> = {
                  vendor: {
                    label: "Vendor Registration",
                    icon: "🏪",
                    color: "bg-emerald-50 text-emerald-800",
                    border: "border-emerald-200",
                  },
                  customer: {
                    label: "Customer Registration",
                    icon: "👤",
                    color: "bg-blue-50 text-blue-800",
                    border: "border-blue-200",
                  },
                  transporter: {
                    label: "Transporter Registration",
                    icon: "🚚",
                    color: "bg-amber-50 text-amber-800",
                    border: "border-amber-200",
                  },
                }
                const config = typeConfig[rate.registration_type] || {
                  label: rate.registration_type,
                  icon: "📋",
                  color: "bg-slate-50 text-slate-800",
                  border: "border-slate-200",
                }
                return (
                  <div
                    key={rate.registration_type}
                    className={`rounded-xl border ${config.border} p-5 space-y-3 transition-all hover:shadow-md`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{config.icon}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.color}`}>{config.label}</span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Commission Amount (TZS)</label>
                      <Input
                        type="number"
                        min={0}
                        step={100}
                        value={rate.amount}
                        onChange={(e) => onRateAmountChange(rate.registration_type, e.target.value)}
                        className="rounded-xl text-sm h-10 font-bold"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Current: <span className="font-bold text-slate-600">TZS {(rate.amount || 0).toLocaleString()}</span> per referral
                    </p>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isUpdatingRates}
                className="rounded-xl text-xs h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/10"
              >
                {isUpdatingRates ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Commission Rates"
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
