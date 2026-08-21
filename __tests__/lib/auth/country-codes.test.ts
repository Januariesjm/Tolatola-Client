/**
 * Tests for phone-number splitting (lib/auth/country-codes.ts).
 *
 * This table used to sit inline in app/auth/sign-up/page.tsx as 122 string
 * literals. The property that matters is the ordering: codes are tried
 * longest-first, so a number is never attributed to a shorter code that happens
 * to be a prefix of the right one.
 */

import { DIALLING_CODES, joinPhoneNumber, splitPhoneNumber } from "@/lib/auth/country-codes"

describe("DIALLING_CODES", () => {
  it("lists codes longest first, which the prefix search depends on", () => {
    const lengths = DIALLING_CODES.map((c) => c.length)

    for (let i = 0; i < lengths.length - 1; i++) {
      expect(lengths[i]).toBeGreaterThanOrEqual(lengths[i + 1])
    }
  })

  it("contains no duplicates", () => {
    expect(new Set(DIALLING_CODES).size).toBe(DIALLING_CODES.length)
  })

  it("has every entry in +digits form", () => {
    for (const code of DIALLING_CODES) {
      expect(code).toMatch(/^\+\d{1,4}$/)
    }
  })

  it("includes the home market and the ambiguous NANP cases", () => {
    expect(DIALLING_CODES).toContain("+255")
    expect(DIALLING_CODES).toContain("+1")
    expect(DIALLING_CODES).toContain("+1876")
  })
})

describe("splitPhoneNumber", () => {
  it("splits a Tanzanian number", () => {
    expect(splitPhoneNumber("+255712345678")).toEqual({
      countryCode: "+255",
      localNumber: "712345678",
    })
  })

  it("prefers the longer code when one is a prefix of another", () => {
    // "+1876" must win over "+1"; getting this wrong silently mangles the
    // local part of every Jamaican number.
    expect(splitPhoneNumber("+18765551234")).toEqual({
      countryCode: "+1876",
      localNumber: "5551234",
    })
  })

  it("still resolves the shorter code when the longer one does not match", () => {
    expect(splitPhoneNumber("+12125551234")).toEqual({
      countryCode: "+1",
      localNumber: "2125551234",
    })
  })

  it.each([
    ["+254712345678", "+254", "712345678"],
    ["+256712345678", "+256", "712345678"],
    ["+447911123456", "+44", "7911123456"],
  ])("splits %s", (input, code, local) => {
    expect(splitPhoneNumber(input)).toEqual({ countryCode: code, localNumber: local })
  })

  it("tolerates surrounding whitespace", () => {
    expect(splitPhoneNumber("  +255712345678  ")?.countryCode).toBe("+255")
  })

  it.each([[null], [undefined], [""]])("returns null for %p", (input) => {
    expect(splitPhoneNumber(input)).toBeNull()
  })

  it("returns null for a domestic number with no country code", () => {
    // The caller keeps the raw value rather than guessing a country.
    expect(splitPhoneNumber("0712345678")).toBeNull()
  })

  it("returns null when no known code matches", () => {
    expect(splitPhoneNumber("+9995551234")).toBeNull()
  })

  it("returns an empty local part for a bare country code", () => {
    expect(splitPhoneNumber("+255")).toEqual({ countryCode: "+255", localNumber: "" })
  })
})

describe("joinPhoneNumber", () => {
  it("joins a code and a local number", () => {
    expect(joinPhoneNumber("+255", "712345678")).toBe("+255712345678")
  })

  it("strips the domestic trunk zero", () => {
    // People type "0712..."; concatenating naively gives "+2550712...".
    expect(joinPhoneNumber("+255", "0712345678")).toBe("+255712345678")
  })

  it("strips several leading zeros", () => {
    expect(joinPhoneNumber("+255", "00712345678")).toBe("+255712345678")
  })

  it("returns an empty string when there is no local number", () => {
    expect(joinPhoneNumber("+255", "")).toBe("")
  })

  it("round-trips with splitPhoneNumber", () => {
    const joined = joinPhoneNumber("+255", "0712345678")

    expect(splitPhoneNumber(joined)).toEqual({ countryCode: "+255", localNumber: "712345678" })
  })
})
