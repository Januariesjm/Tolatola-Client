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
 * Current (2026-08-21): statements 32.6%, branches 28.5%, functions 22.0%,
 * lines 32.8% -- raised from 16/13/8/16 as many suites landed; most recently
 * the agent-commission, transporter-subscription, vendor-subscription,
 * product-management and Sentry-adapter splits and their tests.
 *
 * The denominator is all of lib/ and components/, dominated by the remaining
 * large untested UI components, so the percentage understates how well the
 * tested modules are covered -- lib/checkout, lib/schemas, lib/search,
 * lib/messaging, lib/support, lib/logger and lib/api* are at or near 100%.
 *
 * The next meaningful jump needs the vendor, transporter and agent dashboard
 * tabs, which are ~1,400 uncovered statements between them.
 *
 * jest.config.js declares the same numbers inline (so a scanner reading that
 * file finds them); the test asserts the two never disagree.
 */
module.exports = {
  global: {
    statements: 32,
    branches: 28,
    functions: 21,
    lines: 32,
  },
}
