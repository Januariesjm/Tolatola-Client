import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SiteFooter } from "@/components/layout/site-footer"

/**
 * Tests for components/layout/site-footer.tsx.
 *
 * Purely static/presentational aside from one behavior: the "Contact Us"
 * support link is rendered as a button that dispatches a window
 * "open-support-chat" event instead of navigating, so the live-chat widget
 * elsewhere in the app can pick it up. Everything else here is a fixed set of
 * links, office/contact details, and the copyright line, so the tests assert
 * those are present with the right hrefs/text rather than re-deriving the
 * component's internals.
 */

describe("SiteFooter", () => {
  it("renders the brand name and tagline", () => {
    render(<SiteFooter />)

    expect(screen.getByRole("heading", { level: 2, name: /tola/i })).toBeInTheDocument()
    // Case-sensitive: the copyright line at the bottom repeats similar words
    // with different capitalization ("TOLA Digital Trade and Supply Chain
    // Ecosystem."), so a loose match would find both.
    expect(screen.getByText("Digital trade and Supply Chain Ecosystem")).toBeInTheDocument()
  })

  it("links the brand mark back to the homepage", () => {
    render(<SiteFooter />)

    const brandLink = screen.getByRole("link", { name: /tola[\s\S]*digital trade and supply chain ecosystem/i })
    expect(brandLink).toHaveAttribute("href", "/")
  })

  it("renders every company link with its expected destination", () => {
    render(<SiteFooter />)

    const expected: Record<string, string> = {
      "About us": "/about",
      "Meet the Founder": "/founder",
      Careers: "/careers",
      "Our Blog": "/blog",
      "Privacy Policy": "/privacy",
      "Terms & Conditions": "/terms",
      "Vendor SLA": "/legal/sla-vendor",
      "Transporter SLA": "/legal/sla-transporter",
      "Agent Portal": "/agent/login",
    }

    for (const [name, href] of Object.entries(expected)) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href)
    }
  })

  it("renders every support link with its expected destination", () => {
    render(<SiteFooter />)

    const expected: Record<string, string> = {
      "Track Order": "/track",
      "Market Survey": "/validation",
      FAQ: "/faq",
      "Account Deletion Request": "/account-deletion-request",
      "Return Policy": "/return-policy",
      "Site Map": "/sitemap",
    }

    for (const [name, href] of Object.entries(expected)) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href)
    }
  })

  it("renders Contact Us as a Live Support action rather than a link", () => {
    render(<SiteFooter />)

    expect(screen.getByRole("button", { name: /live support/i })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /contact us/i })).not.toBeInTheDocument()
  })

  it("dispatches an open-support-chat event when Live Support is clicked", async () => {
    const listener = jest.fn()
    window.addEventListener("open-support-chat", listener)
    const user = userEvent.setup()
    render(<SiteFooter />)

    await user.click(screen.getByRole("button", { name: /live support/i }))

    expect(listener).toHaveBeenCalledTimes(1)
    window.removeEventListener("open-support-chat", listener)
  })

  it("renders both office locations with click-to-call phone numbers", () => {
    render(<SiteFooter />)

    expect(screen.getByText("Mikocheni Dar Es Salaam HQ")).toBeInTheDocument()
    expect(screen.getByText("Kibaha Pwani Main Branch")).toBeInTheDocument()

    expect(screen.getByRole("link", { name: "+255 678 227 227" })).toHaveAttribute("href", "tel:+255678227227")
    expect(screen.getByRole("link", { name: "+255 625 377 978" })).toHaveAttribute("href", "tel:+255625377978")
  })

  it("shows the support email address", () => {
    render(<SiteFooter />)

    expect(screen.getByText("support@tolatola.co")).toBeInTheDocument()
  })

  it("renders social links pointing at the real profile URLs", () => {
    render(<SiteFooter />)

    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"))

    expect(hrefs).toContain("https://www.facebook.com/profile.php?id=61585501071622")
    expect(hrefs).toContain("https://www.instagram.com/tola_tanzania/")
    expect(hrefs).toContain("https://www.linkedin.com/in/faraja-dastan-mhalale-970821239/")
    expect(hrefs).toContain("https://www.tiktok.com/@tolatola.inc?is_from_webapp=1&sender_device=pc")
    expect(hrefs).toContain("https://play.google.com/store/apps/details?id=co.tolata.tolamobile&pcampaignid=web_share")
  })

  it("shows the current year in the copyright line", () => {
    render(<SiteFooter />)

    const year = new Date().getFullYear()
    expect(screen.getByText(new RegExp(`©\\s*${year}\\s*TOLA`))).toBeInTheDocument()
  })

  it("shows the company registration details", () => {
    render(<SiteFooter />)

    expect(screen.getByText(/owned and operated by tola global systems limited/i)).toBeInTheDocument()
    expect(screen.getByText(/company reg: 207121622/i)).toBeInTheDocument()
    expect(screen.getByText(/tin no: 207-121-622/i)).toBeInTheDocument()
  })

  it("shows an operational system status indicator and the theme toggle", () => {
    render(<SiteFooter />)

    expect(screen.getByText(/system status: operational/i)).toBeInTheDocument()
    // ThemeToggle renders a button once mounted; before that it shows the
    // same "Theme" placeholder text either way, so just assert it's present.
    expect(screen.getByRole("button", { name: /theme/i })).toBeInTheDocument()
  })
})
