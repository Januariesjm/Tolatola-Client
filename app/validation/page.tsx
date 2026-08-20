"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, ClipboardList } from "lucide-react"
import {
  CHALLENGE_OPTIONS,
  CHANNEL_OPTIONS,
  FREQUENCY_OPTIONS,
  PAYMENT_OPTIONS,
  RESPONDENT_TYPES,
  TANZANIA_REGIONS,
  TIME_OPTIONS,
} from "@/lib/validation-survey-options"
import { initialForm, validateAnswersStep, validateRespondentStep, type FormData } from "@/lib/validation-survey-form"
import { RatingSlider } from "@/components/validation/rating-slider"
import { SurveyPageHeader } from "@/components/validation/survey-page-header"
import { SurveyThankYou } from "@/components/validation/survey-thank-you"
import { inputClasses, radioButtonClasses, selectClasses } from "@/lib/validation-survey-styles"

export default function ValidationSurveyPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const set = (key: keyof FormData, val: any) => {
    setForm((prev) => ({ ...prev, [key]: val }))
    setErrors((prev) => {
      const n = { ...prev }
      delete n[key]
      return n
    })
  }

  const toggleChannel = (ch: string) => {
    setForm((prev) => ({
      ...prev,
      q6_channels: prev.q6_channels.includes(ch) ? prev.q6_channels.filter((c) => c !== ch) : [...prev.q6_channels, ch],
    }))
  }

  const validateStep0 = () => {
    const e = validateRespondentStep(form)
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep1 = () => {
    const e = validateAnswersStep(form)
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (step === 0 && validateStep0()) setStep(1)
  }

  const handleSubmit = async () => {
    if (!validateStep1()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/validation-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Submission failed")
      setSubmitted(true)
      setStep(2)
    } catch {
      setErrors({ _form: "Failed to submit survey. Please try again." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary/[0.03] to-slate-100">
      {/* Header */}
      <SurveyPageHeader />

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
        {/* Progress */}
        {step < 2 && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
              <span>Step {step + 1} of 2</span>
              <span>{step === 0 ? "Your Information" : "Survey Questions"}</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: step === 0 ? "50%" : "100%" }}
              />
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-white/90 backdrop-blur border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden">
          {/* Title banner */}
          {step < 2 && (
            <div className="bg-gradient-to-r from-primary to-emerald-600 px-6 py-5 text-white">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">TOLA Market Validation Survey</h1>
              <p className="text-white/80 text-sm mt-1">
                {step === 0 ? "Help us understand who you are." : "Share your experience and preferences."}
              </p>
            </div>
          )}

          <div className="p-6 md:p-8 space-y-6">
            {/* ── STEP 0: Respondent Information ── */}
            {step === 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name *</label>
                    <input
                      className={inputClasses(errors, "full_name")}
                      placeholder="John Doe"
                      value={form.full_name}
                      onChange={(e) => set("full_name", e.target.value)}
                    />
                    {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number *</label>
                    <input
                      className={inputClasses(errors, "phone")}
                      placeholder="+255 7XX XXX XXX"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                    />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address (Optional)</label>
                    <input
                      className={inputClasses(errors, "email")}
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Region *</label>
                    <select className={selectClasses(errors, "region")} value={form.region} onChange={(e) => set("region", e.target.value)}>
                      <option value="">Select region</option>
                      {TANZANIA_REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    {errors.region && <p className="text-xs text-red-500 mt-1">{errors.region}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">District *</label>
                    <input
                      className={inputClasses(errors, "district")}
                      placeholder="e.g. Ilala"
                      value={form.district}
                      onChange={(e) => set("district", e.target.value)}
                    />
                    {errors.district && <p className="text-xs text-red-500 mt-1">{errors.district}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location / Ward *</label>
                    <input
                      className={inputClasses(errors, "location_ward")}
                      placeholder="e.g. Kariakoo"
                      value={form.location_ward}
                      onChange={(e) => set("location_ward", e.target.value)}
                    />
                    {errors.location_ward && <p className="text-xs text-red-500 mt-1">{errors.location_ward}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Respondent Type *</label>
                  <div className="flex flex-wrap gap-2">
                    {RESPONDENT_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={radioButtonClasses(form.respondent_type === t)}
                        onClick={() => set("respondent_type", t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {errors.respondent_type && <p className="text-xs text-red-500 mt-1">{errors.respondent_type}</p>}
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <input
                    type="checkbox"
                    id="assisted_by_agent"
                    checked={form.assisted_by_agent}
                    onChange={(e) => {
                      const checked = e.target.checked
                      set("assisted_by_agent", checked)
                      if (!checked) set("agent_name", "")
                    }}
                    className="h-4.5 w-4.5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="assisted_by_agent" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                    Assisted by a TOLA agent?
                  </label>
                </div>

                {form.assisted_by_agent && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 font-semibold">Agent Name *</label>
                    <input
                      className={inputClasses(errors, "agent_name")}
                      placeholder="Enter the name of the agent who assisted you"
                      value={form.agent_name}
                      onChange={(e) => set("agent_name", e.target.value)}
                    />
                    {errors.agent_name && <p className="text-xs text-red-500 mt-1">{errors.agent_name}</p>}
                  </div>
                )}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/20"
                  >
                    Continue <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 1: Questionnaire ── */}
            {step === 1 && (
              <>
                {errors._form && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{errors._form}</div>
                )}

                {/* Q1 */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="text-primary font-bold mr-1">1.</span>Have you experienced challenges finding products, suppliers,
                    customers or transporters within the last 12 months?
                  </label>
                  <div className="flex gap-3">
                    {["Yes", "No"].map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={radioButtonClasses(form.q1_challenges === v)}
                        onClick={() => set("q1_challenges", v)}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  {errors.q1_challenges && <p className="text-xs text-red-500 mt-1">{errors.q1_challenges}</p>}
                </div>

                {/* Q2 */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="text-primary font-bold mr-1">2.</span>What was the biggest challenge?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CHALLENGE_OPTIONS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={radioButtonClasses(form.q2_biggest_challenge === c)}
                        onClick={() => set("q2_biggest_challenge", c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  {errors.q2_biggest_challenge && <p className="text-xs text-red-500 mt-1">{errors.q2_biggest_challenge}</p>}
                </div>

                {/* Q3 */}
                <RatingSlider
                  label="Rate the impact of that challenge on your business."
                  value={form.q3_impact_rating}
                  onChange={(v) => set("q3_impact_rating", v)}
                  questionNum="3"
                />

                {/* Q4 */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="text-primary font-bold mr-1">4.</span>How much time do you spend searching for products, suppliers,
                    customers or transporters?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TIME_OPTIONS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={radioButtonClasses(form.q4_time_searching === t)}
                        onClick={() => set("q4_time_searching", t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {errors.q4_time_searching && <p className="text-xs text-red-500 mt-1">{errors.q4_time_searching}</p>}
                </div>

                {/* Q5 */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="text-primary font-bold mr-1">5.</span>Have you ever lost money due to fraud, non-delivery, wrong
                    product or delayed payment?
                  </label>
                  <div className="flex gap-3">
                    {["Yes", "No"].map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={radioButtonClasses(form.q5_lost_money === v)}
                        onClick={() => set("q5_lost_money", v)}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  {errors.q5_lost_money && <p className="text-xs text-red-500 mt-1">{errors.q5_lost_money}</p>}
                </div>

                {/* Q6 */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="text-primary font-bold mr-1">6.</span>Which channels do you currently use? (Select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CHANNEL_OPTIONS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={radioButtonClasses(form.q6_channels.includes(c))}
                        onClick={() => toggleChannel(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  {errors.q6_channels && <p className="text-xs text-red-500 mt-1">{errors.q6_channels}</p>}
                </div>

                {/* Q7–Q10 sliders */}
                <RatingSlider
                  label="How satisfied are you with your current method?"
                  value={form.q7_satisfaction_rating}
                  onChange={(v) => set("q7_satisfaction_rating", v)}
                  questionNum="7"
                />
                <RatingSlider
                  label="How valuable would a platform connecting Buyers, Vendors and Transporters be?"
                  value={form.q8_platform_value_rating}
                  onChange={(v) => set("q8_platform_value_rating", v)}
                  questionNum="8"
                />
                <RatingSlider
                  label="How important is TOLA Escrow Payment Protection?"
                  value={form.q9_escrow_importance}
                  onChange={(v) => set("q9_escrow_importance", v)}
                  questionNum="9"
                />
                <RatingSlider
                  label="How important is TOLA Buyer Protection and Dispute Resolution?"
                  value={form.q10_buyer_protection_importance}
                  onChange={(v) => set("q10_buyer_protection_importance", v)}
                  questionNum="10"
                />

                {/* Q11 */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="text-primary font-bold mr-1">11.</span>Can OTP Delivery Confirmation reduce payment disputes?
                  </label>
                  <div className="flex gap-3">
                    {["Yes", "No", "Not Sure"].map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={radioButtonClasses(form.q11_otp_reduces_disputes === v)}
                        onClick={() => set("q11_otp_reduces_disputes", v)}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  {errors.q11_otp_reduces_disputes && <p className="text-xs text-red-500 mt-1">{errors.q11_otp_reduces_disputes}</p>}
                </div>

                {/* Q12 */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="text-primary font-bold mr-1">12.</span>If TOLA showed nearby suppliers first, how often would you use
                    it?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {FREQUENCY_OPTIONS.map((f) => (
                      <button
                        key={f}
                        type="button"
                        className={radioButtonClasses(form.q12_nearby_suppliers_frequency === f)}
                        onClick={() => set("q12_nearby_suppliers_frequency", f)}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  {errors.q12_nearby_suppliers_frequency && (
                    <p className="text-xs text-red-500 mt-1">{errors.q12_nearby_suppliers_frequency}</p>
                  )}
                </div>

                {/* Q13 */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="text-primary font-bold mr-1">13.</span>Are you willing to pay for a secure trade and logistics service?
                  </label>
                  <div className="flex gap-3">
                    {["Yes", "No", "Maybe"].map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={radioButtonClasses(form.q13_willing_to_pay === v)}
                        onClick={() => set("q13_willing_to_pay", v)}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  {errors.q13_willing_to_pay && <p className="text-xs text-red-500 mt-1">{errors.q13_willing_to_pay}</p>}
                </div>

                {/* Q14 */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="text-primary font-bold mr-1">14.</span>How much would you be willing to pay for Escrow, Tracking and
                    Buyer Protection?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PAYMENT_OPTIONS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={radioButtonClasses(form.q14_payment_amount === p)}
                        onClick={() => set("q14_payment_amount", p)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  {errors.q14_payment_amount && <p className="text-xs text-red-500 mt-1">{errors.q14_payment_amount}</p>}
                </div>

                {/* Q15 */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="text-primary font-bold mr-1">15.</span>If you had to choose between your current method and TOLA, which
                    would you choose and why?
                  </label>
                  <textarea
                    className={inputClasses(errors, "q15_choice_and_reason")}
                    rows={4}
                    placeholder="Share your thoughts..."
                    value={form.q15_choice_and_reason}
                    onChange={(e) => set("q15_choice_and_reason", e.target.value)}
                  />
                  {errors.q15_choice_and_reason && <p className="text-xs text-red-500 mt-1">{errors.q15_choice_and_reason}</p>}
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setStep(0)}
                    className="flex items-center gap-2 px-6 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/20 disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                      </>
                    ) : (
                      "Submit Survey"
                    )}
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 2: Thank You ── */}
            {step === 2 && <SurveyThankYou />}
          </div>
        </div>
      </main>
    </div>
  )
}
