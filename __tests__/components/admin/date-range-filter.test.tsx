/**
 * Tests for components/admin/date-range-filter.tsx: the DateRangeFilter
 * button group and the standalone filterByDateRange<T> utility it's usually
 * paired with. The utility has one branch per period (today/week/month/
 * year/all/default) plus the missing-date-field guard, so those are the
 * priority; the component itself just needs its selected/click wiring
 * checked.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { startOfDay, startOfWeek, startOfMonth, startOfYear } from "date-fns"
import { DateRangeFilter, filterByDateRange, type DatePeriod } from "@/components/admin/date-range-filter"

describe("filterByDateRange", () => {
  // A fixed instant, but the cutoffs below are derived from date-fns itself
  // (as the component does) rather than hardcoded ISO literals, so the
  // comparisons hold regardless of the machine's local timezone.
  const now = new Date("2026-08-21T12:00:00Z")
  const ONE_MS = 1

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("returns every item unchanged for period 'all'", () => {
    const items = [{ created_at: "2020-01-01" }, { created_at: "2026-08-21" }]

    expect(filterByDateRange(items, "all")).toBe(items)
  })

  it("keeps only items at/after the start of today for period 'today'", () => {
    const cutoff = startOfDay(now)
    const items = [
      { id: 1, created_at: cutoff.toISOString() }, // exactly at cutoff, kept
      { id: 2, created_at: new Date(cutoff.getTime() - ONE_MS).toISOString() }, // just before, dropped
    ]

    const result = filterByDateRange(items, "today")

    expect(result.map((i) => i.id)).toEqual([1])
  })

  it("keeps items from Monday of this week for period 'week'", () => {
    const cutoff = startOfWeek(now, { weekStartsOn: 1 })
    const items = [
      { id: 1, created_at: cutoff.toISOString() },
      { id: 2, created_at: new Date(cutoff.getTime() - ONE_MS).toISOString() },
    ]

    const result = filterByDateRange(items, "week")

    expect(result.map((i) => i.id)).toEqual([1])
  })

  it("keeps items from the 1st of this month for period 'month'", () => {
    const cutoff = startOfMonth(now)
    const items = [
      { id: 1, created_at: cutoff.toISOString() },
      { id: 2, created_at: new Date(cutoff.getTime() - ONE_MS).toISOString() },
    ]

    const result = filterByDateRange(items, "month")

    expect(result.map((i) => i.id)).toEqual([1])
  })

  it("keeps items from Jan 1 of this year for period 'year'", () => {
    const cutoff = startOfYear(now)
    const items = [
      { id: 1, created_at: cutoff.toISOString() },
      { id: 2, created_at: new Date(cutoff.getTime() - ONE_MS).toISOString() },
    ]

    const result = filterByDateRange(items, "year")

    expect(result.map((i) => i.id)).toEqual([1])
  })

  it("drops items whose date field is missing/falsy", () => {
    const items = [{ id: 1, created_at: "" }, { id: 2 }, { id: 3, created_at: now.toISOString() }]

    const result = filterByDateRange(items as Array<Record<string, unknown>>, "today")

    expect(result.map((i) => i.id)).toEqual([3])
  })

  it("reads a custom dateField instead of created_at when given", () => {
    const items = [
      { id: 1, uploaded_at: now.toISOString() },
      { id: 2, uploaded_at: "2020-01-01T00:00:00Z" },
    ]

    const result = filterByDateRange(items, "today", "uploaded_at")

    expect(result.map((i) => i.id)).toEqual([1])
  })

  it("falls through to returning items unchanged for an unrecognized period", () => {
    const items = [{ created_at: "2020-01-01" }]

    // Cast to bypass the DatePeriod union for this defensive-default check.
    const result = filterByDateRange(items, "bogus" as DatePeriod)

    expect(result).toEqual(items)
  })
})

describe("DateRangeFilter", () => {
  it("renders all five period buttons with their labels", () => {
    render(<DateRangeFilter value="all" onChange={jest.fn()} />)

    expect(screen.getByRole("button", { name: "Today" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "This Week" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "This Month" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "This Year" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "All Time" })).toBeInTheDocument()
  })

  it("highlights the currently selected period", () => {
    render(<DateRangeFilter value="week" onChange={jest.fn()} />)

    expect(screen.getByRole("button", { name: "This Week" })).toHaveClass("bg-primary")
    expect(screen.getByRole("button", { name: "Today" })).not.toHaveClass("bg-primary")
  })

  it("calls onChange with the clicked period's value", async () => {
    const onChange = jest.fn()
    render(<DateRangeFilter value="all" onChange={onChange} />)

    await userEvent.click(screen.getByRole("button", { name: "This Month" }))

    expect(onChange).toHaveBeenCalledWith("month")
  })

  it("applies a caller-supplied className alongside its own", () => {
    render(<DateRangeFilter value="all" onChange={jest.fn()} className="my-extra-class" />)

    expect(screen.getByRole("button", { name: "Today" }).parentElement).toHaveClass("my-extra-class")
  })
})
