import type { Config } from "jest"
import nextJest from "next/jest"

const createJestConfig = nextJest({
  dir: "./",
})

const config: Config = {
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
  collectCoverageFrom: [
    "lib/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  /**
   * Coverage floor, enforced in CI by `npm test`.
   *
   * A ratchet, not a target. These sit just under the current numbers
   * (statements 11.4%, branches 5.3%, functions 6.3%, lines 11.6%) so an
   * unrelated change cannot quietly delete coverage. Raise them as suites
   * land; never lower them.
   *
   * The denominator is the whole of lib/ and components/, which is dominated by
   * ~29 large untested UI components -- so the percentage understates how well
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

export default createJestConfig(config)
