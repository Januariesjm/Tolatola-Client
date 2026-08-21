/**
 * Tests for the careers role data (lib/careers/jobs.ts).
 *
 * This was 170 lines of literals sitting above the careers component. The data
 * is now editable without touching a component, so these tests guard the shape
 * every posting has to satisfy and the two lookup fallbacks the page relies on.
 */

import { DEPARTMENT_COLORS, JOBS, WORK_MODE_ICONS, departmentColor, workModeIcon } from "@/lib/careers/jobs"

describe("JOBS", () => {
  it("lists at least one open role", () => {
    expect(JOBS.length).toBeGreaterThan(0)
  })

  it("gives every role the fields the listing renders", () => {
    for (const job of JOBS) {
      expect(job.title.trim()).not.toBe("")
      expect(job.type.trim()).not.toBe("")
      expect(job.mode.trim()).not.toBe("")
      expect(job.location.trim()).not.toBe("")
      expect(job.desc.trim()).not.toBe("")
      expect(job.dept.trim()).not.toBe("")
    }
  })

  it("has no duplicate titles, which are used as the application's position", () => {
    const titles = JOBS.map((j) => j.title)

    expect(new Set(titles).size).toBe(titles.length)
  })

  it("uses only departments that have a colour, so no badge falls back", () => {
    for (const job of JOBS) {
      expect(Object.keys(DEPARTMENT_COLORS)).toContain(job.dept)
    }
  })

  it("uses only work modes that have an icon", () => {
    for (const job of JOBS) {
      expect(Object.keys(WORK_MODE_ICONS)).toContain(job.mode)
    }
  })
})

describe("departmentColor", () => {
  it("returns the mapped classes for a known department", () => {
    const [dept, classes] = Object.entries(DEPARTMENT_COLORS)[0]

    expect(departmentColor(dept)).toBe(classes)
  })

  it.each([["Unknown Department"], [""]])("falls back to the muted badge for %p", (dept) => {
    // Same fallback the page used inline, so styling does not shift.
    expect(departmentColor(dept)).toBe("bg-muted text-muted-foreground")
  })
})

describe("workModeIcon", () => {
  it("returns the mapped icon for a known mode", () => {
    const [mode, icon] = Object.entries(WORK_MODE_ICONS)[0]

    expect(workModeIcon(mode)).toBe(icon)
  })

  it.each([["Unknown Mode"], [""]])("returns an empty string for %p", (mode) => {
    // Deliberately empty rather than a placeholder glyph, matching the previous
    // `modeIcons[job.mode] || ""`.
    expect(workModeIcon(mode)).toBe("")
  })
})
