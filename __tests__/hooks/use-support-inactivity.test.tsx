/**
 * Tests for hooks/use-support-inactivity.ts.
 *
 * Extracted from floating-support-widget.tsx, where two interleaved effects ran
 * this and the countdown dispatched the session teardown from inside a
 * setState updater. These use fake timers to drive the full hour-then-countdown
 * sequence, which is not otherwise reachable in a test.
 */

import { act, renderHook } from "@testing-library/react"
import { INACTIVITY_POLL_MS, INACTIVITY_TIMEOUT_MS, TERMINATION_COUNTDOWN_SEC, useSupportInactivity } from "@/hooks/use-support-inactivity"

/** Advances timers inside act so React flushes the resulting state updates. */
function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms)
  })
}

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe("useSupportInactivity", () => {
  it("starts with no prompt and a full countdown", () => {
    const { result } = renderHook(() => useSupportInactivity({ onPrompt: jest.fn(), onExpire: jest.fn() }))

    expect(result.current.promptActive).toBe(false)
    expect(result.current.secondsRemaining).toBe(TERMINATION_COUNTDOWN_SEC)
  })

  it("stays quiet while the buyer is within the idle window", () => {
    const onPrompt = jest.fn()
    const { result } = renderHook(() => useSupportInactivity({ onPrompt, onExpire: jest.fn() }))

    advance(INACTIVITY_TIMEOUT_MS - INACTIVITY_POLL_MS * 2)

    expect(onPrompt).not.toHaveBeenCalled()
    expect(result.current.promptActive).toBe(false)
  })

  it("prompts once the idle threshold is crossed", () => {
    const onPrompt = jest.fn()
    const { result } = renderHook(() => useSupportInactivity({ onPrompt, onExpire: jest.fn() }))

    advance(INACTIVITY_TIMEOUT_MS + INACTIVITY_POLL_MS)

    expect(onPrompt).toHaveBeenCalledTimes(1)
    expect(result.current.promptActive).toBe(true)
  })

  it("does not prompt again while the prompt is already up", () => {
    const onPrompt = jest.fn()
    renderHook(() => useSupportInactivity({ onPrompt, onExpire: jest.fn() }))

    advance(INACTIVITY_TIMEOUT_MS + INACTIVITY_POLL_MS)
    advance(INACTIVITY_POLL_MS * 10)

    expect(onPrompt).toHaveBeenCalledTimes(1)
  })

  it("counts down once the prompt is up", () => {
    const { result } = renderHook(() => useSupportInactivity({ onPrompt: jest.fn(), onExpire: jest.fn() }))

    advance(INACTIVITY_TIMEOUT_MS + INACTIVITY_POLL_MS)
    advance(5000)

    expect(result.current.secondsRemaining).toBe(TERMINATION_COUNTDOWN_SEC - 5)
  })

  it("does not count down before the prompt appears", () => {
    const { result } = renderHook(() => useSupportInactivity({ onPrompt: jest.fn(), onExpire: jest.fn() }))

    advance(5000)

    expect(result.current.secondsRemaining).toBe(TERMINATION_COUNTDOWN_SEC)
  })

  it("expires the session exactly once when the countdown runs out", () => {
    const onExpire = jest.fn()
    const { result } = renderHook(() => useSupportInactivity({ onPrompt: jest.fn(), onExpire }))

    advance(INACTIVITY_TIMEOUT_MS + INACTIVITY_POLL_MS)
    advance(TERMINATION_COUNTDOWN_SEC * 1000)

    expect(onExpire).toHaveBeenCalledTimes(1)
    expect(result.current.promptActive).toBe(false)
  })

  it("does not expire again after the countdown reaches zero", () => {
    const onExpire = jest.fn()
    renderHook(() => useSupportInactivity({ onPrompt: jest.fn(), onExpire }))

    advance(INACTIVITY_TIMEOUT_MS + INACTIVITY_POLL_MS)
    advance(TERMINATION_COUNTDOWN_SEC * 1000)
    advance(60_000)

    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it("cancels the prompt when the buyer comes back", () => {
    const onExpire = jest.fn()
    const { result } = renderHook(() => useSupportInactivity({ onPrompt: jest.fn(), onExpire }))

    advance(INACTIVITY_TIMEOUT_MS + INACTIVITY_POLL_MS)
    act(() => result.current.registerActivity())

    expect(result.current.promptActive).toBe(false)

    advance(TERMINATION_COUNTDOWN_SEC * 1000)
    expect(onExpire).not.toHaveBeenCalled()
  })

  it("restarts the idle clock on activity", () => {
    const onPrompt = jest.fn()
    const { result } = renderHook(() => useSupportInactivity({ onPrompt, onExpire: jest.fn() }))

    advance(INACTIVITY_TIMEOUT_MS - 60_000)
    act(() => result.current.registerActivity())
    advance(INACTIVITY_TIMEOUT_MS - 60_000)

    expect(onPrompt).not.toHaveBeenCalled()

    advance(120_000)
    expect(onPrompt).toHaveBeenCalledTimes(1)
  })

  it("clears the prompt without counting as activity when dismissed", () => {
    const onPrompt = jest.fn()
    const { result } = renderHook(() => useSupportInactivity({ onPrompt, onExpire: jest.fn() }))

    advance(INACTIVITY_TIMEOUT_MS + INACTIVITY_POLL_MS)
    act(() => result.current.dismissPrompt())

    expect(result.current.promptActive).toBe(false)

    // The idle clock was never reset, so the next poll prompts again.
    advance(INACTIVITY_POLL_MS)
    expect(onPrompt).toHaveBeenCalledTimes(2)
  })

  it("uses the latest callbacks without restarting the timers", () => {
    const first = jest.fn()
    const second = jest.fn()
    const { rerender } = renderHook(({ onPrompt }) => useSupportInactivity({ onPrompt, onExpire: jest.fn() }), {
      initialProps: { onPrompt: first },
    })

    advance(INACTIVITY_TIMEOUT_MS - INACTIVITY_POLL_MS)
    rerender({ onPrompt: second })
    advance(INACTIVITY_POLL_MS * 2)

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it("stops its timers on unmount", () => {
    const onPrompt = jest.fn()
    const { unmount } = renderHook(() => useSupportInactivity({ onPrompt, onExpire: jest.fn() }))

    unmount()
    advance(INACTIVITY_TIMEOUT_MS * 2)

    expect(onPrompt).not.toHaveBeenCalled()
  })
})
