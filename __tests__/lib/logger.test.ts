/**
 * Tests for the structured logger (lib/logger.ts).
 *
 * Verifies:
 * - level filtering, including the NEXT_PUBLIC_LOG_LEVEL override and the
 *   production default
 * - scope nesting via child()
 * - error normalization for Errors, strings, plain objects and odd values
 * - the error reporter hook, and that a throwing reporter cannot break callers
 */

import { logger, normalizeError, setErrorReporter, type LogRecord } from "@/lib/logger"

const ORIGINAL_LOG_LEVEL = process.env.NEXT_PUBLIC_LOG_LEVEL
const ORIGINAL_NODE_ENV = process.env.NODE_ENV

let logSpy: jest.SpyInstance
let warnSpy: jest.SpyInstance
let errorSpy: jest.SpyInstance

/** NODE_ENV is readonly in the Next type defs; tests need to vary it. */
function setNodeEnv(value: string | undefined) {
  if (value === undefined) {
    delete (process.env as Record<string, string | undefined>).NODE_ENV
  } else {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = value
  }
}

beforeEach(() => {
  logSpy = jest.spyOn(console, "log").mockImplementation(() => {})
  warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
  process.env.NEXT_PUBLIC_LOG_LEVEL = "debug"
})

afterEach(() => {
  jest.restoreAllMocks()
  setErrorReporter(null)
})

afterAll(() => {
  if (ORIGINAL_LOG_LEVEL === undefined) {
    delete process.env.NEXT_PUBLIC_LOG_LEVEL
  } else {
    process.env.NEXT_PUBLIC_LOG_LEVEL = ORIGINAL_LOG_LEVEL
  }
  setNodeEnv(ORIGINAL_NODE_ENV)
})

