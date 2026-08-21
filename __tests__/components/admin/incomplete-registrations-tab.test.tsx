/**
 * Tests for IncompleteRegistrationsTab (components/admin/incomplete-registrations-tab.tsx).
 *
 * The `registrations` prop was typed `any[]`; it now takes
 * `IncompleteRegistration[]` (lib/types/admin.ts). What's worth pinning: the
 * narrower type still renders the summary counts and each record, and the
 * search/status filters still narrow the list the same way they always did.
 */

import React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { IncompleteRegistrationsTab } from "@/components/admin/incomplete-registrations-tab"
import type { IncompleteRegistration } from "@/lib/types/admin"

function registration(overrides: Partial<IncompleteRegistration> = {}): IncompleteRegistration {
  return {
    id: "r-1",
    full_name: "Asha Mwinyi",
    email: "asha@example.com",
    phone: "+255700000000",
    user_type: "vendor",
    recovery_status: "pending",
    last_step: "business_info",
    last_activity_at: "2026-02-01T10:00:00.000Z",
    expires_at: "2026-03-01T10:00:00.000Z",
    created_at: "2026-01-20T10:00:00.000Z",
    ...overrides,
  }
}

describe("IncompleteRegistrationsTab", () => {
  it("shows the empty state with nothing to follow up on", () => {
    render(<IncompleteRegistrationsTab registrations={[]} />)

    expect(screen.getByText("No incomplete registrations")).toBeInTheDocument()
  })

  it("renders a record with its status and type", () => {
    render(<IncompleteRegistrationsTab registrations={[registration()]} />)

    const row = screen.getByText("Asha Mwinyi").closest("div.shadow-sm") as HTMLElement
    expect(within(row).getByText("Pending")).toBeInTheDocument()
    expect(within(row).getByText("vendor")).toBeInTheDocument()
  })

  it("counts records by recovery status in the summary cards", () => {
    render(
      <IncompleteRegistrationsTab
        registrations={[registration({ id: "r-1" }), registration({ id: "r-2", recovery_status: "contacted" })]}
      />,
    )

    const pendingCard = screen.getByText("Pending", { selector: ".text-xs" }).closest("div.shadow-sm") as HTMLElement
    expect(within(pendingCard).getByText("1")).toBeInTheDocument()
  })

  it("filters by the typed search query", async () => {
    render(
      <IncompleteRegistrationsTab
        registrations={[registration({ id: "r-1", full_name: "Asha Mwinyi" }), registration({ id: "r-2", full_name: "Baraka John" })]}
      />,
    )

    await userEvent.type(screen.getByPlaceholderText(/search name, email, phone/i), "Baraka")

    expect(screen.getByText("Baraka John")).toBeInTheDocument()
    expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument()
  })

  it("falls back to the raw step value when it has no known label", () => {
    render(<IncompleteRegistrationsTab registrations={[registration({ last_step: "some_new_step" })]} />)

    expect(screen.getByText(/Step: some_new_step/)).toBeInTheDocument()
  })
})
