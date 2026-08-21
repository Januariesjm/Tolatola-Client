/**
 * Tests for the error-tracking transport (lib/observability/error-tracking.ts).
 *
 * The two properties that matter most are that it cannot break the caller and
 * cannot feed itself, so most of this asserts failure paths rather than the
 * happy one: a rejected post, a throwing transport, a flood of identical
 * errors, and an error logged from inside the reporter.
 */

import { logger, setErrorReporter, type LogRecord } from "@/lib/logger"
import { DEDUPE_WINDOW_MS, MAX_IN_FLIGHT, initErrorTracking } from "@/lib/observability/error-tracking"

const DSN = "https://collector.example/ingest"

const ORIGINAL_DSN = process.env.NEXT_PUBLIC_ERROR_TRACKING_DSN
const ORIGINAL_APP_ENV = process.env.NEXT_PUBLIC_APP_ENV

const record: LogRecord = { level: "error", scope: "orders", message: "failed to confirm delivery" }

/** A transport that resolves, and records what it was called with. */
const okTransport = () => jest.fn(async () => ({ ok: true }) as Response) as unknown as jest.Mock

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {})
  jest.spyOn(console, "log").mockImplementation(() => {})
  jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] }).setSystemTime(new Date("2026-08-21T10:00:00.000Z"))
  delete process.env.NEXT_PUBLIC_ERROR_TRACKING_DSN
  delete process.env.NEXT_PUBLIC_APP_ENV
})

afterEach(() => {
  jest.useRealTimers()
  jest.restoreAllMocks()
  setErrorReporter(null)
})

afterAll(() => {
  if (ORIGINAL_DSN === undefined) delete process.env.NEXT_PUBLIC_ERROR_TRACKING_DSN
  else process.env.NEXT_PUBLIC_ERROR_TRACKING_DSN = ORIGINAL_DSN
  if (ORIGINAL_APP_ENV === undefined) delete process.env.NEXT_PUBLIC_APP_ENV
  else process.env.NEXT_PUBLIC_APP_ENV = ORIGINAL_APP_ENV
})

/** The parsed body of the nth post. */
function bodyOf(transport: jest.Mock, n = 0) {
  return JSON.parse(String((transport.mock.calls[n][1] as RequestInit).body))
}