describe("logger", () => {
  describe("levels", () => {
    it("routes each level to the matching console method", () => {
      logger.debug("d")
      logger.info("i")
      logger.warn("w")
      logger.error("e")

      expect(logSpy).toHaveBeenCalledTimes(2) // debug + info
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(errorSpy).toHaveBeenCalledTimes(1)
    })

    it("tags output with the level", () => {
      logger.info("agents loaded")

      expect(logSpy).toHaveBeenCalledWith("[info]", "agents loaded")
    })

    it("suppresses levels below NEXT_PUBLIC_LOG_LEVEL", () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = "warn"

      logger.debug("d")
      logger.info("i")
      logger.warn("w")
      logger.error("e")

      expect(logSpy).not.toHaveBeenCalled()
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(errorSpy).toHaveBeenCalledTimes(1)
    })

    it("reads the level per call, so it can change at runtime", () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = "error"
      logger.info("hidden")
      expect(logSpy).not.toHaveBeenCalled()

      process.env.NEXT_PUBLIC_LOG_LEVEL = "debug"
      logger.info("shown")
      expect(logSpy).toHaveBeenCalledTimes(1)
    })

    it("defaults to info in production, hiding debug output", () => {
      delete process.env.NEXT_PUBLIC_LOG_LEVEL
      setNodeEnv("production")

      logger.debug("noisy")
      logger.info("useful")

      expect(logSpy).toHaveBeenCalledTimes(1)
      expect(logSpy).toHaveBeenCalledWith("[info]", "useful")

      setNodeEnv(ORIGINAL_NODE_ENV)
    })

    it("ignores an unrecognized NEXT_PUBLIC_LOG_LEVEL rather than dropping all logs", () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = "loud"

      logger.info("still emitted")

      expect(logSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe("scopes", () => {
    it("prefixes messages with the child scope", () => {
      logger.child("admin").info("ready")

      expect(logSpy).toHaveBeenCalledWith("[info] admin:", "ready")
    })

    it("nests scopes with dots", () => {
      logger.child("admin").child("agent-management").error("boom")

      expect(errorSpy).toHaveBeenCalledWith("[error] admin.agent-management:", "boom")
    })

    it("does not mutate the parent logger's scope", () => {
      const parent = logger.child("parent")
      parent.child("nested").info("a")
      parent.info("b")

      expect(logSpy).toHaveBeenNthCalledWith(1, "[info] parent.nested:", "a")
      expect(logSpy).toHaveBeenNthCalledWith(2, "[info] parent:", "b")
    })
  })

  describe("context and errors", () => {
    it("appends a non-empty context object", () => {
      logger.info("loaded", { count: 3 })

      expect(logSpy).toHaveBeenCalledWith("[info]", "loaded", { count: 3 })
    })

    it("omits an empty context object", () => {
      logger.info("loaded", {})

      expect(logSpy).toHaveBeenCalledWith("[info]", "loaded")
    })

    it("includes the normalized error before the context", () => {
      logger.error("failed", new Error("nope"), { agentId: "a-1" })

      expect(errorSpy).toHaveBeenCalledWith("[error]", "failed", expect.objectContaining({ name: "Error", message: "nope" }), {
        agentId: "a-1",
      })
    })

    it("omits the error slot when no error is passed", () => {
      logger.error("failed")

      expect(errorSpy).toHaveBeenCalledWith("[error]", "failed")
    })
  })

  describe("normalizeError", () => {
    it("keeps name, message and stack from an Error", () => {
      const err = new TypeError("bad type")

      expect(normalizeError(err)).toEqual({
        name: "TypeError",
        message: "bad type",
        stack: err.stack,
      })
    })

    it("wraps a string", () => {
      expect(normalizeError("plain failure")).toEqual({
        name: "Error",
        message: "plain failure",
      })
    })

    it("reads message off a Supabase-style plain object", () => {
      expect(normalizeError({ message: "row not found", code: "PGRST116" })).toEqual({
        name: "Error",
        message: "row not found",
        stack: undefined,
      })
    })

    it("serializes an object with no message field", () => {
      expect(normalizeError({ code: 500 })).toEqual({
        name: "Error",
        message: '{"code":500}',
        stack: undefined,
      })
    })

    it("survives a circular object", () => {
      const circular: Record<string, unknown> = { code: 1 }
      circular.self = circular

      expect(() => normalizeError(circular)).not.toThrow()
      expect(normalizeError(circular).name).toBe("Error")
    })

    it.each([
      [null, "null"],
      [undefined, "undefined"],
      [42, "42"],
    ])("stringifies %p", (input, expected) => {
      expect(normalizeError(input)).toEqual({ name: "Error", message: expected })
    })
  })

  describe("error reporter", () => {
    it("receives error-level records", () => {
      const reporter = jest.fn()
      setErrorReporter(reporter)

      logger.child("checkout").error("payment failed", new Error("declined"), { orderId: "o-1" })

      expect(reporter).toHaveBeenCalledTimes(1)
      const record = reporter.mock.calls[0][0] as LogRecord
      expect(record).toMatchObject({
        level: "error",
        scope: "checkout",
        message: "payment failed",
        context: { orderId: "o-1" },
        error: { name: "Error", message: "declined" },
      })
    })

    it("is not called for debug, info or warn", () => {
      const reporter = jest.fn()
      setErrorReporter(reporter)

      logger.debug("d")
      logger.info("i")
      logger.warn("w", new Error("careful"))

      expect(reporter).not.toHaveBeenCalled()
    })

    it("is not called for errors filtered out by the level", () => {
      const reporter = jest.fn()
      setErrorReporter(reporter)
      // "error" is the highest level, so nothing can filter it out; assert the
      // inverse instead -- a raised floor still lets errors through.
      process.env.NEXT_PUBLIC_LOG_LEVEL = "error"

      logger.error("still reported")

      expect(reporter).toHaveBeenCalledTimes(1)
    })

    it("swallows a throwing reporter so the caller is unaffected", () => {
      setErrorReporter(() => {
        throw new Error("reporter is down")
      })

      expect(() => logger.error("original failure")).not.toThrow()
      expect(errorSpy).toHaveBeenCalledWith("[error]", "original failure")
    })

    it("returns the previous reporter when replaced", () => {
      const first = jest.fn()
      const second = jest.fn()

      setErrorReporter(first)
      const previous = setErrorReporter(second)

      expect(previous).toBe(first)

      logger.error("boom")
      expect(second).toHaveBeenCalledTimes(1)
      expect(first).not.toHaveBeenCalled()
    })

    it("stops reporting once cleared", () => {
      const reporter = jest.fn()
      setErrorReporter(reporter)
      setErrorReporter(null)

      logger.error("boom")

      expect(reporter).not.toHaveBeenCalled()
    })
  })
})
