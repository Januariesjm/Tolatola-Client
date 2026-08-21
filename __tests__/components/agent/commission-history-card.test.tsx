/**
 * Tests for CommissionHistoryCard (components/agent/commission-history-card.tsx).
 *
 * Presentational: the tab switch between commissions and withdrawals, and each
 * table's empty state. The data itself is already date-filtered by the caller.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CommissionHistoryCard } from "@/components/agent/commission-history-card"
import type { AgentCommissionRecord, AgentWithdrawal } from "@/lib/types/agent"

const commission = (over: Partial<AgentCommissionRecord> = {}): AgentCommissionRecord =>
  ({
    id: "c-1",
    amount: 30000,
    status: "paid",
    commission_type: "signup",
    created_at: "2026-02-01T00:00:00Z",
    ...over,
  }) as AgentCommissionRecord

const withdrawal = (over: Partial<AgentWithdrawal> = {}): AgentWithdrawal =>
  ({
    id: "w-1",
    amount: 10000,
    payout_amount: 9000,
    service_fee: 1000,
    payment_method: "m-pesa",
    payment_details: { phoneNumber: "255700000001" },
    status: "paid",
    created_at: "2026-02-03T00:00:00Z",
    ...over,
  }) as AgentWithdrawal

const props = {
  activeHistoryTab: "earnings" as const,
  onHistoryTabChange: jest.fn(),
  commissions: [] as AgentCommissionRecord[],
  withdrawals: [] as AgentWithdrawal[],
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("CommissionHistoryCard", () => {
  describe("earnings tab", () => {
    it("shows an empty state with no commissions", () => {
      render(<CommissionHistoryCard {...props} />)

      expect(screen.getByText("Hujapata kamisheni yoyote bado.")).toBeInTheDocument()
    })

    it("lists a commission with its amount and status", () => {
      render(<CommissionHistoryCard {...props} commissions={[commission()]} />)

      expect(screen.getByText("+TZS 30,000")).toBeInTheDocument()
    })

    it("translates the pending and approved statuses to Swahili", () => {
      render(
        <CommissionHistoryCard
          {...props}
          commissions={[commission({ status: "pending" }), commission({ id: "c-2", status: "approved" })]}
        />,
      )

      expect(screen.getByText("Inasubiri")).toBeInTheDocument()
      expect(screen.getByText("Imeidhinishwa")).toBeInTheDocument()
    })

    it("shows the referral source when the commission came from a registration", () => {
      render(
        <CommissionHistoryCard
          {...props}
          commissions={[commission({ agent_registrations: { full_name: "Baraka Juma", registration_type: "vendor" } } as never)]}
        />,
      )

      expect(screen.getByText("Usajili: Baraka Juma")).toBeInTheDocument()
    })

    it("does not render the withdrawals table while on the earnings tab", () => {
      render(<CommissionHistoryCard {...props} withdrawals={[withdrawal()]} />)

      expect(screen.queryByText("Njia ya Malipo")).not.toBeInTheDocument()
    })
  })

  describe("payouts tab", () => {
    const payoutProps = { ...props, activeHistoryTab: "payouts" as const }

    it("shows an empty state with no withdrawals", () => {
      render(<CommissionHistoryCard {...payoutProps} />)

      expect(screen.getByText("Hujafanya muamala wowote wa kutoa salio bado.")).toBeInTheDocument()
    })

    it("lists a withdrawal with its fee and net payout", () => {
      render(<CommissionHistoryCard {...payoutProps} withdrawals={[withdrawal()]} />)

      expect(screen.getByText("TZS 10,000")).toBeInTheDocument()
      expect(screen.getByText("-TZS 1,000")).toBeInTheDocument()
      expect(screen.getByText("TZS 9,000")).toBeInTheDocument()
    })

    it("falls back to 'M-Money' when the withdrawal has no phone number on record", () => {
      render(<CommissionHistoryCard {...payoutProps} withdrawals={[withdrawal({ payment_details: undefined })]} />)

      expect(screen.getByText("M-Money")).toBeInTheDocument()
    })

    it("translates the processing status to Swahili", () => {
      render(<CommissionHistoryCard {...payoutProps} withdrawals={[withdrawal({ status: "processing" })]} />)

      expect(screen.getByText("Inatumwa")).toBeInTheDocument()
    })
  })

  it("switches tabs when the buyer clicks the other tab button", async () => {
    const onHistoryTabChange = jest.fn()
    render(<CommissionHistoryCard {...props} onHistoryTabChange={onHistoryTabChange} />)

    await userEvent.click(screen.getByRole("button", { name: "Fedha Zilizotolewa (Payouts)" }))

    expect(onHistoryTabChange).toHaveBeenCalledWith("payouts")
  })
})
