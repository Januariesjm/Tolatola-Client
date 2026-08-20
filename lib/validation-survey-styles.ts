/**
 * Shared Tailwind class builders for the market-validation survey form.
 *
 * Extracted from app/validation/page.tsx to keep it under the 500-line limit,
 * and so the invalid-field styling is defined once rather than per control.
 * The output strings are byte-identical to the inline versions they replaced.
 */

type FieldErrors = Record<string, string>

const fieldState = (errors: FieldErrors, key: string) => (errors[key] ? "border-red-400 bg-red-50/50" : "border-slate-200 bg-white")

/** Text input classes, red-tinted when that field has an error. */
export const inputClasses = (errors: FieldErrors, key: string) =>
  `w-full px-4 py-3 rounded-xl border ${fieldState(errors, key)} focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition text-sm`

/** Select classes: the input styling plus `appearance-none`. */
export const selectClasses = (errors: FieldErrors, key: string) => `${inputClasses(errors, key)} appearance-none`

/** Radio-style option button classes. */
export const radioButtonClasses = (active: boolean) =>
  `px-4 py-2.5 rounded-xl border text-sm font-medium cursor-pointer transition-all ${active ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`
