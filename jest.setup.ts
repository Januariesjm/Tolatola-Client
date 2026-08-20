import "@testing-library/jest-dom"
import React from "react"
import { TextEncoder, TextDecoder } from "util"

// Polyfill TextEncoder / TextDecoder for jsdom env (required by jose/supabase)
if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder
}
if (typeof global.TextDecoder === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  global.TextDecoder = TextDecoder as any
}

// Polyfill ResizeObserver and IntersectionObserver for Radix UI in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

// Guarded: suites that opt into `@jest-environment node` (API route handlers)
// have no `window`, and an unguarded reference here would fail the whole file
// before any test runs.
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
}

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}))

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    return React.createElement("img", props)
  },
}))

// Mock Supabase client & server to prevent ESM node_modules import issues in the
// Jest environment, and to guarantee no test can reach a live project.
// Built from the shared fixture in __tests__/setup/mocks.ts -- import
// createSupabaseClientMock there directly when a suite needs different
// behavior. `require` is used inside the factory because jest.mock is hoisted
// above imports.
jest.mock("@/lib/supabase/client", () => ({
  createClient: () =>
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("./__tests__/setup/mocks").createSupabaseClientMock(),
}))

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn().mockResolvedValue({}),
  createAdminClient: jest.fn().mockResolvedValue({}),
}))
