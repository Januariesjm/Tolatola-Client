"use client"

import { startOfDay, startOfWeek, startOfMonth, startOfYear } from "date-fns"

// ── Types ──────────────────────────────────────────────────────────
export type DatePeriod = "today" | "week" | "month" | "year" | "all"

interface DateRangeFilterProps {
  value: DatePeriod
  onChange: (period: DatePeriod) => void
  className?: string
}

// ── Utility: filter any array by a date field ──────────────────────
export function filterByDateRange<T extends Record<string, any>>(
  items: T[],
  period: DatePeriod,
  dateField: string = "created_at",
): T[] {
  if (period === "all") return items

  const now = new Date()
  let cutoff: Date

  switch (period) {
    case "today":
      cutoff = startOfDay(now)
      break
    case "week":
      cutoff = startOfWeek(now, { weekStartsOn: 1 }) // Monday
      break
    case "month":
      cutoff = startOfMonth(now)
      break
    case "year":
      cutoff = startOfYear(now)
      break
    default:
      return items
  }

  return items.filter((item) => {
    const d = item[dateField]
    if (!d) return false
    return new Date(d) >= cutoff
  })
}

// ── Component ──────────────────────────────────────────────────────
const periods: { value: DatePeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
]

export function DateRangeFilter({ value, onChange, className = "" }: DateRangeFilterProps) {
  return (
    <div className={`inline-flex items-center gap-1 rounded-xl bg-white border border-slate-200 p-1 shadow-sm ${className}`}>
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`
            px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
            ${
              value === p.value
                ? "bg-primary text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }
          `}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
