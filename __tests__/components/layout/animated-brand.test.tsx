import React from "react"
import { render, screen, act } from "@testing-library/react"
import AnimatedBrand from "@/components/layout/animated-brand"

/**
 * Tests for components/layout/animated-brand.tsx.
 *
 * Typewriter-style intro: "TOLA" is typed in word-by-word (only one word
 * here) on a 500ms timer, then the whole thing pauses for 2000ms before
 * clearing and looping. Fake timers are required to actually observe the
 * word appearing and the loop resetting, rather than only seeing frame zero.
 */

describe("AnimatedBrand", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("renders the logo and tagline immediately", () => {
    render(<AnimatedBrand />)

    expect(screen.getByAltText("TOLA Logo")).toBeInTheDocument()
    expect(screen.getByText(/tanzania's trusted digital trade and supply chain ecosystem/i)).toBeInTheDocument()
  })

  it("has not typed the word yet on first render", () => {
    render(<AnimatedBrand />)

    expect(screen.queryByText("TOLA")).not.toBeInTheDocument()
  })

  it("types the word in after 500ms", () => {
    render(<AnimatedBrand />)

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(screen.getByText("TOLA")).toBeInTheDocument()
  })

  it("clears the word and loops after the word displays for 2000ms", () => {
    render(<AnimatedBrand />)

    act(() => {
      jest.advanceTimersByTime(500) // word appears
    })
    expect(screen.getByText("TOLA")).toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(2000) // hold, then reset fires
    })
    expect(screen.queryByText("TOLA")).not.toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(500) // second loop types it back in
    })
    expect(screen.getByText("TOLA")).toBeInTheDocument()
  })
})
