#!/usr/bin/env node
/**
 * Gates CI on critical npm advisories while allowing the specific Next.js
 * advisories that are already documented as accepted debt.
 *
 * `npm audit --audit-level=critical` cannot express an allowlist, so this runs
 * audit with --json and inspects the advisories itself. Any critical finding
 * that is not listed below still fails the job.
 *
 * Why an allowlist: Next 14.2.35 is the last 14.x release and carries
 * unpatched critical RCE advisories. The fix (Next 15.5.28+ / 16.x) is a
 * planned framework migration, tracked in docs/NEXT_16_UPGRADE_PLAN.md.
 * Remove entries from ACCEPTED_CRITICAL_ADVISORIES once that upgrade lands.
 */
import { spawnSync } from "node:child_process"

const ACCEPTED_CRITICAL_ADVISORIES = new Set([
  "GHSA-p293-qw3h-jr36", // Next.js RCE on Windows-hosted servers
  "GHSA-2xp9-vwfh-vxw4", // Next.js RCE in the Image Optimization API (AVIF)
  "GHSA-2464-fhr4-w9xw", // Next.js RCE in the Image Optimization API (SVG)
])

function advisoryId(url) {
  return typeof url === "string" ? url.split("/").pop() : null
}

const result = spawnSync("npm", ["audit", "--json"], {
  encoding: "utf8",
  maxBuffer: 32 * 1024 * 1024,
})

let report
try {
  report = JSON.parse(result.stdout)
} catch {
  console.error("Unable to parse `npm audit --json` output.")
  if (result.stderr) console.error(result.stderr.trim())
  else if (result.stdout) console.error(result.stdout.slice(0, 2000))
  process.exit(1)
}

if (report.error || !report.vulnerabilities) {
  console.error("`npm audit --json` did not return a vulnerability report.")
  if (report.error) console.error(JSON.stringify(report.error))
  process.exit(1)
}

const blocking = []
const accepted = []

for (const [name, vulnerability] of Object.entries(report.vulnerabilities)) {
  if (vulnerability.severity !== "critical") continue

  const criticalAdvisories = (vulnerability.via ?? []).filter(
    (advisory) => typeof advisory === "object" && advisory.severity === "critical",
  )

  // A package that is only critical through a vulnerable dependency has no
  // advisory of its own here. Fail rather than guess whether it is accepted.
  if (criticalAdvisories.length === 0) {
    blocking.push({ name, reason: "critical through a dependency" })
    continue
  }

  const unaccepted = criticalAdvisories.filter((advisory) => !ACCEPTED_CRITICAL_ADVISORIES.has(advisoryId(advisory.url)))

  if (unaccepted.length > 0) {
    blocking.push({
      name,
      reason: unaccepted.map((advisory) => `${advisoryId(advisory.url)}: ${advisory.title}`).join("; "),
    })
    continue
  }

  accepted.push({
    name,
    advisories: criticalAdvisories.map((advisory) => advisoryId(advisory.url)),
  })
}

for (const { name, advisories } of accepted) {
  console.log(`Accepted critical advisory debt: ${name} (${advisories.join(", ")})`)
}

if (blocking.length > 0) {
  console.error("\nNew critical npm advisories found:\n")
  for (const { name, reason } of blocking) {
    console.error(`  - ${name}: ${reason}`)
  }
  console.error(
    "\nIf an advisory is the documented Next 14 debt, add its GHSA id to " +
      "ACCEPTED_CRITICAL_ADVISORIES in scripts/check-critical-audit.mjs and " +
      "record it in SECURITY_DEBT.md. Otherwise fix the dependency.",
  )
  process.exit(1)
}

console.log("No unaccepted critical npm advisories.")
