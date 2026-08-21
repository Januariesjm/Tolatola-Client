/**
 * Tests for useSubscriptionPaymentPoll (hooks/use-subscription-payment-poll.ts).
 *
 * A checkout does not resolve synchronously -- ClickPesa confirms via its own
 * webhook -- so this is what tells the client the payment went through, failed,
 * or never resolved. Timing is exercised with fake timers rather than real
 * delays.
 */

import { clientApiGet } from "@/lib/api-client"
import { useSubscriptionPaymentPoll } from "@/hooks/use-subscription-payment-poll"

jest.mock("@/lib/api-client", () => ({ clientApiGet: jest.fn() }))
const mockGet = clientApiGet as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
  jest.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  jest.useRealTimers()
  jest.restoreAllMocks()
})

/** Advances past `n` poll intervals, flushing the async work each tick schedules. */
async function advancePolls(n: number, intervalMs = 3000) {
  for (let i = 0; i < n; i++) {
    jest.advanceTimersByTime(intervalMs)
    // Each tick's checkStatus() is async; let its microtasks settle.
    await Promise.resolve()
    await Promise.resolve()
  }
}

describe("useSubscriptionPaymentPoll", () => {
  it("requests the status for the given account type", () => {
    mockGet.mockResolvedValue({ data: { status: "pending" } })
    const { startPolling } = useSubscriptionPaymentPoll({
      accountType: "transporter",
      onActive: jest.fn(),
      onFailed: jest.fn(),
      onTimeout: jest.fn(),
    })

    startPolling("sub-1")
    jest.advanceTimersByTime(3000)

    expect(mockGet).toHaveBeenCalledWith("subscriptions/status/sub-1?type=transporter")
  })

  it("calls onActive and stops polling once the status is active", async () => {
    mockGet.mockResolvedValue({ data: { status: "active" } })
    const onActive = jest.fn()
    const { startPolling } = useSubscriptionPaymentPoll({ accountType: "vendor", onActive, onFailed: jest.fn(), onTimeout: jest.fn() })

    startPolling("sub-1")
    await advancePolls(1)

    expect(onActive).toHaveBeenCalledTimes(1)

    await advancePolls(5)
    expect(mockGet).toHaveBeenCalledTimes(1)
  })

  it.each([["rejected"], ["failed"]])("calls onFailed and stops polling once the status is %s", async (status) => {
    mockGet.mockResolvedValue({ data: { status, click_pesa_error: "insufficient funds" } })
    const onFailed = jest.fn()
    const { startPolling } = useSubscriptionPaymentPoll({ accountType: "transporter", onActive: jest.fn(), onFailed, onTimeout: jest.fn() })

    startPolling("sub-1")
    await advancePolls(1)

    expect(onFailed).toHaveBeenCalledWith("insufficient funds")
    await advancePolls(5)
    expect(mockGet).toHaveBeenCalledTimes(1)
  })

  it("falls back to a generic message when the failure carries no ClickPesa error", async () => {
    mockGet.mockResolvedValue({ data: { status: "failed" } })
    const onFailed = jest.fn()
    const { startPolling } = useSubscriptionPaymentPoll({ accountType: "transporter", onActive: jest.fn(), onFailed, onTimeout: jest.fn() })

    startPolling("sub-1")
    await advancePolls(1)

    expect(onFailed).toHaveBeenCalledWith("The transaction was unsuccessful. Please try again.")
  })

  it("keeps polling while the status is pending", async () => {
    mockGet.mockResolvedValue({ data: { status: "pending" } })
    const onActive = jest.fn()
    const onFailed = jest.fn()
    const { startPolling } = useSubscriptionPaymentPoll({ accountType: "transporter", onActive, onFailed, onTimeout: jest.fn() })

    startPolling("sub-1")
    await advancePolls(3)

    expect(mockGet).toHaveBeenCalledTimes(3)
    expect(onActive).not.toHaveBeenCalled()
    expect(onFailed).not.toHaveBeenCalled()
  })

  it("calls onTimeout after maxAttempts without a resolved status", async () => {
    mockGet.mockResolvedValue({ data: { status: "pending" } })
    const onTimeout = jest.fn()
    const { startPolling } = useSubscriptionPaymentPoll({
      accountType: "transporter",
      onActive: jest.fn(),
      onFailed: jest.fn(),
      onTimeout,
      maxAttempts: 3,
    })

    startPolling("sub-1")
    await advancePolls(3)

    expect(onTimeout).toHaveBeenCalledTimes(1)
    expect(mockGet).toHaveBeenCalledTimes(3)
  })

  it("does not call onTimeout if the status resolves on the very last attempt", async () => {
    mockGet.mockResolvedValueOnce({ data: { status: "pending" } }).mockResolvedValueOnce({ data: { status: "active" } })
    const onActive = jest.fn()
    const onTimeout = jest.fn()
    const { startPolling } = useSubscriptionPaymentPoll({
      accountType: "transporter",
      onActive,
      onFailed: jest.fn(),
      onTimeout,
      maxAttempts: 2,
    })

    startPolling("sub-1")
    await advancePolls(2)

    expect(onActive).toHaveBeenCalledTimes(1)
    expect(onTimeout).not.toHaveBeenCalled()
  })

  it("treats a network error as inconclusive rather than a failure, and keeps polling", async () => {
    mockGet.mockRejectedValueOnce(new Error("network down")).mockResolvedValueOnce({ data: { status: "active" } })
    const onActive = jest.fn()
    const onFailed = jest.fn()
    const { startPolling } = useSubscriptionPaymentPoll({ accountType: "transporter", onActive, onFailed, onTimeout: jest.fn() })

    startPolling("sub-1")
    await advancePolls(2)

    expect(onFailed).not.toHaveBeenCalled()
    expect(onActive).toHaveBeenCalledTimes(1)
  })

  it("stops immediately when the returned stop function is called", async () => {
    mockGet.mockResolvedValue({ data: { status: "pending" } })
    const { startPolling } = useSubscriptionPaymentPoll({
      accountType: "transporter",
      onActive: jest.fn(),
      onFailed: jest.fn(),
      onTimeout: jest.fn(),
    })

    const stop = startPolling("sub-1")
    await advancePolls(1)
    stop()
    await advancePolls(5)

    expect(mockGet).toHaveBeenCalledTimes(1)
  })

  it("respects a custom interval and attempt count", async () => {
    mockGet.mockResolvedValue({ data: { status: "pending" } })
    const onTimeout = jest.fn()
    const { startPolling } = useSubscriptionPaymentPoll({
      accountType: "transporter",
      onActive: jest.fn(),
      onFailed: jest.fn(),
      onTimeout,
      intervalMs: 500,
      maxAttempts: 2,
    })

    startPolling("sub-1")
    await advancePolls(2, 500)

    expect(mockGet).toHaveBeenCalledTimes(2)
    expect(onTimeout).toHaveBeenCalledTimes(1)
  })
})
