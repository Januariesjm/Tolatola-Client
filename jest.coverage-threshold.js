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
 * Current (2026-08-23): statements 80.86%, branches 73.24%, functions 74.08%,
 * lines 81.6% -- raised from 32/28/21/32 in one incremental push covering
 * essentially every previously-untested component: cart/favorites/shop/
 * profile content, the vendor and transporter dashboards and their dialogs,
 * the full admin surface (HR, finance, KYC, blog, messaging, analytics,
 * infra/ops), checkout's map/address/shipping components, and the
 * messaging widgets. lib/ was already at ~96% going in.
 *
 * Branches and functions sit below statements/lines because the remaining
 * gap is concentrated in components/ui/* (many are unused vendored shadcn
 * primitives, not application logic) and a handful of defensive branches
 * confirmed dead by direct probing (documented in the relevant test files)
 * rather than force-tested.
 *
 * jest.config.js declares the same numbers inline (so a scanner reading that
 * file finds them); the test asserts the two never disagree.
 */
module.exports = {
  global: {
    statements: 80,
    branches: 73,
    functions: 74,
    lines: 81,
  },
}
