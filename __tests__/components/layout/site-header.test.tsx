import React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import SiteHeader from "@/components/layout/site-header"

/**
 * Tests for components/layout/site-header.tsx.
 *
 * The component is a presentational shell wired to useSiteHeaderState() (auth
 * user/profile, cart count, mobile menu open state, scroll state, logout) and
 * useFavorites() (the favorites badge). Both are mocked here so this suite can
 * drive every branch directly instead of going through Supabase sessions and
 * localStorage. The four sub-widgets it embeds -- CartPopover,
 * NotificationPopover, LanguageSwitcher and ProductSearch -- are each covered
 * by their own suite, so they're stubbed here; this file only asserts they are
 * wired with the right props and appear in the right auth branch.
 *
 * jsdom has no Pointer Capture API, which Radix's Sheet/DropdownMenu touch on
 * pointer down -- polyfilled below, same fix used in mobile-bottom-nav.test.tsx
 * and language-switcher.test.tsx.
 */

if (typeof Element !== "undefined") {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {}
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {}
  }
}

// Use the real English strings so selectors match the copy users actually see.
jest.mock("@/lib/i18n/language-context", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { translations } = require("@/lib/i18n/translations")
  return {
    useLanguage: () => ({
      t: (key: string) => translations.en[key] ?? key,
      language: "en",
      setLanguage: jest.fn(),
    }),
  }
})

// site-header.tsx imports this package (unused directly, but transitively
// pulled in via @/lib/api-client too); mock it so module resolution doesn't
// reach a real Supabase client in the jsdom test environment.
jest.mock("@supabase/auth-helpers-nextjs", () => ({
  createClientComponentClient: () => ({}),
}))

const mockHandleLogout = jest.fn()
const mockSetMobileMenuOpen = jest.fn()

/** Mirrors the shape returned by hooks/use-site-header-state.ts. */
let mockState: {
  authUser: { id: string; email?: string | null } | null
  authProfile: Record<string, unknown> | null
  authKyc: string | null
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  scrolled: boolean
  cartCount: number
  handleLogout: () => void
  isVerified: boolean
  isHome: boolean
}

function resetState() {
  mockState = {
    authUser: null,
    authProfile: null,
    authKyc: null,
    mobileMenuOpen: false,
    setMobileMenuOpen: mockSetMobileMenuOpen,
    scrolled: false,
    cartCount: 0,
    handleLogout: mockHandleLogout,
    isVerified: false,
    isHome: true,
  }
}
resetState()

jest.mock("@/hooks/use-site-header-state", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const actual = jest.requireActual("@/hooks/use-site-header-state")
  return {
    getInitials: actual.getInitials,
    useSiteHeaderState: () => mockState,
  }
})

let mockFavorites: string[] = []
jest.mock("@/hooks/use-favorites", () => ({
  useFavorites: () => ({
    favorites: mockFavorites,
    toggleFavorite: jest.fn(),
    isLoading: false,
    isFavorite: () => false,
  }),
}))

jest.mock("@/components/layout/cart-popover", () => ({
  CartPopover: () => <div data-testid="cart-popover-stub" />,
}))
jest.mock("@/components/layout/language-switcher", () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher-stub" />,
}))
jest.mock("@/components/layout/product-search", () => ({
  ProductSearch: () => <div data-testid="product-search-stub" />,
}))
jest.mock("@/components/layout/notification-popover", () => ({
  NotificationPopover: ({ userType }: { userType?: string }) => (
    <div data-testid="notification-popover-stub" data-user-type={userType ?? ""} />
  ),
}))

function signedInUser(overrides: Record<string, unknown> = {}) {
  return {
    authUser: { id: "u1", email: "trader@example.com" },
    authProfile: {
      full_name: "Amina Hassan",
      email: "trader@example.com",
      profile_image_url: null,
      user_type: "vendor",
      ...overrides,
    },
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  resetState()
  mockFavorites = []
})