describe("initErrorTracking", () => {
  describe("when no DSN is configured", () => {
    it("reports disabled rather than guessing an endpoint", () => {
      expect(initErrorTracking().enabled).toBe(false)
    })

    it("leaves the reporter alone, so an existing one is not clobbered", () => {
      const existing = jest.fn()
      setErrorReporter(existing)

      initErrorTracking()
      logger.error("boom")

      expect(existing).toHaveBeenCalledTimes(1)
    })

    it("has a shutdown that is safe to call", () => {
      expect(() => initErrorTracking().shutdown()).not.toThrow()
    })

    it.each([[""], [undefined]])("treats the DSN %p as absent", (dsn) => {
      expect(initErrorTracking({ dsn }).enabled).toBe(false)
    })
  })

  describe("when a DSN is configured", () => {
    it("reads the DSN from the environment", () => {
      process.env.NEXT_PUBLIC_ERROR_TRACKING_DSN = DSN

      expect(initErrorTracking({ transport: okTransport() }).enabled).toBe(true)
    })

    it("posts an error-level record as JSON to the DSN", () => {
      const transport = okTransport()
      initErrorTracking({ dsn: DSN, environment: "staging", transport })

      logger.child("orders").error("failed to confirm delivery", new Error("boom"), { orderId: "o-1" })

      expect(transport).toHaveBeenCalledTimes(1)
      const [url, init] = transport.mock.calls[0] as [string, RequestInit]
      expect(url).toBe(DSN)
      expect(init.method).toBe("POST")
      expect(init.keepalive).toBe(true)
      expect(bodyOf(transport)).toEqual({
        environment: "staging",
        entry: {
          severity: "ERROR",
          module: "orders",
          message: "failed to confirm delivery",
          timestamp: "2026-08-21T10:00:00.000Z",
          context: { orderId: "o-1" },
          error: { name: "Error", message: "boom", stack: expect.any(String) },
        },
      })
    })

    it("does not post warn, info or debug records", () => {
      const transport = okTransport()
      initErrorTracking({ dsn: DSN, transport })

      logger.debug("d")
      logger.info("i")
      logger.warn("w", new Error("not sent"))

      expect(transport).not.toHaveBeenCalled()
    })

    it("labels entries with NEXT_PUBLIC_APP_ENV when no environment is passed", () => {
      process.env.NEXT_PUBLIC_APP_ENV = "production"
      const transport = okTransport()
      initErrorTracking({ dsn: DSN, transport })

      logger.error("boom")

      expect(bodyOf(transport).environment).toBe("production")
    })

    it("stops posting after shutdown", () => {
      const transport = okTransport()
      const handle = initErrorTracking({ dsn: DSN, transport })

      handle.shutdown()
      logger.error("boom")

      expect(transport).not.toHaveBeenCalled()
    })

    it("replaces the reporter when initialised twice rather than posting twice", () => {
      const first = okTransport()
      const second = okTransport()
      initErrorTracking({ dsn: DSN, transport: first })
      initErrorTracking({ dsn: DSN, transport: second })

      logger.error("boom")

      expect(first).not.toHaveBeenCalled()
      expect(second).toHaveBeenCalledTimes(1)
    })
  })

  describe("cannot break the caller", () => {
    it("swallows a rejected post", async () => {
      const transport = jest.fn(async () => {
        throw new Error("collector down")
      })
      initErrorTracking({ dsn: DSN, transport: transport as unknown as typeof fetch })

      expect(() => logger.error("boom")).not.toThrow()
      await Promise.resolve()
    })

    it("swallows a transport that throws synchronously", () => {
      const transport = jest.fn(() => {
        throw new Error("fetch is not a function")
      })
      initErrorTracking({ dsn: DSN, transport: transport as unknown as typeof fetch })

      expect(() => logger.error("boom")).not.toThrow()
    })

    it("keeps working after a failed post", async () => {
      let calls = 0
      const transport = jest.fn(async () => {
        calls += 1
        if (calls === 1) throw new Error("transient")
        return { ok: true } as Response
      })
      initErrorTracking({ dsn: DSN, transport: transport as unknown as typeof fetch })

      logger.error("first")
      await Promise.resolve()
      logger.error("second")

      expect(transport).toHaveBeenCalledTimes(2)
    })

    it("serializes a record whose context has a cycle instead of throwing", () => {
      const transport = okTransport()
      initErrorTracking({ dsn: DSN, transport })
      const circular: Record<string, unknown> = { cart: "c-1" }
      circular.self = circular

      expect(() => logger.error("boom", undefined, circular)).not.toThrow()

      expect(bodyOf(transport).entry.context).toHaveProperty("unserializable")
    })
  })

  describe("cannot feed itself", () => {
    it("ignores an error logged from inside the reporter", () => {
      const transport = jest.fn((() => {
        // A transport that logs is the loop this guards against: the log would
        // re-enter the reporter, which would post again, forever.
        logger.error("transport failed")
        return Promise.resolve({ ok: true } as Response)
      }) as unknown as typeof fetch)
      initErrorTracking({ dsn: DSN, transport })

      logger.error("original")

      expect(transport).toHaveBeenCalledTimes(1)
      expect(bodyOf(transport as unknown as jest.Mock).entry.message).toBe("original")
    })
  })

  describe("flood protection", () => {
    it("drops an identical error repeated inside the dedupe window", () => {
      const transport = okTransport()
      initErrorTracking({ dsn: DSN, transport })

      for (let i = 0; i < 50; i += 1) logger.child(record.scope).error(record.message)

      expect(transport).toHaveBeenCalledTimes(1)
    })

    it("sends it again once the window has passed", () => {
      const transport = okTransport()
      initErrorTracking({ dsn: DSN, transport })

      logger.error("boom")
      jest.advanceTimersByTime(DEDUPE_WINDOW_MS + 1)
      logger.error("boom")

      expect(transport).toHaveBeenCalledTimes(2)
    })

    it("treats a different scope or error as a different entry", () => {
      const transport = okTransport()
      initErrorTracking({ dsn: DSN, transport })

      logger.child("a").error("same message")
      logger.child("b").error("same message")
      logger.child("a").error("same message", new Error("but a different cause"))

      expect(transport).toHaveBeenCalledTimes(3)
    })

    it("stops sending once too many posts are in flight", () => {
      // A transport that never settles, so nothing ever leaves the in-flight set.
      const transport = jest.fn(() => new Promise<Response>(() => {}))
      initErrorTracking({ dsn: DSN, transport: transport as unknown as typeof fetch })

      for (let i = 0; i < MAX_IN_FLIGHT + 5; i += 1) logger.error(`distinct error ${i}`)

      expect(transport).toHaveBeenCalledTimes(MAX_IN_FLIGHT)
    })

    it("accepts new posts again as earlier ones settle", async () => {
      const transport = okTransport()
      initErrorTracking({ dsn: DSN, transport })

      for (let i = 0; i < MAX_IN_FLIGHT + 3; i += 1) {
        logger.error(`distinct error ${i}`)
        // Let the previous post settle before the next is logged.
        await Promise.resolve()
        await Promise.resolve()
      }

      expect(transport).toHaveBeenCalledTimes(MAX_IN_FLIGHT + 3)
    })
  })
})
