/**
 * Tests for the Sentry error-reporter adapter (lib/observability/sentry.ts).
 *
 * This chains onto whatever reporter lib/observability/error-tracking.ts (or
 * anything else) already registered, rather than replacing it, so what matters
 * is the no-op path when unconfigured, that both an Error and a plain message
 * are captured correctly, that a Sentry SDK failure cannot break the reporter
 * chain, and that shutdown restores exactly what was there before Sentry was
 * chained in -- not blindly null.
 */

import * as Sentry from "@sentry/nextjs"
import { logger, setErrorReporter } from "@/lib/logger"
import { initSentryReporting } from "@/lib/observability/sentry"

jest.mock("@sentry/nextjs", () => ({
  init: jest.fn(),
  withScope: jest.fn((callback: (scope: unknown) => void) => callback({ setTag: jest.fn(), setContext: jest.fn() })),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}))

const ORIGINAL_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN
const ORIGINAL_APP_ENV = process.env.NEXT_PUBLIC_APP_ENV

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  jest.spyOn(console, "log").mockImplementation(() => {})
  delete process.env.NEXT_PUBLIC_SENTRY_DSN
  delete process.env.NEXT_PUBLIC_APP_ENV
})

afterEach(() => {
  jest.restoreAllMocks()
  setErrorReporter(null)
})

afterAll(() => {
  if (ORIGINAL_DSN === undefined) delete process.env.NEXT_PUBLIC_SENTRY_DSN
  else process.env.NEXT_PUBLIC_SENTRY_DSN = ORIGINAL_DSN
  if (ORIGINAL_APP_ENV === undefined) delete process.env.NEXT_PUBLIC_APP_ENV
  else process.env.NEXT_PUBLIC_APP_ENV = ORIGINAL_APP_ENV
})

describe("initSentryReporting", () => {
  describe("when no DSN is configured", () => {
    it("reports disabled and never calls Sentry.init", () => {
      expect(initSentryReporting().enabled).toBe(false)
      expect(Sentry.init).not.toHaveBeenCalled()
    })

    it("does not register a reporter", () => {
      const existing = jest.fn()
      setErrorReporter(existing)

      initSentryReporting()
      logger.error("boom")

      expect(existing).toHaveBeenCalledTimes(1)
      expect(Sentry.captureException).not.toHaveBeenCalled()
    })

    it("has a shutdown that is safe to call", () => {
      expect(() => initSentryReporting().shutdown()).not.toThrow()
    })
  })

  describe("when a DSN is configured", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SENTRY_DSN = "https://key@sentry.example/1"
    })

    it("initializes Sentry with the DSN and no performance sampling", () => {
      initSentryReporting()

      expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({ dsn: "https://key@sentry.example/1", tracesSampleRate: 0 }))
    })

    it("labels the environment from NEXT_PUBLIC_APP_ENV when set", () => {
      process.env.NEXT_PUBLIC_APP_ENV = "staging"

      initSentryReporting()

      expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({ environment: "staging" }))
    })

    it("captures a logged error as an Error, preserving name and message", () => {
      initSentryReporting()

      logger.error("failed to confirm delivery", new Error("boom"))

      expect(Sentry.captureException).toHaveBeenCalledWith(expect.objectContaining({ name: "Error", message: "boom" }))
    })

    it("captures a message-only error log as a message, not an exception", () => {
      initSentryReporting()

      logger.error("no reservation slot available")

      expect(Sentry.captureMessage).toHaveBeenCalledWith("no reservation slot available", "error")
      expect(Sentry.captureException).not.toHaveBeenCalled()
    })

    it("does not report warn, info or debug records", () => {
      initSentryReporting()

      logger.warn("w", new Error("not sent"))
      logger.info("i")
      logger.debug("d")

      expect(Sentry.captureException).not.toHaveBeenCalled()
      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })

    it("chains onto a reporter that was already registered, rather than replacing it", () => {
      const existing = jest.fn()
      setErrorReporter(existing)

      initSentryReporting()
      logger.error("boom")

      expect(Sentry.captureMessage).toHaveBeenCalledWith("boom", "error")
      expect(existing).toHaveBeenCalledTimes(1)
    })

    it("swallows a Sentry SDK failure rather than breaking the reporter chain", () => {
      ;(Sentry.captureMessage as jest.Mock).mockImplementation(() => {
        throw new Error("SDK not initialized")
      })
      const existing = jest.fn()
      setErrorReporter(existing)
      initSentryReporting()

      expect(() => logger.error("boom")).not.toThrow()
      expect(existing).toHaveBeenCalledTimes(1)
    })

    it("stops reporting to Sentry after shutdown, restoring the prior reporter", () => {
      const existing = jest.fn()
      setErrorReporter(existing)
      const handle = initSentryReporting()

      handle.shutdown()
      logger.error("boom")

      expect(Sentry.captureMessage).not.toHaveBeenCalled()
      expect(existing).toHaveBeenCalledTimes(1)
    })

    it("restores a null reporter on shutdown when none existed before", () => {
      const handle = initSentryReporting()

      handle.shutdown()
      logger.error("boom")

      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })
  })
})
