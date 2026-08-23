/**
 * Tests for GlobalErrorLogger (components/utils/global-error-logger.tsx).
 *
 * This component has no visible output -- its whole job is imperative wiring
 * done from a `useEffect`: initializing the two observability trackers (and
 * tearing them down in reverse order on unmount), patching `console.warn` /
 * `console.error` to swallow known extension/liveness noise while letting
 * everything else through unchanged, and reloading the page when a chunk-load
 * error surfaces via `window.onerror` or `unhandledrejection`.
 *
 * `lib/observability/sentry.ts` and `lib/observability/error-tracking.ts` are
 * already covered in __tests__/lib/observability/*.test.ts against the real
 * `lib/logger`; here both are mocked so this suite only asserts *how the
 * component wires them up* (called on mount, shut down in reverse order on
 * unmount) rather than re-testing their internals.
 */

import { render } from "@testing-library/react"
import { GlobalErrorLogger } from "@/components/utils/global-error-logger"
import { initErrorTracking } from "@/lib/observability/error-tracking"
import { initSentryReporting } from "@/lib/observability/sentry"
import { logger } from "@/lib/logger"

jest.mock("@/lib/observability/error-tracking", () => ({
  initErrorTracking: jest.fn(),
}))

jest.mock("@/lib/observability/sentry", () => ({
  initSentryReporting: jest.fn(),
}))

jest.mock("@/lib/logger", () => {
  const childLogger = { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() }
  return { logger: { child: jest.fn(() => childLogger) } }
})

const mockedInitErrorTracking = initErrorTracking as jest.Mock
const mockedInitSentryReporting = initSentryReporting as jest.Mock
/** The scoped child logger the component holds onto via `logger.child("global")`. */
const childLog = (logger.child as jest.Mock)()

/**
 * jsdom's `window.location` is spec-unforgeable (own, non-configurable,
 * non-writable), so neither `jest.spyOn(window.location, "reload")` nor
 * replacing `window.location` outright is possible here -- both throw
 * ("Cannot assign to read only property" / "Cannot redefine property"),
 * matching real browsers. Calling the real `reload()` is harmless in jsdom
 * (it's a documented no-op "not implemented" navigation, not a throw) but it
 * logs a noisy warning through `window.console.error`, which *is* the same
 * object the component patches -- so silencing console.error here doubles as
 * suppressing that noise.
 *
 * The reload call itself is therefore verified indirectly through its
 * necessary side effect: the component writes `last_chunk_reload` to
 * sessionStorage immediately before calling `reload()`, and only on the
 * branch where reload would fire. That write is a reliable, assertable proxy
 * for "reload was triggered" without needing to intercept navigation itself.
 */
function silenceReloadWarning() {
  // console.log is also silenced: handleChunkError logs "Chunk load error
  // detected..." on the same path, which is expected noise for these tests.
  jest.spyOn(console, "log").mockImplementation(() => {})
  return jest.spyOn(console, "error").mockImplementation(() => {})
}

function lastChunkReload() {
  return sessionStorage.getItem("last_chunk_reload")
}

