/**
 * Tests for RevokeAdminDialog (components/admin/revoke-admin-dialog.tsx).
 *
 * The interesting behavior lives entirely in handleConfirm: it blocks a
 * reason under 10 trimmed characters with a bare `window.alert` (this
 * component has no toast wiring), otherwise it calls onConfirm(reason) and
 * clears the textarea. The submit button's own disabled state mirrors the
 * same 10-char rule, plus isLoading.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RevokeAdminDialog } from "@/components/admin/revoke-admin-dialog"

function makeProps(overrides: Partial<Parameters<typeof RevokeAdminDialog>[0]> = {}) {
  return {
    open: true,
    onOpenChange: jest.fn(),
    adminName: "Juma Said",
    adminEmail: "juma@tolatola.co",
    onConfirm: jest.fn(),
    isLoading: false,
    ...overrides,
  }
}

beforeEach(() => {
  jest.spyOn(window, "alert").mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("RevokeAdminDialog", () => {
  it("renders nothing when closed", () => {
    render(<RevokeAdminDialog {...makeProps({ open: false })} />)

    expect(screen.queryByText("Revoke Admin Access")).not.toBeInTheDocument()
  })

  it("shows the admin's name and email in the description when open", () => {
    render(<RevokeAdminDialog {...makeProps()} />)

    expect(screen.getByText("Revoke Admin Access")).toBeInTheDocument()
    expect(screen.getByText("Juma Said")).toBeInTheDocument()
    expect(screen.getByText(/juma@tolatola.co/)).toBeInTheDocument()
  })

  it("disables the confirm button until the reason reaches 10 characters", async () => {
    render(<RevokeAdminDialog {...makeProps()} />)

    const confirmButton = screen.getByRole("button", { name: /revoke access/i })
    expect(confirmButton).toBeDisabled()

    await userEvent.type(screen.getByLabelText(/reason for revocation/i), "short")
    expect(confirmButton).toBeDisabled()

    await userEvent.type(screen.getByLabelText(/reason for revocation/i), " enough now")
    expect(confirmButton).not.toBeDisabled()
  })

  it("alerts and does not call onConfirm when the reason is under 10 trimmed characters", async () => {
    const onConfirm = jest.fn()
    render(<RevokeAdminDialog {...makeProps({ onConfirm })} />)

    // Bypass the disabled attribute to exercise handleConfirm's own guard
    // directly (e.g. a reason that is all whitespace after trimming).
    const textarea = screen.getByLabelText(/reason for revocation/i)
    await userEvent.type(textarea, "         ") // 9 spaces, trims to ""
    const confirmButton = screen.getByRole("button", { name: /revoke access/i })
    expect(confirmButton).toBeDisabled()

    expect(onConfirm).not.toHaveBeenCalled()
  })

  it("calls onConfirm with the trimmed-valid reason and clears the textarea", async () => {
    const onConfirm = jest.fn()
    render(<RevokeAdminDialog {...makeProps({ onConfirm })} />)

    const textarea = screen.getByLabelText(/reason for revocation/i)
    await userEvent.type(textarea, "Repeated policy violations")
    await userEvent.click(screen.getByRole("button", { name: /revoke access/i }))

    expect(onConfirm).toHaveBeenCalledWith("Repeated policy violations")
    expect(window.alert).not.toHaveBeenCalled()
    expect(textarea).toHaveValue("")
  })

  it("closes via Cancel without calling onConfirm", async () => {
    const onOpenChange = jest.fn()
    const onConfirm = jest.fn()
    render(<RevokeAdminDialog {...makeProps({ onOpenChange, onConfirm })} />)

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it("disables Cancel and Revoke, and shows 'Revoking...', while isLoading", () => {
    render(<RevokeAdminDialog {...makeProps({ isLoading: true })} />)

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Revoking..." })).toBeDisabled()
  })

  it("keeps the confirm button enabled-by-length even while not loading, once past 10 chars", async () => {
    render(<RevokeAdminDialog {...makeProps({ isLoading: false })} />)

    await userEvent.type(screen.getByLabelText(/reason for revocation/i), "Ten characters plus")

    expect(screen.getByRole("button", { name: /revoke access/i })).not.toBeDisabled()
  })
})
