import React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LanguageSwitcher } from "@/components/layout/language-switcher"

/**
 * Tests for components/layout/language-switcher.tsx.
 *
 * The component is a thin view over useLanguage(): it lists four fixed
 * languages, shows the active one's flag on the trigger and a checkmark in
 * the menu, and forwards a click to setLanguage(). Those are the only
 * behaviors worth asserting -- everything else is Radix's DropdownMenu.
 *
 * jsdom has no Pointer Capture API, which Radix's dropdown calls
 * unconditionally on pointer down, so it's polyfilled below (same fix used
 * in __tests__/setup/product-form-fixtures.ts for Radix's Select).
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

const mockSetLanguage = jest.fn()
let mockLanguage: "en" | "sw" | "ar" | "zh" = "en"

jest.mock("@/lib/i18n/language-context", () => ({
  useLanguage: () => ({
    language: mockLanguage,
    setLanguage: mockSetLanguage,
    t: (key: string) => key,
  }),
}))

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    mockLanguage = "en"
    mockSetLanguage.mockClear()
  })

  it("shows the active language's flag on the trigger", () => {
    render(<LanguageSwitcher />)
    expect(screen.getByRole("button")).toHaveTextContent("EN")
  })

  it("reflects a non-default active language on the trigger", () => {
    mockLanguage = "sw"
    render(<LanguageSwitcher />)
    expect(screen.getByRole("button")).toHaveTextContent("SW")
  })

  it("lists all four languages when opened", async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    await user.click(screen.getByRole("button"))

    expect(await screen.findByText("English")).toBeInTheDocument()
    expect(screen.getByText("Kiswahili")).toBeInTheDocument()
    expect(screen.getByText("العربية")).toBeInTheDocument()
    expect(screen.getByText("中文")).toBeInTheDocument()
  })

  it("marks the active language's menu item with a checkmark", async () => {
    mockLanguage = "sw"
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    await user.click(screen.getByRole("button"))

    const swahiliItem = (await screen.findByText("Kiswahili")).closest('[role="menuitem"]') as HTMLElement
    const englishItem = screen.getByText("English").closest('[role="menuitem"]') as HTMLElement

    expect(within(swahiliItem).getByText("Kiswahili").closest("svg, [role='menuitem']")).toBeTruthy()
    // The active item renders a lucide Check icon; the inactive one does not.
    expect(swahiliItem.querySelector("svg.lucide-check")).toBeInTheDocument()
    expect(englishItem.querySelector("svg.lucide-check")).not.toBeInTheDocument()
  })

  it("calls setLanguage with the selected language code when a menu item is clicked", async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    await user.click(screen.getByRole("button"))
    const arabicItem = await screen.findByText("العربية")
    await user.click(arabicItem)

    expect(mockSetLanguage).toHaveBeenCalledTimes(1)
    expect(mockSetLanguage).toHaveBeenCalledWith("ar")
  })

  it("calls setLanguage with the code for every language option", async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    await user.click(screen.getByRole("button"))
    await user.click(await screen.findByText("中文"))

    expect(mockSetLanguage).toHaveBeenCalledWith("zh")
  })
})
