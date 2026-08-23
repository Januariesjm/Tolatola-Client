import React from "react"
import { render, act } from "@testing-library/react"
import BackgroundSlider from "@/components/layout/background-slider"

/**
 * Tests for components/layout/background-slider.tsx.
 *
 * Four fixed background images are stacked absolutely and cross-faded via
 * opacity on a 5000ms interval, cycling back to the first after the fourth.
 * There's no visible text or role to query, so the slides are asserted
 * directly via their inline `opacity` style. Fake timers drive the interval
 * through a full cycle to confirm it actually wraps around.
 */

function getOpacities(container: HTMLElement): string[] {
  // The four slide divs are the ones carrying a backgroundImage inline style;
  // the trailing gradient overlay div has none.
  return Array.from(container.querySelectorAll("div"))
    .filter((el) => el.style.backgroundImage)
    .map((el) => el.style.opacity)
}

describe("BackgroundSlider", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("renders four slides with only the first one visible", () => {
    const { container } = render(<BackgroundSlider />)

    const opacities = getOpacities(container)
    expect(opacities).toEqual(["0.15", "0", "0", "0"])
  })

  it("renders the gradient overlay on top", () => {
    const { container } = render(<BackgroundSlider />)

    expect(container.querySelector(".bg-gradient-to-b")).toBeInTheDocument()
  })

  it("advances to the next slide every 5000ms", () => {
    const { container } = render(<BackgroundSlider />)

    act(() => {
      jest.advanceTimersByTime(5000)
    })
    expect(getOpacities(container)).toEqual(["0", "0.15", "0", "0"])

    act(() => {
      jest.advanceTimersByTime(5000)
    })
    expect(getOpacities(container)).toEqual(["0", "0", "0.15", "0"])
  })

  it("wraps back to the first slide after a full cycle", () => {
    const { container } = render(<BackgroundSlider />)

    act(() => {
      jest.advanceTimersByTime(5000 * 4)
    })

    expect(getOpacities(container)).toEqual(["0.15", "0", "0", "0"])
  })

  it("clears the interval on unmount", () => {
    const { unmount } = render(<BackgroundSlider />)
    const clearSpy = jest.spyOn(global, "clearInterval")

    unmount()

    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()
  })
})
