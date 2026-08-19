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

// Mock Supabase client & server to prevent ESM node_modules import issues in Jest environment
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      signOut: jest.fn().mockResolvedValue({}),
    },
  }),
}))

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn().mockResolvedValue({}),
  createAdminClient: jest.fn().mockResolvedValue({}),
}))
