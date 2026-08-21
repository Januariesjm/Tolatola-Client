"use client"

/**
 * Step 1 of the validation survey: respondent details.
 *
 * Extracted verbatim from app/validation/page.tsx.
 */

import { ChevronRight } from "lucide-react"
import { RESPONDENT_TYPES, TANZANIA_REGIONS } from "@/lib/validation-survey-options"
import type { FormData } from "@/lib/validation-survey-form"
import { inputClasses, radioButtonClasses, selectClasses } from "@/lib/validation-survey-styles"

export interface RespondentInfoStepProps {
  form: FormData
  errors: Record<string, string>
  onFieldChange: (key: keyof FormData, value: any) => void
  onContinue: () => void
}

export function RespondentInfoStep({ form, errors, onFieldChange: set, onContinue }: RespondentInfoStepProps) {
  return (
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
          onClick={onContinue}
          className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/20"
        >
          Continue <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </>
  )
}