describe("GlobalErrorLogger", () => {
  let trackingHandle: { enabled: boolean; shutdown: jest.Mock }
  let sentryHandle: { enabled: boolean; shutdown: jest.Mock }

  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
    trackingHandle = { enabled: true, shutdown: jest.fn() }
    sentryHandle = { enabled: true, shutdown: jest.fn() }
    mockedInitErrorTracking.mockReturnValue(trackingHandle)
    mockedInitSentryReporting.mockReturnValue(sentryHandle)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  it("renders nothing", () => {
    const { container } = render(<GlobalErrorLogger />)
    expect(container).toBeEmptyDOMElement()
  })

  it("initializes error tracking before Sentry on mount", () => {
    render(<GlobalErrorLogger />)

    expect(mockedInitErrorTracking).toHaveBeenCalledTimes(1)
    expect(mockedInitSentryReporting).toHaveBeenCalledTimes(1)
    expect(mockedInitErrorTracking.mock.invocationCallOrder[0]).toBeLessThan(mockedInitSentryReporting.mock.invocationCallOrder[0])
  })

  it("shuts Sentry down before error tracking on unmount (reverse of init order)", () => {
    const { unmount } = render(<GlobalErrorLogger />)

    unmount()

    expect(sentryHandle.shutdown).toHaveBeenCalledTimes(1)
    expect(trackingHandle.shutdown).toHaveBeenCalledTimes(1)
    expect(sentryHandle.shutdown.mock.invocationCallOrder[0]).toBeLessThan(trackingHandle.shutdown.mock.invocationCallOrder[0])
  })

  it("does not shut down trackers before unmount", () => {
    render(<GlobalErrorLogger />)

    expect(sentryHandle.shutdown).not.toHaveBeenCalled()
    expect(trackingHandle.shutdown).not.toHaveBeenCalled()
  })

  describe("console patching", () => {
    it("intercepts console.warn, swallowing known noise but passing other messages through", () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})

      render(<GlobalErrorLogger />)
      // The component captured warnSpy as `originalWarn` at mount time; console.warn
      // is now the patched function, so calling it exercises the filter.
      console.warn("MaxListenersExceededWarning: 11 listeners added")
      console.warn("ObjectMultiplex - orphaned data for stream")
      console.warn("a perfectly normal warning")

      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy).toHaveBeenCalledWith("a perfectly normal warning")
    })

    it("intercepts console.error, swallowing known noise but passing other messages through", () => {
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})

      render(<GlobalErrorLogger />)
      console.error("app-init-liveness check failed")
      console.error("background-liveness ping timeout")
      console.error("a genuine application error")

      expect(errorSpy).toHaveBeenCalledTimes(1)
      expect(errorSpy).toHaveBeenCalledWith("a genuine application error")
    })

    it("filters based on a stringified object argument, not just plain strings", () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})

      render(<GlobalErrorLogger />)
      console.warn({ msg: "MaxListenersExceededWarning" })

      expect(warnSpy).not.toHaveBeenCalled()
    })

    it("restores the original console.warn and console.error on unmount", () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})

      const { unmount } = render(<GlobalErrorLogger />)
      expect(console.warn).not.toBe(warnSpy)
      expect(console.error).not.toBe(errorSpy)

      unmount()

      expect(console.warn).toBe(warnSpy)
      expect(console.error).toBe(errorSpy)
    })
  })

  describe("chunk load error recovery", () => {
    it("triggers the reload guard when a window error event reports a chunk load failure", () => {
      silenceReloadWarning()
      render(<GlobalErrorLogger />)
      expect(lastChunkReload()).toBeNull()

      window.dispatchEvent(
        new ErrorEvent("error", {
          error: new Error("Loading chunk 4 failed."),
          message: "Loading chunk 4 failed.",
        }),
      )

      expect(lastChunkReload()).not.toBeNull()
    })

    it("triggers the reload guard for a CSS chunk load failure too", () => {
      silenceReloadWarning()
      render(<GlobalErrorLogger />)

      window.dispatchEvent(
        new ErrorEvent("error", {
          error: new Error("Loading CSS chunk 12 failed."),
        }),
      )

      expect(lastChunkReload()).not.toBeNull()
    })

    it("triggers the reload guard when an unhandled rejection carries a ChunkLoadError", () => {
      silenceReloadWarning()
      render(<GlobalErrorLogger />)

      const event = new Event("unhandledrejection")
      Object.assign(event, { reason: new Error("ChunkLoadError: failed to fetch chunk") })
      window.dispatchEvent(event)

      expect(lastChunkReload()).not.toBeNull()
    })

    it("does not trigger the reload guard for an unrelated error", () => {
      silenceReloadWarning()
      render(<GlobalErrorLogger />)

      window.dispatchEvent(new ErrorEvent("error", { error: new Error("TypeError: cannot read property of undefined") }))

      expect(lastChunkReload()).toBeNull()
    })

    it("does not re-trigger the reload guard for a second chunk error within the debounce window", () => {
      silenceReloadWarning()
      render(<GlobalErrorLogger />)
      const chunkError = () => new ErrorEvent("error", { error: new Error("Loading chunk 1 failed.") })

      window.dispatchEvent(chunkError())
      const firstTimestamp = lastChunkReload()
      window.dispatchEvent(chunkError())

      expect(lastChunkReload()).toBe(firstTimestamp)
    })

    it("re-triggers the reload guard once the debounce window has passed", () => {
      silenceReloadWarning()
      jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] }).setSystemTime(new Date("2026-08-21T10:00:00.000Z"))
      render(<GlobalErrorLogger />)
      const chunkError = () => new ErrorEvent("error", { error: new Error("Loading chunk 1 failed.") })

      window.dispatchEvent(chunkError())
      const firstTimestamp = lastChunkReload()
      jest.setSystemTime(new Date("2026-08-21T10:00:11.000Z"))
      window.dispatchEvent(chunkError())

      expect(lastChunkReload()).not.toBe(firstTimestamp)
      jest.useRealTimers()
    })

    it("logs the uncaught error through the scoped logger", () => {
      render(<GlobalErrorLogger />)

      const error = new Error("boom")
      window.dispatchEvent(new ErrorEvent("error", { error, message: "boom", filename: "app.js", lineno: 1, colno: 2 }))

      expect(childLog.error).toHaveBeenCalledWith(
        "uncaught error",
        error,
        expect.objectContaining({ source: "app.js", lineno: 1, colno: 2 }),
      )
    })

    it("logs an unhandled promise rejection through the scoped logger", () => {
      render(<GlobalErrorLogger />)

      const reason = new Error("rejected")
      const event = new Event("unhandledrejection")
      Object.assign(event, { reason })
      window.dispatchEvent(event)

      expect(childLog.error).toHaveBeenCalledWith("unhandled promise rejection", reason)
    })

    it("ignores an unhandled rejection that matches the known noise filter", () => {
      render(<GlobalErrorLogger />)

      const event = new Event("unhandledrejection")
      Object.assign(event, { reason: "background-liveness ping timeout" })
      window.dispatchEvent(event)

      expect(childLog.error).not.toHaveBeenCalled()
    })

    it("ignores window error events that match the known noise filter", () => {
      render(<GlobalErrorLogger />)

      window.dispatchEvent(new ErrorEvent("error", { message: "app-init-liveness heartbeat missed" }))

      expect(childLog.error).not.toHaveBeenCalled()
    })

    it("stops reacting to window errors after unmount", () => {
      silenceReloadWarning()
      const { unmount } = render(<GlobalErrorLogger />)
      unmount()

      // No `error` field here (only `message`): with the component's listener
      // gone, jest-environment-jsdom's own uncaught-exception safety net would
      // otherwise treat a dispatched error event carrying `event.error` as a
      // genuine uncaught exception and fail the test outright -- see
      // node_modules/@jest/environment-jsdom-abstract, which re-emits it via
      // `process.emit("uncaughtException", ...)` whenever no listener remains.
      window.dispatchEvent(new ErrorEvent("error", { message: "Loading chunk 9 failed." }))

      expect(lastChunkReload()).toBeNull()
    })
  })
})
