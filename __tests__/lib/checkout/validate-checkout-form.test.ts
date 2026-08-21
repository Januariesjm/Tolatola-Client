/**
 * Tests for checkout form validation (lib/checkout/validate-checkout-form.ts).
 *
 * Extracted from 88 lines of sequential guards at the top of
 * checkout-content.tsx's handleSubmit. Rule ORDER matters here: it decides
 * which single message a buyer sees when several things are wrong at once, so
 * it is asserted explicitly rather than left implicit in a component.
 */

import {
  CARD_METHODS,
  MOBILE_MONEY_METHODS,
  SELECTABLE_MOBILE_MONEY_METHODS,
  isCard,
  isMobileMoney,
  isUnderMaintenance,
  validateCheckoutForm,
  type CheckoutFormInput,
} from "@/lib/checkout/validate-checkout-form"

/** A form that passes every rule; each test breaks exactly one thing. */
const valid = (over: Partial<CheckoutFormInput> = {}): CheckoutFormInput => ({
  paymentMethod: "airtel-money",
  fullName: "Asha Mwinyi",
  phone: "255700000001",
  guestEmail: "",
  isAuthenticated: true,
  addressData: { region: "Dodoma", district: "Central", ward: "Kikuyu", street: "Samora Ave" },
  shopDeliveryCount: 1,
  selectedTransportId: "m-1",
  paymentPhoneNumber: "255700000001",
  cardDetails: { number: "", expiry: "", cvv: "" },
  ...over,
})

describe("payment method helpers", () => {
  it("classifies mobile money and cards", () => {
    expect(isMobileMoney("airtel-money")).toBe(true)
    expect(isMobileMoney("visa")).toBe(false)
    expect(isCard("visa")).toBe(true)
    expect(isCard("airtel-money")).toBe(false)
  })

  it("treats cash on delivery as neither", () => {
    expect(isMobileMoney("cash-on-delivery")).toBe(false)
    expect(isCard("cash-on-delivery")).toBe(false)
  })

  it("flags only m-pesa as under maintenance", () => {
    expect(isUnderMaintenance("m-pesa")).toBe(true)
    expect(isUnderMaintenance("airtel-money")).toBe(false)
  })

  it("excludes the maintenance provider from the selectable list", () => {
    expect(MOBILE_MONEY_METHODS).toContain("m-pesa")
    expect(SELECTABLE_MOBILE_MONEY_METHODS).not.toContain("m-pesa")
    expect(SELECTABLE_MOBILE_MONEY_METHODS).toContain("airtel-money")
  })

  it("keeps the card list to the three supported networks", () => {
    expect([...CARD_METHODS].sort()).toEqual(["mastercard", "unionpay", "visa"])
  })
})

