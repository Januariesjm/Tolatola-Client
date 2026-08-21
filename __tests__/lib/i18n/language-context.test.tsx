/**
 * Tests for LanguageProvider / useLanguage (lib/i18n/language-context.tsx).
 *
 * Every page in the app renders under this provider, so a regression here is
 * as wide-reaching as a regression gets. What matters: the saved language
 * persists and is restored, an invalid stored value is ignored rather than
 * crashing the app, `t()` falls back to English and then to the raw key
 * instead of rendering nothing, and the RTL direction follows Arabic.
 */

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LanguageProvider, useLanguage } from "@/lib/i18n/language-context"
import { setErrorReporter, type LogRecord } from "@/lib/logger"

/** Exercises the hook: shows the current language, a translated key, and lets a test switch it. */
function Probe({ translationKey }: { translationKey: Parameters<ReturnType<typeof useLanguage>["t"]>[0] }) {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div>
      <span data-testid="lang">{language}</span>
      <span data-testid="translated">{t(translationKey)}</span>
      <button onClick={() => setLanguage("sw")}>switch to sw</button>
      <button onClick={() => setLanguage("ar")}>switch to ar</button>
      <button onClick={() => setLanguage("zz" as never)}>switch to invalid</button>
    </div>
  )
}

const renderProbe = (translationKey: Parameters<ReturnType<typeof useLanguage>["t"]>[0] = "nav.home" as never) =>
  render(
    <LanguageProvider>
      <Probe translationKey={translationKey} />
    </LanguageProvider>,
  )

let reported: LogRecord[]

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute("lang")
  document.documentElement.removeAttribute("dir")
  reported = []
  setErrorReporter((record) => reported.push(record))
  jest.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  setErrorReporter(null)
  jest.restoreAllMocks()
})

describe("useLanguage outside a provider", () => {
  it("throws rather than returning a silently broken context", () => {
    const Bare = () => {
      useLanguage()
      return null
    }
    jest.spyOn(console, "error").mockImplementation(() => {})

    expect(() => render(<Bare />)).toThrow("useLanguage must be used within a LanguageProvider")
  })
})

describe("LanguageProvider", () => {
  it("defaults to English with nothing saved", async () => {
    renderProbe()

    await waitFor(() => expect(screen.getByTestId("lang")).toHaveTextContent("en"))
  })

  it("restores a previously saved language", async () => {
    localStorage.setItem("tola-language", "sw")

    renderProbe()

    await waitFor(() => expect(screen.getByTestId("lang")).toHaveTextContent("sw"))
  })

  it("ignores a saved value that is not a supported language", async () => {
    localStorage.setItem("tola-language", "klingon")

    renderProbe()

    await waitFor(() => expect(screen.getByTestId("lang")).toHaveTextContent("en"))
  })

  it("persists a language switch to localStorage", async () => {
    renderProbe()

    await userEvent.click(screen.getByRole("button", { name: "switch to sw" }))

    await waitFor(() => expect(localStorage.getItem("tola-language")).toBe("sw"))
  })

  it("ignores setLanguage called with an unsupported code", async () => {
    renderProbe()

    await userEvent.click(screen.getByRole("button", { name: "switch to invalid" }))

    // Neither the visible state nor storage changes for a code with no translations.
    expect(screen.getByTestId("lang")).toHaveTextContent("en")
  })

  it("sets the document direction to rtl for Arabic and back to ltr otherwise", async () => {
    renderProbe()

    await userEvent.click(screen.getByRole("button", { name: "switch to ar" }))
    await waitFor(() => expect(document.documentElement.dir).toBe("rtl"))

    await userEvent.click(screen.getByRole("button", { name: "switch to sw" }))
    await waitFor(() => expect(document.documentElement.dir).toBe("ltr"))
  })

  it("sets the document lang attribute to the active language", async () => {
    renderProbe()

    await userEvent.click(screen.getByRole("button", { name: "switch to sw" }))

    await waitFor(() => expect(document.documentElement.lang).toBe("sw"))
  })

  it("falls back to the raw key when no language has a translation for it", async () => {
    renderProbe("not-a-real-translation-key" as never)

    expect(screen.getByTestId("translated")).toHaveTextContent("not-a-real-translation-key")
  })

  it("logs rather than crashing when localStorage.getItem throws", async () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage disabled")
    })

    expect(() => renderProbe()).not.toThrow()
    await waitFor(() => expect(reported.map((r) => r.message)).toContain("failed to load language"))
  })

  it("logs rather than crashing when localStorage.setItem throws", async () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage full")
    })

    renderProbe()

    await waitFor(() => expect(reported.map((r) => r.message)).toContain("failed to persist language"))
  })
})
