/**
 * Tests for useConfirmDelivery (hooks/use-confirm-delivery.ts).
 *
 * This is the request that finalises payments and closes escrow. The behaviour
 * worth protecting is that a non-OK response is *not* treated as success: an
 * earlier version refreshed only on `response.ok` and ignored every other
 * outcome, so a 409 or a 500 looked exactly like a confirmed delivery.
 */

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useConfirmDelivery } from "@/hooks/use-confirm-delivery"
import { setErrorReporter, type LogRecord } from "@/lib/logger"

const mockRefresh = jest.fn()
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh, push: jest.fn(), replace: jest.fn() }),
}))

/** Minimal host so the hook can be driven through real interaction. */
function Harness({ orderId = "ord-1" }: { orderId?: string }) {
  const { isConfirming, confirmError, confirmDelivery } = useConfirmDelivery(orderId)

  return (
    <div>
      <button onClick={confirmDelivery} disabled={isConfirming}>
        confirm
      </button>
      <span data-testid="state">{isConfirming ? "confirming" : "idle"}</span>
      {confirmError && <p role="alert">{confirmError}</p>}
    </div>
  )
}

let reported: LogRecord[]

beforeEach(() => {
  jest.clearAllMocks()
  reported = []
  setErrorReporter((record) => reported.push(record))
  jest.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  setErrorReporter(null)
  jest.restoreAllMocks()
})

const mockFetch = (impl: () => Promise<unknown>) => {
  const fetchMock = jest.fn(impl)
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

const click = () => userEvent.click(screen.getByRole("button", { name: "confirm" }))

describe("useConfirmDelivery", () => {
  it("posts the order id to the confirm-delivery route", async () => {
    const fetchMock = mockFetch(async () => ({ ok: true }))
    render(<Harness orderId="ord-42" />)

    await click()

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe("/api/orders/confirm-delivery")
    expect(init.method).toBe("POST")
    expect(JSON.parse(String(init.body))).toEqual({ orderId: "ord-42" })
  })

  it("refreshes the page on success, so the new status is shown", async () => {
    mockFetch(async () => ({ ok: true }))
    render(<Harness />)

    await click()

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1))
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it.each([[409], [422], [500]])("treats a %d as a failure rather than a success", async (status) => {
    mockFetch(async () => ({ ok: false, status }))
    render(<Harness />)

    await click()

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("We couldn't confirm delivery. Please try again."))
    // The critical half: no refresh, so the UI does not imply it worked.
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it("reports the failing status, so the cause is recoverable from logs", async () => {
    mockFetch(async () => ({ ok: false, status: 409 }))
    render(<Harness />)

    await click()

    await waitFor(() => expect(reported).toHaveLength(1))
    expect(reported[0].message).toBe("failed to confirm delivery")
    expect(reported[0].error?.message).toContain("409")
    expect(reported[0].context).toEqual({ orderId: "ord-1" })
  })

  it("surfaces a network failure the same way", async () => {
    mockFetch(async () => {
      throw new Error("network down")
    })
    render(<Harness />)

    await click()

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument())
    expect(reported[0].error?.message).toBe("network down")
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it("clears a previous error once a retry succeeds", async () => {
    let attempt = 0
    mockFetch(async () => {
      attempt += 1
      return attempt === 1 ? { ok: false, status: 500 } : { ok: true }
    })
    render(<Harness />)

    await click()
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument())

    await click()

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument())
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it("returns to idle after a failure, so the buyer can retry", async () => {
    mockFetch(async () => ({ ok: false, status: 500 }))
    render(<Harness />)

    await click()

    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("idle"))
    expect(screen.getByRole("button", { name: "confirm" })).toBeEnabled()
  })

  it("disables the button while a request is in flight, so it cannot double-submit", async () => {
    let release: (value: unknown) => void = () => {}
    mockFetch(() => new Promise((resolve) => (release = resolve)))
    render(<Harness />)

    await click()

    await waitFor(() => expect(screen.getByRole("button", { name: "confirm" })).toBeDisabled())
    expect(screen.getByTestId("state")).toHaveTextContent("confirming")

    release({ ok: true })
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("idle"))
  })
})