describe("validateCheckoutForm", () => {
  it("accepts a complete form", () => {
    expect(validateCheckoutForm(valid())).toBeNull()
  })

  it("rejects a payment method under maintenance", () => {
    expect(validateCheckoutForm(valid({ paymentMethod: "m-pesa" }))?.title).toBe("Maintenance")
  })

  it.each([
    ["a missing name", { fullName: "" }, "Name Required"],
    ["a whitespace-only name", { fullName: "   " }, "Name Required"],
    ["a missing phone", { phone: "" }, "Phone Required"],
    ["a whitespace-only phone", { phone: "  " }, "Phone Required"],
    ["no transport method", { selectedTransportId: "" }, "Transport Method Required"],
    ["no delivery quotes", { shopDeliveryCount: 0 }, "Logistics Required"],
  ])("rejects %s", (_label, patch, title) => {
    expect(validateCheckoutForm(valid(patch))?.title).toBe(title)
  })

  describe("guest email", () => {
    it("requires an email from a guest", () => {
      expect(validateCheckoutForm(valid({ isAuthenticated: false, guestEmail: "" }))?.title).toBe("Email Required")
    })

    it("requires it to look like an email", () => {
      expect(validateCheckoutForm(valid({ isAuthenticated: false, guestEmail: "nope" }))?.title).toBe("Email Required")
    })

    it("accepts a guest with an email", () => {
      expect(validateCheckoutForm(valid({ isAuthenticated: false, guestEmail: "a@b.com" }))).toBeNull()
    })

    it("ignores a blank email when signed in", () => {
      expect(validateCheckoutForm(valid({ isAuthenticated: true, guestEmail: "" }))).toBeNull()
    })
  })

  describe("address", () => {
    it.each(["region", "district", "ward", "street"])("requires %s", (field) => {
      const addressData = { ...valid().addressData, [field]: "" }

      expect(validateCheckoutForm(valid({ addressData }))?.title).toBe("Address Required")
    })

    it("rejects an entirely empty address", () => {
      expect(validateCheckoutForm(valid({ addressData: {} }))?.title).toBe("Address Required")
    })
  })

  describe("payment details", () => {
    it.each(SELECTABLE_MOBILE_MONEY_METHODS)("requires a phone number for %s", (method) => {
      expect(validateCheckoutForm(valid({ paymentMethod: method, paymentPhoneNumber: "" }))?.title).toBe("Phone Number Required")
    })

    it.each([...CARD_METHODS])("requires full card details for %s", (method) => {
      const base = { paymentMethod: method, cardDetails: { number: "4111", expiry: "12/28", cvv: "123" } }

      expect(validateCheckoutForm(valid(base))).toBeNull()

      for (const missing of ["number", "expiry", "cvv"] as const) {
        const cardDetails = { ...base.cardDetails, [missing]: "" }
        expect(validateCheckoutForm(valid({ ...base, cardDetails }))?.title).toBe("Card Details Required")
      }
    })

    it("needs neither a phone nor card details for cash on delivery", () => {
      const result = validateCheckoutForm(
        valid({ paymentMethod: "cash-on-delivery", paymentPhoneNumber: "", cardDetails: { number: "", expiry: "", cvv: "" } }),
      )

      expect(result).toBeNull()
    })
  })

  describe("rule order", () => {
    it("reports maintenance before anything else", () => {
      const result = validateCheckoutForm(valid({ paymentMethod: "m-pesa", fullName: "", phone: "", selectedTransportId: "" }))

      expect(result?.title).toBe("Maintenance")
    })

    it("reports the name before the phone", () => {
      expect(validateCheckoutForm(valid({ fullName: "", phone: "" }))?.title).toBe("Name Required")
    })

    it("reports identity and address problems before payment ones", () => {
      const result = validateCheckoutForm(valid({ fullName: "", paymentMethod: "visa", cardDetails: { number: "", expiry: "", cvv: "" } }))

      expect(result?.title).toBe("Name Required")
    })

    it("reports the address before the delivery quote", () => {
      expect(validateCheckoutForm(valid({ addressData: {}, shopDeliveryCount: 0 }))?.title).toBe("Address Required")
    })

    it("reports the delivery quote before the transport method", () => {
      expect(validateCheckoutForm(valid({ shopDeliveryCount: 0, selectedTransportId: "" }))?.title).toBe("Logistics Required")
    })
  })

  it("always pairs a title with a description", () => {
    const failures = [
      valid({ paymentMethod: "m-pesa" }),
      valid({ fullName: "" }),
      valid({ phone: "" }),
      valid({ isAuthenticated: false, guestEmail: "" }),
      valid({ addressData: {} }),
      valid({ shopDeliveryCount: 0 }),
      valid({ selectedTransportId: "" }),
      valid({ paymentPhoneNumber: "" }),
      valid({ paymentMethod: "visa", cardDetails: { number: "", expiry: "", cvv: "" } }),
    ]

    for (const input of failures) {
      const result = validateCheckoutForm(input)
      expect(result).not.toBeNull()
      expect(result?.title.length).toBeGreaterThan(0)
      expect(result?.description.length).toBeGreaterThan(0)
    }
  })
})
