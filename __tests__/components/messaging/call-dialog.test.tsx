import React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CallDialog } from "@/components/messaging/call-dialog"

/**
 * Tests for components/messaging/call-dialog.tsx.
 *
 * This is a simulated call UI: it starts "calling", auto-connects two seconds
 * later, ticks a duration counter, and logs the call as "completed" or
 * "missed" depending on which state it was in when the user hangs up. All of
 * that is timer-driven, so these tests run on fake timers and advance them
 * explicitly rather than asserting on real wall-clock behaviour.
 */

const logCall = jest.fn()
const toast = jest.fn()

jest.mock("@/hooks/use-toast", () => ({ toast: (...args: unknown[]) => toast(...args) }))
jest.mock("@/app/actions/messaging", () => ({
  logCall: (...args: unknown[]) => logCall(...args),
}))

const BASE = {
  open: true,
  onOpenChange: jest.fn(),
  conversationId: "conv-1",
  callType: "voice" as const,
  shopName: "Kanga Emporium",
}

beforeEach(() => {
  jest.clearAllMocks()
  logCall.mockResolvedValue({ success: true })
})

afterEach(() => {
  jest.useRealTimers()
})

describe("CallDialog title and calling state", () => {
  it("titles a voice call with the shop name", () => {
    render(<CallDialog {...BASE} callType="voice" />)

    expect(screen.getByText("Voice Call with Kanga Emporium")).toBeInTheDocument()
  })

  it("titles a video call differently", () => {
    render(<CallDialog {...BASE} callType="video" />)

    expect(screen.getByText("Video Call with Kanga Emporium")).toBeInTheDocument()
  })

  it("starts in the calling state", () => {
    render(<CallDialog {...BASE} />)

    expect(screen.getByText("Calling...")).toBeInTheDocument()
    expect(screen.queryByText("Connected")).not.toBeInTheDocument()
  })

  it("renders nothing when closed", () => {
    render(<CallDialog {...BASE} open={false} />)

    expect(screen.queryByText(/Call with/)).not.toBeInTheDocument()
  })
})

describe("CallDialog auto-connect", () => {
  it("connects automatically after two seconds while open", () => {
    jest.useFakeTimers()
    render(<CallDialog {...BASE} />)

    act(() => {
      jest.advanceTimersByTime(2000)
    })

    expect(screen.getByText("Connected")).toBeInTheDocument()
    expect(screen.queryByText("Calling...")).not.toBeInTheDocument()
  })

  it("does not auto-connect while closed", () => {
    jest.useFakeTimers()
    render(<CallDialog {...BASE} open={false} />)

    act(() => {
      jest.advanceTimersByTime(5000)
    })

    expect(screen.queryByText("Connected")).not.toBeInTheDocument()
  })

  it("ticks the duration counter once connected", () => {
    jest.useFakeTimers()
    render(<CallDialog {...BASE} />)

    act(() => {
      jest.advanceTimersByTime(2000)
    })
    expect(screen.getByText("0:00")).toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(3000)
    })
    expect(screen.getByText("0:03")).toBeInTheDocument()
  })

  it("formats durations over a minute with zero-padded seconds", () => {
    jest.useFakeTimers()
    render(<CallDialog {...BASE} />)

    act(() => {
      jest.advanceTimersByTime(2000)
    })
    act(() => {
      jest.advanceTimersByTime(65000)
    })

    expect(screen.getByText("1:05")).toBeInTheDocument()
  })
})

describe("CallDialog mute toggle", () => {
  it("shows a mic icon and switches to a muted icon on click", async () => {
    render(<CallDialog {...BASE} />)

    const buttons = screen.getAllByRole("button")
    const muteButton = buttons[0]

    expect(muteButton.querySelector("svg.lucide-mic")).toBeTruthy()

    await userEvent.click(muteButton)

    expect(muteButton.querySelector("svg.lucide-mic-off")).toBeTruthy()
  })

  it("toggles back to unmuted on a second click", async () => {
    render(<CallDialog {...BASE} />)

    const muteButton = screen.getAllByRole("button")[0]
    await userEvent.click(muteButton)
    await userEvent.click(muteButton)

    expect(muteButton.querySelector("svg.lucide-mic")).toBeTruthy()
  })
})

describe("CallDialog hang up", () => {
  // These exercise handleEndCall's branch on callStatus and its follow-on
  // setTimeout reset, both timer-driven, so they run on fake timers.
  // userEvent's internal scheduling doesn't play well with fake timers, so
  // interactions here use fireEvent directly.

  it("logs a missed call when ending before connecting", async () => {
    jest.useFakeTimers()
    const onOpenChange = jest.fn()
    render(<CallDialog {...BASE} onOpenChange={onOpenChange} />)

    const hangUpButton = screen.getAllByRole("button")[1]
    await act(async () => {
      fireEvent.click(hangUpButton)
    })

    expect(logCall).toHaveBeenCalledWith("conv-1", "", "voice", "missed", 0)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("logs a completed call with the accrued duration when ending after connecting", async () => {
    jest.useFakeTimers()
    render(<CallDialog {...BASE} />)

    act(() => {
      jest.advanceTimersByTime(2000)
    })
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    const hangUpButton = screen.getAllByRole("button")[1]
    await act(async () => {
      fireEvent.click(hangUpButton)
    })

    expect(logCall).toHaveBeenCalledWith("conv-1", "", "voice", "completed", 5)
  })

  it("toasts a voice call summary on hang up", async () => {
    jest.useFakeTimers()
    render(<CallDialog {...BASE} callType="voice" />)

    const hangUpButton = screen.getAllByRole("button")[1]
    await act(async () => {
      fireEvent.click(hangUpButton)
    })

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Call Ended", description: expect.stringContaining("Voice call ended after") }),
    )
  })

  it("toasts a video call summary on hang up", async () => {
    jest.useFakeTimers()
    render(<CallDialog {...BASE} callType="video" />)

    const hangUpButton = screen.getAllByRole("button")[1]
    await act(async () => {
      fireEvent.click(hangUpButton)
    })

    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ description: expect.stringContaining("Video call ended after") }))
  })

  it("resets to the calling state and zero duration after the reset delay", async () => {
    jest.useFakeTimers()
    const onOpenChange = jest.fn()
    render(<CallDialog {...BASE} onOpenChange={onOpenChange} open={true} />)

    act(() => {
      jest.advanceTimersByTime(2000)
    })
    act(() => {
      jest.advanceTimersByTime(3000)
    })

    const hangUpButton = screen.getAllByRole("button")[1]
    await act(async () => {
      fireEvent.click(hangUpButton)
    })

    // Right after ending, callStatus is "ended" -- neither the "calling" nor
    // "connected" panel renders.
    expect(screen.queryByText("Calling...")).not.toBeInTheDocument()
    expect(screen.queryByText("Connected")).not.toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(screen.getByText("Calling...")).toBeInTheDocument()
  })
})
