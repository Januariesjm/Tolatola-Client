/**
 * Tests for the route-level and root-level error boundaries
 * (app/error.tsx, app/global-error.tsx).
 *
 * Verifies:
 * - the caught error is reported through lib/logger, so a registered error
 *   reporter receives it (including the Next.js `digest`)
 * - the reset callback is wired to the retry control
 * - each error is reported once per distinct error, not on every render
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ErrorBoundary from "@/app/error"
import GlobalErrorBoundary from "@/app/global-error"
import { setErrorReporter, type LogRecord } from "@/lib/logger"

let reported: LogRecord[]

beforeEach(() => {
  reported = []
  jest.spyOn(console, "error").mockImplementation(() => {})
  setErrorReporter((record) => reported.push(record))
})

afterEach(() => {
  setErrorReporter(null)
  jest.restoreAllMocks()
})

function makeError(message: string, digest?: string) {
  const error = new Error(message) as Error & { digest?: string }
  if (digest) error.digest = digest
  return error
}

describe("app/error.tsx (route error boundary)", () => {
  it("renders a recovery UI instead of a blank page", () => {
    render(<ErrorBoundary error={makeError("kaboom")} reset={jest.fn()} />)

    expect(screen.getByText("Something went wrong")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /homepage/i })).toHaveAttribute("href", "/")
  })

  it("reports the error through the logger with its scope and digest", () => {
    render(<ErrorBoundary error={makeError("kaboom", "abc123")} reset={jest.fn()} />)

    expect(reported).toHaveLength(1)
    expect(reported[0]).toMatchObject({
      level: "error",
      scope: "app.error-boundary",
      message: "unhandled error rendering route",
      context: { digest: "abc123" },
      error: { name: "Error", message: "kaboom" },
    })
  })

  it("calls reset when the retry button is clicked", async () => {
    const reset = jest.fn()
    render(<ErrorBoundary error={makeError("kaboom")} reset={reset} />)

    await userEvent.click(screen.getByRole("button", { name: /try again/i }))

    expect(reset).toHaveBeenCalledTimes(1)
  })

  it("shows the digest reference when Next.js provides one", () => {
    render(<ErrorBoundary error={makeError("kaboom", "digest-42")} reset={jest.fn()} />)

    expect(screen.getByText("digest-42")).toBeInTheDocument()
  })

  it("omits the reference line when there is no digest", () => {
    render(<ErrorBoundary error={makeError("kaboom")} reset={jest.fn()} />)

    expect(screen.queryByText(/Reference:/)).not.toBeInTheDocument()
  })

  it("reports once per error, not on every re-render", () => {
    const error = makeError("kaboom")
    const { rerender } = render(<ErrorBoundary error={error} reset={jest.fn()} />)

    rerender(<ErrorBoundary error={error} reset={jest.fn()} />)
    rerender(<ErrorBoundary error={error} reset={jest.fn()} />)

    expect(reported).toHaveLength(1)
  })

  it("reports again when a different error arrives", () => {
    const { rerender } = render(<ErrorBoundary error={makeError("first")} reset={jest.fn()} />)
    rerender(<ErrorBoundary error={makeError("second")} reset={jest.fn()} />)

    expect(reported).toHaveLength(2)
    expect(reported[1].error?.message).toBe("second")
  })
})

describe("app/global-error.tsx (root error boundary)", () => {
  it("reports the error under its own scope", () => {
    render(<GlobalErrorBoundary error={makeError("layout down", "d-9")} reset={jest.fn()} />)

    expect(reported).toHaveLength(1)
    expect(reported[0]).toMatchObject({
      level: "error",
      scope: "app.global-error-boundary",
      message: "unhandled error in root layout",
      context: { digest: "d-9" },
      error: { message: "layout down" },
    })
  })

  it("calls reset when the retry button is clicked", async () => {
    const reset = jest.fn()
    render(<GlobalErrorBoundary error={makeError("layout down")} reset={reset} />)

    await userEvent.click(screen.getByRole("button", { name: /try again/i }))

    expect(reset).toHaveBeenCalledTimes(1)
  })
})
