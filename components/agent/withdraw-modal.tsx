"use client"

/**
 * The withdrawal request modal for the agent commission tab.
 *
 * Extracted verbatim from components/agent/agent-commission-tab.tsx.
 * Presentational -- the state and the submit handler live in
 * hooks/use-agent-wallet.ts; this only renders the form and calls back into it.
 */

import type React from "react"
import { ArrowRight, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatTzs } from "@/lib/agent/wallet"

export interface WithdrawModalProps {
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  withdrawableBalance: number
  paymentMethod: string
  onPaymentMethodChange: (method: string) => void
  phoneNumber: string
  onPhoneNumberChange: (value: string) => void
  withdrawAmount: string
  onWithdrawAmountChange: (value: string) => void
  onQuickPercent: (percent: number) => void
  calculatedFee: number
  payoutAfterFee: number
  isSubmitLoading: boolean
}

export function WithdrawModal({
  onClose,
  onSubmit,
  withdrawableBalance,
  paymentMethod,
  onPaymentMethodChange,
  phoneNumber,
  onPhoneNumberChange,
  withdrawAmount,
  onWithdrawAmountChange,
  onQuickPercent,
  calculatedFee,
  payoutAfterFee,
  isSubmitLoading,
}: WithdrawModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Kutoa Salio Kutoka Kwenye Wallet</h3>
            <p className="text-xs text-slate-400">Salio la Kutoa: {formatTzs(withdrawableBalance)}</p>
          </div>
          <button
            onClick={() => onClose()}
            className="text-slate-400 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          {/* Payment Operator Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">Mtoa Huduma wa Mtandao</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "m-pesa", label: "Vodacom M-Pesa", color: "border-red-500 text-red-600 bg-red-50/10" },
                { id: "tigo-pesa", label: "Tigo Pesa", color: "border-blue-500 text-blue-600 bg-blue-50/10" },
                { id: "airtel-money", label: "Airtel Money", color: "border-rose-600 text-rose-600 bg-rose-50/10" },
                { id: "halopesa", label: "Halopesa", color: "border-orange-500 text-orange-600 bg-orange-50/10" },
              ].map((operator) => (
                <button
                  key={operator.id}
                  type="button"
                  onClick={() => onPaymentMethodChange(operator.id)}
                  className={`flex items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                    paymentMethod === operator.id
                      ? `${operator.color} border-2 ring-2 ring-emerald-500/25`
                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {operator.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Phone Number */}
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-bold text-slate-700">
              Namba ya Simu ya Kupokelea (e.g. 07XXXXXXXX au 06XXXXXXXX)
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Mfano: 0754123456"
              required
              value={phoneNumber}
              onChange={(e) => onPhoneNumberChange(e.target.value)}
              className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm font-semibold h-11"
            />
          </div>

          {/* Amount Field */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="amount" className="text-xs font-bold text-slate-700">
                Kiasi cha Kutoa
              </Label>
              <span className="text-[10px] font-bold text-slate-400">Tzs pekee</span>
            </div>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder="Mfano: 10000"
                required
                value={withdrawAmount}
                onChange={(e) => onWithdrawAmountChange(e.target.value)}
                className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 font-black text-slate-800 text-base h-11 pl-12"
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-sm text-slate-400 font-bold">TZS</span>
              </div>
            </div>

            {/* Quick Chips Selection */}
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => onQuickPercent(0.25)}
                className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => onQuickPercent(0.5)}
                className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => onQuickPercent(0.75)}
                className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                75%
              </button>
              <button
                type="button"
                onClick={() => onQuickPercent(1.0)}
                className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100"
              >
                Salio Lote (Max)
              </button>
            </div>
          </div>

          {/* Live Fee Computation Panel */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs space-y-2.5">
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Kiasi cha Kutoa:</span>
              <span>{formatTzs(Number(withdrawAmount || 0))}</span>
            </div>
            <div className="flex justify-between text-rose-500 font-semibold">
              <span className="flex items-center gap-1">Gharama ya Muamala (10%):</span>
              <span>-{formatTzs(calculatedFee)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200/60 pt-2.5 text-slate-800 font-black text-sm">
              <span>Utapokea (Net):</span>
              <span className="text-emerald-600">{formatTzs(payoutAfterFee)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()}
              className="flex-1 rounded-xl font-bold h-11 text-xs border-slate-200 hover:bg-slate-50"
            >
              Ghairi
            </Button>
            <Button
              type="submit"
              disabled={isSubmitLoading || !withdrawAmount || Number(withdrawAmount) <= 0}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold h-11 text-xs rounded-xl shadow-lg shadow-emerald-500/25 border-none transition-transform active:scale-95 gap-1.5"
            >
              {isSubmitLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Inatuma...
                </>
              ) : (
                <>
                  Thibitisha Utoaji
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
