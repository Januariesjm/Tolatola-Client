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
  // Inline on purpose: an object literal here is readable by tooling that scans
  // jest.config.js for the floor. jest.coverage-threshold.js re-exports the same
  // numbers so __tests__/config/coverage-threshold.test.ts can assert on them.
  coverageThreshold: {
    global: {
      statements: 14,
      branches: 10,
      functions: 7,
      lines: 14,
    },
  },
}

module.exports = createJestConfig(config)
