/**
 * Tests for RatesSubTab (components/admin/agents/rates-subtab.tsx).
 *
 * Presentational. Worth pinning: an unrecognised registration type still
 * renders (via the fallback config) rather than crashing, each rate input
 * reports through onRateAmountChange with its own registration_type, and
 * submit reflects the isUpdatingRates flag.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RatesSubTab } from "@/components/admin/agents/rates-subtab"
import type { AgentCommissionRate } from "@/lib/admin/agent-types"

const rates: AgentCommissionRate[] = [
  { registration_type: "vendor", amount: 5000 } as AgentCommissionRate,
  { registration_type: "customer", amount: 1000 } as AgentCommissionRate,
]

const props = {
  rates,
  isUpdatingRates: false,
  onRateAmountChange: jest.fn(),
  onSubmit: jest.fn((e: React.FormEvent) => e.preventDefault()),
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("RatesSubTab", () => {
  it("shows an empty state with no rates configured", () => {
    render(<RatesSubTab {...props} rates={[]} />)

    expect(screen.getByText("No commission rates configured yet.")).toBeInTheDocument()
  })

  it("shows the known label for each registration type", () => {
    render(<RatesSubTab {...props} />)

    expect(screen.getByText("Vendor Registration")).toBeInTheDocument()
    expect(screen.getByText("Customer Registration")).toBeInTheDocument()
  })

  it("falls back to a generic label for an unrecognised registration type instead of crashing", () => {
    render(<RatesSubTab {...props} rates={[{ registration_type: "affiliate", amount: 500 } as AgentCommissionRate]} />)

    expect(screen.getByText("affiliate")).toBeInTheDocument()
  })

  it("reports an amount change with the registration type it belongs to", async () => {
    render(<RatesSubTab {...props} />)

    await userEvent.type(screen.getAllByRole("spinbutton")[0], "1")

    expect(props.onRateAmountChange).toHaveBeenCalledWith("vendor", expect.any(String))
  })

  it("calls onSubmit when the form is submitted", async () => {
    render(<RatesSubTab {...props} />)

    await userEvent.click(screen.getByRole("button", { name: /save commission rates/i }))

    expect(props.onSubmit).toHaveBeenCalledTimes(1)
  })

  it("disables submit and shows progress while updating", () => {
    render(<RatesSubTab {...props} isUpdatingRates />)

    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled()
  })
})
