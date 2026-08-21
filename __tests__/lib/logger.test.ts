/**
 * Tests for the structured logger (lib/logger.ts).
 *
 * Verifies:
 * - level filtering, including the NEXT_PUBLIC_LOG_LEVEL override and the
 *   production default
 * - scope nesting via child()
 * - error normalization for Errors, strings, plain objects and odd values
 * - the error reporter hook, and that a throwing reporter cannot break callers
 * - the structured JSON form: field names, what is omitted, and that a log
 *   collector can parse a real emitted line
 */

import {
  logFormat,
  logger,
  normalizeError,
  serializeEntry,
  setErrorReporter,
  toStructuredEntry,
  type LogRecord,
  type StructuredLogEntry,
} from "@/lib/logger"

const ORIGINAL_LOG_LEVEL = process.env.NEXT_PUBLIC_LOG_LEVEL
const ORIGINAL_LOG_FORMAT = process.env.NEXT_PUBLIC_LOG_FORMAT
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
  // Pinned explicitly: most assertions below are about the pretty console form,
  // and the default flips to json under NODE_ENV=production, which several
  // tests set.
  process.env.NEXT_PUBLIC_LOG_FORMAT = "pretty"
})

afterEach(() => {
  jest.restoreAllMocks()
  setErrorReporter(null)
  // Restored per test: NODE_ENV now decides the output format as well as the
  // level, so leaking it from one test into the next changes what is asserted.
  setNodeEnv(ORIGINAL_NODE_ENV)
})

