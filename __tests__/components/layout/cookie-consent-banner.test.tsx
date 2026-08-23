import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CookieConsentBanner } from "@/components/layout/cookie-consent-banner"

/**
 * Tests for components/layout/cookie-consent-banner.tsx.
 *
 * The banner's whole job is deciding, from localStorage, whether it should be
 * visible, and persisting the user's choice back to localStorage when they
 * act. Covered here: first-visit visibility, hiding once "accepted" is
 * already stored, Accept persisting + hiding, and Reject persisting +
 * hiding-for-this-session while keeping "rejected" on disk for next visit.
 */

const STORAGE_KEY = "tola-cookie-consent"

describe("CookieConsentBanner", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("renders the consent message and both actions on a first visit", () => {
    render(<CookieConsentBanner />)

    expect(screen.getByText(/we use cookies to improve performance/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument()
  })

  it("does not render when consent was already accepted in a prior visit", () => {
    window.localStorage.setItem(STORAGE_KEY, "accepted")
    render(<CookieConsentBanner />)

    expect(screen.queryByText(/we use cookies to improve performance/i)).not.toBeInTheDocument()
  })

  it("still renders on load when consent was previously rejected (not dismissed this session)", () => {
    window.localStorage.setItem(STORAGE_KEY, "rejected")
    render(<CookieConsentBanner />)

    expect(screen.getByText(/we use cookies to improve performance/i)).toBeInTheDocument()
  })

  it("persists acceptance to localStorage and hides itself when Accept is clicked", async () => {
    const user = userEvent.setup()
    render(<CookieConsentBanner />)

    await user.click(screen.getByRole("button", { name: /accept/i }))

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("accepted")
    expect(screen.queryByText(/we use cookies to improve performance/i)).not.toBeInTheDocument()
  })

  it("persists rejection to localStorage and hides itself for the session when Reject is clicked", async () => {
    const user = userEvent.setup()
    render(<CookieConsentBanner />)

    await user.click(screen.getByRole("button", { name: /reject/i }))

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("rejected")
    expect(screen.queryByText(/we use cookies to improve performance/i)).not.toBeInTheDocument()
  })

  it("does not throw when localStorage access fails", async () => {
    const original = window.localStorage.getItem
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window.localStorage.getItem as any) = () => {
      throw new Error("storage disabled")
    }

    expect(() => render(<CookieConsentBanner />)).not.toThrow()

    window.localStorage.getItem = original
  })
})
