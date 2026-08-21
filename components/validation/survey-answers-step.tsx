"use client"

/**
 * Step 2 of the validation survey: the 15-question survey itself.
 *
 * Extracted verbatim from app/validation/page.tsx.
 */

import { ChevronLeft, Loader2 } from "lucide-react"
import { RatingSlider } from "@/components/validation/rating-slider"
import { CHALLENGE_OPTIONS, CHANNEL_OPTIONS, FREQUENCY_OPTIONS, PAYMENT_OPTIONS, TIME_OPTIONS } from "@/lib/validation-survey-options"
import type { FormData } from "@/lib/validation-survey-form"
import { inputClasses, radioButtonClasses } from "@/lib/validation-survey-styles"

export interface SurveyAnswersStepProps {
  form: FormData
  errors: Record<string, string>
  onFieldChange: (key: keyof FormData, value: any) => void
  onToggleChannel: (channel: string) => void
  onBack: () => void
  onSubmit: () => void
  submitting: boolean
}

export function SurveyAnswersStep({
  form,
  errors,
  onFieldChange: set,
  onToggleChannel,
  onBack,
  onSubmit,
  submitting,
}: SurveyAnswersStepProps) {
  return (
    <>
      {errors._form && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{errors._form}</div>}

      {/* Q1 */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          <span className="text-primary font-bold mr-1">1.</span>Have you experienced challenges finding products, suppliers, customers or
          transporters within the last 12 months?
        </label>
        <div className="flex gap-3">
          {["Yes", "No"].map((v) => (
            <button key={v} type="button" className={radioButtonClasses(form.q1_challenges === v)} onClick={() => set("q1_challenges", v)}>
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
          <span className="text-primary font-bold mr-1">4.</span>How much time do you spend searching for products, suppliers, customers or
          transporters?
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
          <span className="text-primary font-bold mr-1">5.</span>Have you ever lost money due to fraud, non-delivery, wrong product or
          delayed payment?
        </label>
        <div className="flex gap-3">
          {["Yes", "No"].map((v) => (
            <button key={v} type="button" className={radioButtonClasses(form.q5_lost_money === v)} onClick={() => set("q5_lost_money", v)}>
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
            <button key={c} type="button" className={radioButtonClasses(form.q6_channels.includes(c))} onClick={() => onToggleChannel(c)}>
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
          <span className="text-primary font-bold mr-1">12.</span>If TOLA showed nearby suppliers first, how often would you use it?
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
        {errors.q12_nearby_suppliers_frequency && <p className="text-xs text-red-500 mt-1">{errors.q12_nearby_suppliers_frequency}</p>}
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
          <span className="text-primary font-bold mr-1">14.</span>How much would you be willing to pay for Escrow, Tracking and Buyer
          Protection?
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
          <span className="text-primary font-bold mr-1">15.</span>If you had to choose between your current method and TOLA, which would you
          choose and why?
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
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <button
          onClick={onSubmit}
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
  )
}
