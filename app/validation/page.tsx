"use client"

import { useState } from "react"
import { initialForm, validateAnswersStep, validateRespondentStep, type FormData } from "@/lib/validation-survey-form"
import { SurveyPageHeader } from "@/components/validation/survey-page-header"
import { SurveyThankYou } from "@/components/validation/survey-thank-you"
import { RespondentInfoStep } from "@/components/validation/respondent-info-step"
import { SurveyAnswersStep } from "@/components/validation/survey-answers-step"

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
            {step === 0 && <RespondentInfoStep form={form} errors={errors} onFieldChange={set} onContinue={handleNext} />}

            {/* ── STEP 1: Questionnaire ── */}
            {step === 1 && (
              <SurveyAnswersStep
                form={form}
                errors={errors}
                onFieldChange={set}
                onToggleChannel={toggleChannel}
                onBack={() => setStep(0)}
                onSubmit={handleSubmit}
                submitting={submitting}
              />
            )}

            {/* ── STEP 2: Thank You ── */}
            {step === 2 && <SurveyThankYou />}
          </div>
        </div>
      </main>
    </div>
  )
}
