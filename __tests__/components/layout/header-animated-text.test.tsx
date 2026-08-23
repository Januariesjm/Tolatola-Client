import React from "react"
import { render, screen, act } from "@testing-library/react"
import { HeaderAnimatedText } from "@/components/layout/header-animated-text"

/**
 * Tests for components/layout/header-animated-text.tsx.
 *
 * Same typewriter pattern as AnimatedBrand but tuned for the header: "TOLA"
 * types in after 400ms and the blinking cursor (a bare <span>, no text)
 * disappears once the word is fully shown, then the whole thing resets after
 * a 2000ms hold. Fake timers drive the sequence instead of only checking the
 * initial frame.
 */

describe("HeaderAnimatedText", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("shows only the blinking cursor, no word, on first render", () => {
    const { container } = render(<HeaderAnimatedText />)

    expect(screen.queryByText("TOLA")).not.toBeInTheDocument()
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
  })

  it("types the word in after 400ms and hides the cursor", () => {
    const { container } = render(<HeaderAnimatedText />)

    act(() => {
      jest.advanceTimersByTime(400)
    })

    expect(screen.getByText("TOLA")).toBeInTheDocument()
    expect(container.querySelector(".animate-pulse")).not.toBeInTheDocument()
  })

  it("clears the word and shows the cursor again after the 2000ms hold, then retypes", () => {
    const { container } = render(<HeaderAnimatedText />)

    act(() => {
      jest.advanceTimersByTime(400)
    })
    expect(screen.getByText("TOLA")).toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(2000)
    })
    expect(screen.queryByText("TOLA")).not.toBeInTheDocument()
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(400)
    })
    expect(screen.getByText("TOLA")).toBeInTheDocument()
  })
})
