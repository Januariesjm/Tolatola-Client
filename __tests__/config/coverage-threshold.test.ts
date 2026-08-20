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

  it("is declared in the Jest config", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const raw = require("fs").readFileSync(require("path").join(__dirname, "../../jest.config.js"), "utf8")

    expect(raw).toContain("coverageThreshold")
  })

  it.each(METRICS)("matches the %s value declared inline in jest.config.js", (metric) => {
    // The config declares the numbers inline so tooling can read them; this
    // module mirrors them. Drift between the two would be silent otherwise.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const raw = require("fs").readFileSync(require("path").join(__dirname, "../../jest.config.js"), "utf8")
    const inline = raw.match(new RegExp(`${metric}:\\s*(\\d+)`))

    expect(inline).not.toBeNull()
    expect(Number(inline?.[1])).toBe(threshold.global?.[metric])
  })
})
