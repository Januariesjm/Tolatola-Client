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
 * Current (2026-08-21): statements 14.5%, branches 10.2%, functions 7.9%,
 * lines 14.7%. The denominator is all of lib/ and components/, dominated by the
 * remaining large untested UI components, so the percentage understates how well
 * the tested modules are covered -- lib/checkout, lib/schemas, lib/logger and
 * lib/api* are at or near 100%.
 *
 * jest.config.js declares the same numbers inline (so a scanner reading that
 * file finds them); the test asserts the two never disagree.
 */
module.exports = {
  global: {
    statements: 14,
    branches: 10,
    functions: 7,
    lines: 14,
  },
}
