// CommonJS on purpose. This was previously jest.config.ts, which broke on
// Node >= 22.6: that Node strips TS types natively, so Jest loads a .ts config
// through native ESM instead of ts-node, and the extensionless "next/jest"
// specifier is not resolvable under ESM ("Did you mean next/jest.js?"). It
// worked on Node 20 only because ts-node loaded the file as CommonJS.
//
// A plain .js config is loaded the same way on every Node version, so the
// config can't break again on a Node upgrade. Types still apply via the JSDoc
// annotation below.
const nextJest = require("next/jest")

const createJestConfig = nextJest({
  dir: "./",
})

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^jose$": "<rootDir>/node_modules/jose/dist/node/cjs/index.js",
  },
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.next/",
    // Shared fixtures, not suites.
    "<rootDir>/__tests__/setup/",
  ],
  collectCoverageFrom: ["lib/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "!**/*.d.ts", "!**/node_modules/**"],
  /**
   * Coverage floor, enforced in CI by `npm test`.
   *
   * A ratchet, not a target. These sit just under the current numbers
   * (statements 11.9%, branches 5.3%, functions 6.3%, lines 12.1%) so an
   * unrelated change cannot quietly delete coverage. Raise them as suites
   * land; never lower them.
   *
   * The denominator is the whole of lib/ and components/, which is dominated by
   * ~23 large untested UI components -- so the percentage understates how well
   * the tested modules are covered (lib/checkout, lib/schemas, lib/logger and
   * lib/api* are at or near 100%). Reaching the 30% checkpoint means testing
   * those big components, not more lib tests.
   */
  coverageThreshold: {
    global: {
      statements: 11,
      branches: 5,
      functions: 6,
      lines: 11,
    },
  },
}

module.exports = createJestConfig(config)
