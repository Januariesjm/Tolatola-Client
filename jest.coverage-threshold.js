/**
 * Coverage floor, enforced by `npm test` (and therefore by the CI test job and
 * the deploy gate).
 *
 * A ratchet, not a target: these sit just under the current numbers so an
 * unrelated change cannot quietly delete coverage. Raise them as suites land;
 * never lower them. __tests__/config/coverage-threshold.test.ts asserts the
 * floor is present and non-zero, so deleting it fails the suite rather than
 * silently disabling enforcement.
 *
 * Current (2026-08-21): statements 13.3%, branches 8.4%, functions 7.3%,
 * lines 13.5%. The denominator is all of lib/ and components/, dominated by the
 * remaining large untested UI components, so the percentage understates how well
 * the tested modules are covered -- lib/checkout, lib/schemas, lib/logger and
 * lib/api* are at or near 100%.
 *
 * Its own module so the numbers are trivially readable by tooling and by the
 * test that guards them, rather than buried in a call expression.
 */
module.exports = {
  global: {
    statements: 13,
    branches: 8,
    functions: 7,
    lines: 13,
  },
}
