/**
 * Tests for lib/checkout/payment-methods.ts.
 *
 * The point of this module is that the rendered method lists and the validator's
 * method groups cannot drift apart. Most of these tests assert exactly that, so
 * adding a provider to one place without the other fails here rather than
 * shipping a payment option that is never asked for a phone number.
 */

import { BANK_METHODS, CARD_NETWORKS, MOBILE_MONEY_PROVIDERS, formatBankMethodLabel } from "@/lib/checkout/payment-methods"
import {
  CARD_METHODS,
  MOBILE_MONEY_METHODS,
  METHODS_UNDER_MAINTENANCE,
  isCard,
  isMobileMoney,
  isUnderMaintenance,
} from "@/lib/checkout/validate-checkout-form"

describe("MOBILE_MONEY_PROVIDERS", () => {
  it("offers every mobile money method the validator knows", () => {
    expect(MOBILE_MONEY_PROVIDERS.map((p) => p.id).sort()).toEqual([...MOBILE_MONEY_METHODS].sort())
  })

  it("every rendered provider is recognised as mobile money", () => {
    for (const provider of MOBILE_MONEY_PROVIDERS) {
      expect(isMobileMoney(provider.id)).toBe(true)
    }
  })

  it("flags exactly the providers under maintenance", () => {
    const flagged = MOBILE_MONEY_PROVIDERS.filter((p) => p.maintenance).map((p) => p.id)

    expect(flagged.sort()).toEqual([...METHODS_UNDER_MAINTENANCE].sort())
  })

  it("marks M-Pesa as under maintenance", () => {
    const mpesa = MOBILE_MONEY_PROVIDERS.find((p) => p.id === "m-pesa")

    expect(mpesa?.maintenance).toBe(true)
    expect(isUnderMaintenance("m-pesa")).toBe(true)
  })

  it("leaves selectable providers unflagged", () => {
    const airtel = MOBILE_MONEY_PROVIDERS.find((p) => p.id === "airtel-money")

    expect(airtel?.maintenance).toBeUndefined()
  })

  it("gives every provider a display name and network", () => {
    for (const provider of MOBILE_MONEY_PROVIDERS) {
      expect(provider.name).toBeTruthy()
      expect(provider.provider).toBeTruthy()
    }
  })

  it("has no duplicate ids", () => {
    const ids = MOBILE_MONEY_PROVIDERS.map((p) => p.id)

    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe("CARD_NETWORKS", () => {
  it("offers every card method the validator knows", () => {
    expect([...CARD_NETWORKS].sort()).toEqual([...CARD_METHODS].sort())
  })

  it("every rendered network is recognised as a card", () => {
    for (const network of CARD_NETWORKS) {
      expect(isCard(network)).toBe(true)
    }
  })
})

describe("BANK_METHODS", () => {
  it("is not treated as mobile money or card, so no extra credentials are demanded", () => {
    for (const method of BANK_METHODS) {
      expect(isMobileMoney(method)).toBe(false)
      expect(isCard(method)).toBe(false)
    }
  })

  it("has no duplicates", () => {
    expect(new Set(BANK_METHODS).size).toBe(BANK_METHODS.length)
  })
})

describe("formatBankMethodLabel", () => {
  it("replaces every hyphen, not just the first", () => {
    expect(formatBankMethodLabel("crdb-internet-banking")).toBe("crdb internet banking")
  })

  it("leaves a label with no hyphens alone", () => {
    expect(formatBankMethodLabel("crdb")).toBe("crdb")
  })

  it("produces a label for every bank method", () => {
    for (const method of BANK_METHODS) {
      expect(formatBankMethodLabel(method)).not.toContain("-")
    }
  })
})