afterAll(() => {
  if (ORIGINAL_LOG_LEVEL === undefined) {
    delete process.env.NEXT_PUBLIC_LOG_LEVEL
  } else {
    process.env.NEXT_PUBLIC_LOG_LEVEL = ORIGINAL_LOG_LEVEL
  }
  if (ORIGINAL_LOG_FORMAT === undefined) {
    delete process.env.NEXT_PUBLIC_LOG_FORMAT
  } else {
    process.env.NEXT_PUBLIC_LOG_FORMAT = ORIGINAL_LOG_FORMAT
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

describe("structured output", () => {
  const RECORD: LogRecord = {
    level: "error",
    scope: "orders.detail",
    message: "failed to confirm delivery",
    context: { orderId: "o-1" },
    error: { name: "TypeError", message: "boom", stack: "TypeError: boom\n  at x" },
  }

  const AT = new Date("2026-08-21T10:20:30.000Z")

  describe("logFormat", () => {
    it.each([
      ["json", "json"],
      ["pretty", "pretty"],
    ])("honours NEXT_PUBLIC_LOG_FORMAT=%s", (configured, expected) => {
      process.env.NEXT_PUBLIC_LOG_FORMAT = configured

      expect(logFormat()).toBe(expected)
    })

    it.each([[""], ["JSON"], ["ndjson"], ["yaml"]])("ignores the unrecognised value %p", (configured) => {
      process.env.NEXT_PUBLIC_LOG_FORMAT = configured
      setNodeEnv("development")

      expect(logFormat()).toBe("pretty")
    })

    it("defaults to json in production, where a collector is reading stdout", () => {
      delete process.env.NEXT_PUBLIC_LOG_FORMAT
      setNodeEnv("production")

      expect(logFormat()).toBe("json")
    })

    it("defaults to pretty outside production, where a human is reading it", () => {
      delete process.env.NEXT_PUBLIC_LOG_FORMAT
      setNodeEnv("development")

      expect(logFormat()).toBe("pretty")
    })
  })

  describe("toStructuredEntry", () => {
    it("maps a record onto the Cloud Logging field names", () => {
      expect(toStructuredEntry(RECORD, AT)).toEqual({
        severity: "ERROR",
        message: "failed to confirm delivery",
        module: "orders.detail",
        timestamp: "2026-08-21T10:20:30.000Z",
        context: { orderId: "o-1" },
        error: { name: "TypeError", message: "boom", stack: "TypeError: boom\n  at x" },
      })
    })

    it.each([
      ["debug", "DEBUG"],
      ["info", "INFO"],
      ["warn", "WARNING"],
      ["error", "ERROR"],
    ] as const)("maps the %s level to the %s severity", (level, severity) => {
      // WARNING rather than WARN: Cloud Logging only promotes its own spelling.
      expect(toStructuredEntry({ level, message: "m" }, AT).severity).toBe(severity)
    })

    it("omits module for the root logger rather than emitting an empty one", () => {
      const entry = toStructuredEntry({ level: "info", message: "m" }, AT)

      expect(entry).not.toHaveProperty("module")
      expect(entry).not.toHaveProperty("context")
      expect(entry).not.toHaveProperty("error")
    })

    it("omits an empty context object, which would only bloat the line", () => {
      expect(toStructuredEntry({ level: "info", message: "m", context: {} }, AT)).not.toHaveProperty("context")
    })

    it("stamps the current time when none is given", () => {
      const before = Date.now()

      const stamped = Date.parse(toStructuredEntry({ level: "info", message: "m" }).timestamp)

      expect(stamped).toBeGreaterThanOrEqual(before)
      expect(stamped).toBeLessThanOrEqual(Date.now())
    })
  })

  describe("serializeEntry", () => {
    it("produces one line, so a collector reading line-delimited JSON keeps records apart", () => {
      const line = serializeEntry(toStructuredEntry(RECORD, AT))

      // The stack's newline must be escaped inside the JSON string, not literal.
      expect(line).not.toContain("\n")
      expect(JSON.parse(line).error.stack).toContain("\n")
    })

    it("keeps the record when the context cannot be serialized", () => {
      const circular: Record<string, unknown> = { name: "cart" }
      circular.self = circular

      const parsed = JSON.parse(serializeEntry({ severity: "ERROR", message: "m", timestamp: AT.toISOString(), context: circular }))

      // The message survives; only the offending metadata is replaced.
      expect(parsed.message).toBe("m")
      expect(parsed.severity).toBe("ERROR")
      expect(parsed.context).toHaveProperty("unserializable")
    })

    it("round-trips a plain entry unchanged", () => {
      const entry: StructuredLogEntry = { severity: "INFO", message: "m", timestamp: AT.toISOString() }

      expect(JSON.parse(serializeEntry(entry))).toEqual(entry)
    })
  })

  describe("emitting in json mode", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_LOG_FORMAT = "json"
    })

    it("writes a single parseable argument instead of several", () => {
      logger.child("agent.wallet").error("failed to load wallet stats", new Error("supabase down"), { agentId: "a-1" })

      expect(errorSpy).toHaveBeenCalledTimes(1)
      expect(errorSpy.mock.calls[0]).toHaveLength(1)

      const entry = JSON.parse(errorSpy.mock.calls[0][0])
      expect(entry).toMatchObject({
        severity: "ERROR",
        module: "agent.wallet",
        message: "failed to load wallet stats",
        context: { agentId: "a-1" },
        error: { name: "Error", message: "supabase down" },
      })
      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it("still routes each level to its own console method", () => {
      logger.debug("d")
      logger.info("i")
      logger.warn("w")
      logger.error("e")

      expect(logSpy).toHaveBeenCalledTimes(2)
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(errorSpy).toHaveBeenCalledTimes(1)
      expect(JSON.parse(warnSpy.mock.calls[0][0]).severity).toBe("WARNING")
    })

    it("still applies level filtering", () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = "warn"

      logger.info("dropped")
      logger.warn("kept")

      expect(logSpy).not.toHaveBeenCalled()
      expect(warnSpy).toHaveBeenCalledTimes(1)
    })

    it("still reaches the error reporter", () => {
      const reporter = jest.fn()
      setErrorReporter(reporter)

      logger.error("boom")

      expect(reporter).toHaveBeenCalledWith(expect.objectContaining({ level: "error", message: "boom" }))
    })
  })

  describe("emitting in pretty mode", () => {
    it("keeps the multi-argument form so devtools can expand the objects", () => {
      process.env.NEXT_PUBLIC_LOG_FORMAT = "pretty"

      logger.child("orders").error("failed", new Error("boom"), { orderId: "o-1" })

      expect(errorSpy).toHaveBeenCalledWith("[error] orders:", "failed", expect.objectContaining({ message: "boom" }), { orderId: "o-1" })
    })
  })
})
