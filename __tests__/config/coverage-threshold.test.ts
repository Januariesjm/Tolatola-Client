/**
 * Guards the coverage floor itself (jest.coverage-threshold.js).
 *
 * `npm test` enforces the threshold, but nothing stopped someone from deleting
 * or zeroing it -- coverage enforcement would then be silently off while CI
 * stayed green. This suite fails in that case.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const threshold = require("../../jest.coverage-threshold") as {
  global?: Record<string, number>
}

const METRICS = ["statements", "branches", "functions", "lines"] as const

describe("coverage threshold", () => {
  it("defines a global block", () => {
    expect(threshold.global).toBeDefined()
  })

  it.each(METRICS)("enforces a non-zero floor for %s", (metric) => {
    const value = threshold.global?.[metric]

    expect(typeof value).toBe("number")
    expect(value).toBeGreaterThan(0)
  })

  it.each(METRICS)("keeps the %s floor within a sane 1-100 range", (metric) => {
    // A floor above 100 is unreachable and would fail every run; 0 disables it.
    expect(threshold.global?.[metric]).toBeLessThanOrEqual(100)
  })

  it("is wired into the Jest config rather than just sitting on disk", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const raw = require("fs").readFileSync(require("path").join(__dirname, "../../jest.config.js"), "utf8")

    expect(raw).toContain("coverageThreshold")
    expect(raw).toContain("jest.coverage-threshold")
  })
})