describe("SiteHeader branding and navigation", () => {
  it("links the desktop logo/brand back to the homepage", () => {
    render(<SiteHeader />)

    const brandLinks = screen.getAllByRole("link", { name: /TOLA\./ })
    expect(brandLinks.some((l) => l.getAttribute("href") === "/")).toBe(true)
  })

  it("renders Shop and Track links pointing at the right routes", () => {
    render(<SiteHeader />)

    const shopLinks = screen.getAllByRole("link", { name: /shop/i })
    expect(shopLinks.some((l) => l.getAttribute("href") === "/shop")).toBe(true)

    const trackLinks = screen.getAllByRole("link", { name: /track order/i })
    expect(trackLinks.length).toBeGreaterThan(0)
    trackLinks.forEach((l) => expect(l).toHaveAttribute("href", "/track"))
  })

  it("renders the favorites link pointing at /favorites", () => {
    render(<SiteHeader />)

    const favoriteLinks = screen.getAllByRole("link").filter((l) => l.getAttribute("href") === "/favorites")
    expect(favoriteLinks.length).toBeGreaterThan(0)
  })

  it("embeds the product search widget", () => {
    render(<SiteHeader />)

    expect(screen.getAllByTestId("product-search-stub").length).toBeGreaterThan(0)
  })

  it("embeds the language switcher", () => {
    render(<SiteHeader />)

    expect(screen.getAllByTestId("language-switcher-stub").length).toBeGreaterThan(0)
  })

  it("embeds the cart popover", () => {
    render(<SiteHeader />)

    expect(screen.getByTestId("cart-popover-stub")).toBeInTheDocument()
  })
})

describe("SiteHeader favorites badge", () => {
  it("shows no favorites badge when there are none", () => {
    mockFavorites = []
    render(<SiteHeader />)

    const favoriteLink = screen.getAllByRole("link").find((l) => l.getAttribute("href") === "/favorites")
    expect(favoriteLink?.textContent).toBe("")
  })

  it("shows the favorites count when there are some", () => {
    mockFavorites = ["p1", "p2"]
    render(<SiteHeader />)

    const favoriteLinks = screen.getAllByRole("link").filter((l) => l.getAttribute("href") === "/favorites")
    expect(favoriteLinks.some((l) => l.textContent === "2")).toBe(true)
  })

  it("caps the favorites badge at 9+", () => {
    mockFavorites = Array.from({ length: 15 }, (_, i) => `p${i}`)
    render(<SiteHeader />)

    const favoriteLinks = screen.getAllByRole("link").filter((l) => l.getAttribute("href") === "/favorites")
    expect(favoriteLinks.some((l) => l.textContent === "9+")).toBe(true)
  })
})

describe("SiteHeader cart badge (mobile)", () => {
  it("shows no cart badge for an empty cart", () => {
    mockState.cartCount = 0
    render(<SiteHeader />)

    const cartLink = screen.getAllByRole("link").find((l) => l.getAttribute("href") === "/cart")
    expect(cartLink?.textContent).toBe("")
  })

  it("shows the cart count", () => {
    mockState.cartCount = 5
    render(<SiteHeader />)

    const cartLink = screen.getAllByRole("link").find((l) => l.getAttribute("href") === "/cart")
    expect(cartLink?.textContent).toBe("5")
  })

  it("caps the cart badge at 99+", () => {
    mockState.cartCount = 150
    render(<SiteHeader />)

    const cartLink = screen.getAllByRole("link").find((l) => l.getAttribute("href") === "/cart")
    expect(cartLink?.textContent).toBe("99+")
  })
})

describe("SiteHeader signed-out state", () => {
  it("shows Sign In / Login / Sign Up links instead of an avatar", () => {
    render(<SiteHeader />)

    expect(screen.getByRole("link", { name: "Sign In" })).toHaveAttribute("href", "/auth/login")
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Sign Up" })).toHaveAttribute("href", "/auth/sign-up")
  })

  it("does not render the notification bell", () => {
    render(<SiteHeader />)

    expect(screen.queryByTestId("notification-popover-stub")).not.toBeInTheDocument()
  })

  it("does not render a user avatar menu trigger", () => {
    render(<SiteHeader />)

    expect(screen.queryByRole("button", { name: /your profile|log out/i })).not.toBeInTheDocument()
  })
})

