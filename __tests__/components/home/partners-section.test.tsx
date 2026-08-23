/**
 * Tests for PartnersSection (components/home/partners-section.tsx).
 *
 * The partner list is a hardcoded internal constant (no props), so the
 * tests pin down the section heading, that every partner logo/name in the
 * list renders, and that the left/right navigation buttons call
 * scrollBy on the scroll container instead of throwing.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PartnersSection } from "@/components/home/partners-section"

describe("PartnersSection", () => {
  it("renders the section heading", () => {
    render(<PartnersSection />)

    expect(screen.getByRole("heading", { name: /our partners/i })).toBeInTheDocument()
  })

  it("renders every partner's name and logo", () => {
    render(<PartnersSection />)

    const names = [
      "CLICKPESA",
      "AIRTEL",
      "VODACOM",
      "MIX BY YAS",
      "HALOTEL",
      "CRDB BANK",
      "EQUITY BANK",
      "NMB BANK",
      "ABSA BANK",
      "DAN'G GROUP",
    ]

    for (const name of names) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }

    expect(screen.getAllByRole("img")).toHaveLength(names.length)
  })

  it("renders left and right scroll controls", () => {
    render(<PartnersSection />)

    expect(screen.getByRole("button", { name: /scroll left/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /scroll right/i })).toBeInTheDocument()
  })

  it("scrolls the container right when the right arrow is clicked", async () => {
    // jsdom doesn't implement scroll layout, so Element.scrollBy is undefined
    // by default -- provide a spy to observe the call.
    Element.prototype.scrollBy = jest.fn()

    render(<PartnersSection />)

    await userEvent.click(screen.getByRole("button", { name: /scroll right/i }))

    expect(Element.prototype.scrollBy).toHaveBeenCalledWith({ left: 320, behavior: "smooth" })
  })

  it("scrolls the container left when the left arrow is clicked", async () => {
    Element.prototype.scrollBy = jest.fn()

    render(<PartnersSection />)

    await userEvent.click(screen.getByRole("button", { name: /scroll left/i }))

    expect(Element.prototype.scrollBy).toHaveBeenCalledWith({ left: -320, behavior: "smooth" })
  })
})
