import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PaymentMethodAccordion } from "@/components/checkout/payment-method-accordion"
import { BANK_METHODS, CARD_NETWORKS, MOBILE_MONEY_PROVIDERS } from "@/lib/checkout/payment-methods"

/**
 * Tests for components/checkout/payment-method-accordion.tsx.
 *
 * The whole picker is a single RadioGroup spanning three collapsible sections,
 * which is what makes selecting a card clear a previously selected wallet.
 * Collapsing a section does not deselect what is inside it, and these tests pin
 * both halves of that.
 */

const BASE = {
  paymentMethod: "airtel-money",
  onPaymentMethodChange: jest.fn(),
  paymentPhoneNumber: "",
  onPaymentPhoneNumberChange: jest.fn(),
  cardDetails: { number: "", expiry: "", cvv: "" },
  onCardDetailsChange: jest.fn(),
}

function renderPicker(overrides: Partial<typeof BASE> = {}) {
  const props = { ...BASE, ...overrides }
  return { props, ...render(<PaymentMethodAccordion {...props} />) }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("PaymentMethodAccordion sections", () => {
  it("offers all three payment families", () => {
    renderPicker()

    expect(screen.getByText("TOLA Pay")).toBeInTheDocument()
    expect(screen.getByText("Card Payment")).toBeInTheDocument()
    expect(screen.getByText("Bank Transfer")).toBeInTheDocument()
  })

  it("opens on mobile money, the default method's own section", () => {
    renderPicker()

    expect(screen.getByLabelText(/Phone Number/i)).toBeVisible()
  })
})

describe("PaymentMethodAccordion mobile money", () => {
  it("renders every provider from the shared list", () => {
    renderPicker()

    for (const provider of MOBILE_MONEY_PROVIDERS) {
      expect(screen.getByText(provider.name)).toBeInTheDocument()
    }
  })

  it("names the network behind each wallet", () => {
    renderPicker()

    expect(screen.getByText("Airtel")).toBeInTheDocument()
    expect(screen.getByText("Vodacom")).toBeInTheDocument()
  })

  it("marks a provider under maintenance as unavailable", () => {
    renderPicker()

    expect(screen.getByText("Service Down")).toBeInTheDocument()
  })

  it("marks exactly one provider as down", () => {
    renderPicker()

    expect(screen.getAllByText("Service Down")).toHaveLength(1)
  })

  it("selects a wallet when its tile is clicked", async () => {
    const { props } = renderPicker()
    await userEvent.click(screen.getByText("HaloPesa"))

    expect(props.onPaymentMethodChange).toHaveBeenCalledWith("halopesa")
  })

  it("reports the payment phone number as it is typed", async () => {
    const { props } = renderPicker()
    await userEvent.type(screen.getByLabelText(/Phone Number/i), "2557")

    expect(props.onPaymentPhoneNumberChange).toHaveBeenCalled()
  })

  it("shows the phone number it was given", () => {
    renderPicker({ paymentPhoneNumber: "255711223344" })

    expect(screen.getByLabelText(/Phone Number/i)).toHaveValue("255711223344")
  })
})

describe("PaymentMethodAccordion cards", () => {
  async function openCards() {
    await userEvent.click(screen.getByText("Card Payment"))
  }

  it("renders every card network from the shared list", async () => {
    renderPicker()
    await openCards()

    for (const network of CARD_NETWORKS) {
      expect(screen.getByText(network)).toBeInTheDocument()
    }
  })

  it("selects a network when its tile is clicked", async () => {
    const { props } = renderPicker()
    await openCards()
    await userEvent.click(screen.getByText("visa"))

    expect(props.onPaymentMethodChange).toHaveBeenCalledWith("visa")
  })

  it("collects the card number, expiry and CVV", async () => {
    renderPicker()
    await openCards()

    expect(screen.getByLabelText(/Card Number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Expiry/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/CVV/i)).toBeInTheDocument()
  })

  it("reports a changed card number without dropping the other fields", async () => {
    const { props } = renderPicker({ cardDetails: { number: "", expiry: "12/28", cvv: "123" } })
    await openCards()
    await userEvent.type(screen.getByLabelText(/Card Number/i), "4")

    expect(props.onCardDetailsChange).toHaveBeenCalledWith({ number: "4", expiry: "12/28", cvv: "123" })
  })

  it("reports a changed CVV without dropping the card number", async () => {
    const { props } = renderPicker({ cardDetails: { number: "4111", expiry: "12/28", cvv: "" } })
    await openCards()
    await userEvent.type(screen.getByLabelText(/CVV/i), "9")

    expect(props.onCardDetailsChange).toHaveBeenCalledWith({ number: "4111", expiry: "12/28", cvv: "9" })
  })

  it("shows the card details it was given", async () => {
    renderPicker({ cardDetails: { number: "4111111111111111", expiry: "12/28", cvv: "123" } })
    await openCards()

    expect(screen.getByLabelText(/Card Number/i)).toHaveValue("4111111111111111")
    expect(screen.getByLabelText(/Expiry/i)).toHaveValue("12/28")
  })
})

describe("PaymentMethodAccordion bank transfer", () => {
  it("renders every channel with a human-readable label", async () => {
    renderPicker()
    await userEvent.click(screen.getByText("Bank Transfer"))

    for (const method of BANK_METHODS) {
      expect(screen.getByText(method.replace(/-/g, " "))).toBeInTheDocument()
    }
  })

  it("selects a channel when clicked", async () => {
    const { props } = renderPicker()
    await userEvent.click(screen.getByText("Bank Transfer"))
    await userEvent.click(screen.getByText("crdb wakala"))

    expect(props.onPaymentMethodChange).toHaveBeenCalledWith("crdb-wakala")
  })
})

describe("PaymentMethodAccordion selection state", () => {
  /**
   * Radix renders each radio as a button carrying the method id, and the visible
   * label is a sibling, so the id is how a specific radio is addressed. The
   * accordion is `type="single"`, so only the open section's radios are mounted.
   */
  const radioFor = (id: string) => document.getElementById(id)

  it("renders the selected wallet as checked", () => {
    renderPicker({ paymentMethod: "halopesa" })

    expect(radioFor("halopesa")).toHaveAttribute("aria-checked", "true")
    expect(radioFor("airtel-money")).toHaveAttribute("aria-checked", "false")
  })

  it("renders the selected card network as checked", async () => {
    renderPicker({ paymentMethod: "mastercard" })
    await userEvent.click(screen.getByText("Card Payment"))

    expect(radioFor("mastercard")).toHaveAttribute("aria-checked", "true")
    expect(radioFor("visa")).toHaveAttribute("aria-checked", "false")
  })

  it("renders the selected bank channel as checked", async () => {
    renderPicker({ paymentMethod: "crdb-wakala" })
    await userEvent.click(screen.getByText("Bank Transfer"))

    expect(radioFor("crdb-wakala")).toHaveAttribute("aria-checked", "true")
  })

  it("keeps the wallet selected across an accordion round-trip", async () => {
    // Closing a section unmounts its radios, so the selected value has to live
    // on the RadioGroup rather than in the section.
    renderPicker({ paymentMethod: "airtel-money" })

    await userEvent.click(screen.getByText("Card Payment"))
    expect(radioFor("airtel-money")).toBeNull()

    await userEvent.click(screen.getByText("TOLA Pay"))
    expect(radioFor("airtel-money")).toHaveAttribute("aria-checked", "true")
  })

  it("has exactly one method selected among the mounted radios", () => {
    renderPicker({ paymentMethod: "airtel-money" })

    expect(screen.getAllByRole("radio").filter((r) => r.getAttribute("aria-checked") === "true")).toHaveLength(1)
  })

  it("has nothing checked when the selected method belongs to a closed section", async () => {
    renderPicker({ paymentMethod: "visa" })

    expect(screen.getAllByRole("radio").filter((r) => r.getAttribute("aria-checked") === "true")).toHaveLength(0)
  })
})
