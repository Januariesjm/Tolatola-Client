/**
 * Tests for AgentDialogs (components/admin/agents/agent-dialogs.tsx).
 *
 * Purely presentational: all state and handlers are passed in as props from
 * useAgentManagement. What matters here is that both dialogs open/close on
 * the right prop, each field's onChange threads through the functional
 * setCreateForm updater with the right key, the delete dialog only renders
 * its target details when one is set, the per-row loading key gates the
 * disabled/spinner state precisely (not just "any" loading), and Cancel /
 * confirm handlers fire with the right arguments.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AgentDialogs } from "@/components/admin/agents/agent-dialogs"

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  role_name: "Sales Agent",
  region: "",
  district: "",
  area: "",
}

function makeProps(overrides: Partial<Parameters<typeof AgentDialogs>[0]> = {}) {
  return {
    isCreateOpen: true,
    setIsCreateOpen: jest.fn(),
    createForm: emptyForm,
    setCreateForm: jest.fn(),
    isCreating: false,
    handleCreateAgent: jest.fn(),
    deleteTarget: null as { id: string; name: string; code: string } | null,
    setDeleteTarget: jest.fn(),
    isActionLoading: null as string | null,
    handleDeleteAgent: jest.fn(),
    ...overrides,
  }
}

describe("AgentDialogs", () => {
  describe("Create Agent dialog", () => {
    it("is open when isCreateOpen is true", () => {
      render(<AgentDialogs {...makeProps()} />)

      expect(screen.getByText("Create New Agent")).toBeInTheDocument()
    })

    it("is closed when isCreateOpen is false", () => {
      render(<AgentDialogs {...makeProps({ isCreateOpen: false })} />)

      expect(screen.queryByText("Create New Agent")).not.toBeInTheDocument()
    })

    it("updates full_name through the functional setCreateForm updater", async () => {
      const setCreateForm = jest.fn((updater) => updater(emptyForm))
      // The updater must run *inside* the mock, synchronously with the
      // change event: React resets a controlled input's real DOM value
      // right after the handler returns (since no re-render supplies a new
      // `value` prop here), so reading e.target.value from a stored closure
      // afterwards would see the reset "" rather than what was typed.
      render(<AgentDialogs {...makeProps({ setCreateForm })} />)

      await userEvent.type(screen.getByPlaceholderText(/John Mwakasege/), "A")

      expect(setCreateForm).toHaveBeenCalled()
      expect(setCreateForm).toHaveReturnedWith({ ...emptyForm, full_name: "A" })
    })

    it("updates email with the email key", async () => {
      const setCreateForm = jest.fn((updater) => updater(emptyForm))
      render(<AgentDialogs {...makeProps({ setCreateForm })} />)

      await userEvent.type(screen.getByPlaceholderText(/john@tolatola.co/), "x")

      expect(setCreateForm).toHaveReturnedWith({ ...emptyForm, email: "x" })
    })

    it("updates phone with the phone key", async () => {
      const setCreateForm = jest.fn((updater) => updater(emptyForm))
      render(<AgentDialogs {...makeProps({ setCreateForm })} />)

      await userEvent.type(screen.getByPlaceholderText(/\+255712345678/), "1")

      expect(setCreateForm).toHaveReturnedWith({ ...emptyForm, phone: "1" })
    })

    it("updates region, district and area with their own keys", async () => {
      const setCreateForm = jest.fn((updater) => updater(emptyForm))
      render(<AgentDialogs {...makeProps({ setCreateForm })} />)

      await userEvent.type(screen.getByPlaceholderText(/Dar es Salaam/), "d")
      await userEvent.type(screen.getByPlaceholderText(/Ilala/), "i")
      await userEvent.type(screen.getByPlaceholderText(/Kariakoo/), "k")

      expect(setCreateForm.mock.results[0].value).toEqual({ ...emptyForm, region: "d" })
      expect(setCreateForm.mock.results[1].value).toEqual({ ...emptyForm, district: "i" })
      expect(setCreateForm.mock.results[2].value).toEqual({ ...emptyForm, area: "k" })
    })

    it("changes role_name via the role select", async () => {
      const setCreateForm = jest.fn((updater) => updater(emptyForm))
      render(<AgentDialogs {...makeProps({ setCreateForm })} />)

      await userEvent.selectOptions(screen.getByDisplayValue("Sales Agent"), "Regional Supervisor")

      expect(setCreateForm).toHaveReturnedWith({ ...emptyForm, role_name: "Regional Supervisor" })
    })

    it("closes the dialog via Cancel and does not create", async () => {
      const setIsCreateOpen = jest.fn()
      const handleCreateAgent = jest.fn()
      render(<AgentDialogs {...makeProps({ setIsCreateOpen, handleCreateAgent })} />)

      await userEvent.click(screen.getByRole("button", { name: "Cancel" }))

      expect(setIsCreateOpen).toHaveBeenCalledWith(false)
      expect(handleCreateAgent).not.toHaveBeenCalled()
    })

    it("calls handleCreateAgent when Create Agent is clicked", async () => {
      const handleCreateAgent = jest.fn()
      render(<AgentDialogs {...makeProps({ handleCreateAgent })} />)

      await userEvent.click(screen.getByRole("button", { name: /create agent/i }))

      expect(handleCreateAgent).toHaveBeenCalledTimes(1)
    })

    it("shows the spinner and 'Creating...' label, and disables both buttons, while isCreating", () => {
      render(<AgentDialogs {...makeProps({ isCreating: true })} />)

      expect(screen.getByText("Creating...")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()
      expect(screen.getByRole("button", { name: /creating/i })).toBeDisabled()
    })

    it("does not disable the buttons or show a spinner when not creating", () => {
      render(<AgentDialogs {...makeProps({ isCreating: false })} />)

      expect(screen.queryByText("Creating...")).not.toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Cancel" })).not.toBeDisabled()
      expect(screen.getByRole("button", { name: /create agent/i })).not.toBeDisabled()
    })
  })

  describe("Delete Agent dialog", () => {
    const target = { id: "agent-1", name: "Asha Mwinyi", code: "AG-001" }
    // The create dialog is open by default in makeProps(); close it here so
    // its own "Cancel" button doesn't collide with the delete dialog's.
    const base = { isCreateOpen: false }

    it("is closed (no dialog content) when deleteTarget is null", () => {
      render(<AgentDialogs {...makeProps({ ...base, deleteTarget: null })} />)

      expect(screen.queryByText("Delete Agent Permanently")).not.toBeInTheDocument()
    })

    it("opens and shows the target's name and code when deleteTarget is set", () => {
      render(<AgentDialogs {...makeProps({ ...base, deleteTarget: target })} />)

      expect(screen.getByText("Delete Agent Permanently")).toBeInTheDocument()
      expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument()
      expect(screen.getByText("AG-001")).toBeInTheDocument()
    })

    it("clears the delete target when the dialog is dismissed (onOpenChange(false))", async () => {
      const setDeleteTarget = jest.fn()
      render(<AgentDialogs {...makeProps({ ...base, deleteTarget: target, setDeleteTarget })} />)

      // Radix fires onOpenChange(false) on Escape.
      await userEvent.keyboard("{Escape}")

      expect(setDeleteTarget).toHaveBeenCalledWith(null)
    })

    it("clears the delete target via the Cancel button without deleting", async () => {
      const setDeleteTarget = jest.fn()
      const handleDeleteAgent = jest.fn()
      render(<AgentDialogs {...makeProps({ ...base, deleteTarget: target, setDeleteTarget, handleDeleteAgent })} />)

      await userEvent.click(screen.getByRole("button", { name: "Cancel" }))

      expect(setDeleteTarget).toHaveBeenCalledWith(null)
      expect(handleDeleteAgent).not.toHaveBeenCalled()
    })

    it("calls handleDeleteAgent with the target's id on confirm", async () => {
      const handleDeleteAgent = jest.fn()
      render(<AgentDialogs {...makeProps({ ...base, deleteTarget: target, handleDeleteAgent })} />)

      await userEvent.click(screen.getByRole("button", { name: /delete permanently/i }))

      expect(handleDeleteAgent).toHaveBeenCalledWith("agent-1")
    })

    it("shows 'Deleting...' and disables both buttons only when isActionLoading matches this target's key", () => {
      render(<AgentDialogs {...makeProps({ ...base, deleteTarget: target, isActionLoading: "delete-agent-1" })} />)

      expect(screen.getByText("Deleting...")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()
      expect(screen.getByRole("button", { name: /deleting/i })).toBeDisabled()
    })

    it("does not disable delete buttons when isActionLoading is for a different agent", () => {
      render(<AgentDialogs {...makeProps({ ...base, deleteTarget: target, isActionLoading: "delete-agent-99" })} />)

      expect(screen.queryByText("Deleting...")).not.toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Cancel" })).not.toBeDisabled()
      expect(screen.getByRole("button", { name: /delete permanently/i })).not.toBeDisabled()
    })
  })
})