describe("SiteHeader signed-in state", () => {
  it("renders the notification bell with the profile's user type", () => {
    Object.assign(mockState, signedInUser())
    render(<SiteHeader />)

    expect(screen.getByTestId("notification-popover-stub")).toHaveAttribute("data-user-type", "vendor")
  })

  it("does not show Login/Sign Up links", () => {
    Object.assign(mockState, signedInUser())
    render(<SiteHeader />)

    expect(screen.queryByRole("link", { name: "Sign Up" })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Sign In" })).not.toBeInTheDocument()
  })

  it("opens the desktop avatar dropdown showing the profile's name and email", async () => {
    Object.assign(mockState, signedInUser())
    const user = userEvent.setup()
    render(<SiteHeader />)

    // The avatar fallback renders the profile's initials as the button's
    // accessible name ("Amina Hassan" -> "AH"); both the mobile and desktop
    // avatar triggers match, so open the first one.
    const triggers = screen.getAllByRole("button", { name: "AH" })
    await user.click(triggers[0])

    expect(await screen.findByText("Amina Hassan")).toBeInTheDocument()
    expect(screen.getByText("trader@example.com")).toBeInTheDocument()
  })

  it("calls handleLogout when Log out is clicked in the avatar menu", async () => {
    Object.assign(mockState, signedInUser())
    const user = userEvent.setup()
    render(<SiteHeader />)

    const triggers = screen.getAllByRole("button", { name: "AH" })
    await user.click(triggers[0])

    const logoutItem = await screen.findByText("Log out")
    await user.click(logoutItem)

    expect(mockHandleLogout).toHaveBeenCalledTimes(1)
  })

  it("shows a verified badge on the desktop avatar when isVerified is true", () => {
    Object.assign(mockState, signedInUser())
    mockState.isVerified = true
    const { container } = render(<SiteHeader />)

    expect(container.querySelector("svg.lucide-circle-check")).toBeInTheDocument()
  })

  it("does not show a verified badge when isVerified is false", () => {
    Object.assign(mockState, signedInUser())
    mockState.isVerified = false
    const { container } = render(<SiteHeader />)

    expect(container.querySelector("svg.lucide-circle-check")).not.toBeInTheDocument()
  })
})

describe("SiteHeader mobile menu", () => {
  it("opens the mobile menu when the hamburger button is clicked", async () => {
    const user = userEvent.setup()
    render(<SiteHeader />)

    const hamburger = document.querySelector("button svg.lucide-menu")?.closest("button") as HTMLElement
    expect(hamburger).toBeTruthy()
    await user.click(hamburger)

    expect(mockSetMobileMenuOpen).toHaveBeenCalledWith(true)
  })

  it("lists the primary nav destinations once open", () => {
    mockState.mobileMenuOpen = true
    render(<SiteHeader />)

    // Several of these labels (Shop, Track Order, Favorites) also appear
    // outside the sheet (pill buttons, row 2), so assert at least one match
    // rather than requiring uniqueness across the whole header.
    ;["Home", "Shop", "Track Order", "Market Survey", "Profile", "My Orders", "Favorites"].forEach((label) => {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    })
  })

  it("shows a Sign In / Sign Up CTA in the mobile menu when signed out", () => {
    mockState.mobileMenuOpen = true
    render(<SiteHeader />)

    expect(screen.getByRole("link", { name: "Sign In" })).toHaveAttribute("href", "/auth/login")
  })

  it("shows verified-account info and a logout control in the mobile menu when signed in", async () => {
    Object.assign(mockState, signedInUser())
    mockState.mobileMenuOpen = true
    const user = userEvent.setup()
    render(<SiteHeader />)

    expect(screen.getByText("Verified Account")).toBeInTheDocument()
    const logoutButton = screen.getByRole("button", { name: /log out/i })
    await user.click(logoutButton)

    expect(mockHandleLogout).toHaveBeenCalledTimes(1)
    expect(mockSetMobileMenuOpen).toHaveBeenCalledWith(false)
  })

  it("closes the mobile menu when a nav item is clicked", async () => {
    mockState.mobileMenuOpen = true
    const user = userEvent.setup()
    render(<SiteHeader />)

    await user.click(screen.getByText("Home"))

    expect(mockSetMobileMenuOpen).toHaveBeenCalledWith(false)
  })
})
