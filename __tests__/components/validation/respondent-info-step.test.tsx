/**
 * Tests for RespondentInfoStep (components/validation/respondent-info-step.tsx).
 *
 * Presentational: form state and validation live in the parent. What matters
 * is that each field reports through onFieldChange with the right key, that
 * validation errors render inline, and that the agent-name field only
 * appears once "assisted by an agent" is checked.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RespondentInfoStep } from "@/components/validation/respondent-info-step"
import { initialForm } from "@/lib/validation-survey-form"

const props = {
  form: initialForm,
  errors: {} as Record<string, string>,
  onFieldChange: jest.fn(),
  onContinue: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("RespondentInfoStep", () => {
  it("reports a full_name keystroke with the right field key", async () => {
    render(<RespondentInfoStep {...props} />)

    await userEvent.type(screen.getByPlaceholderText("John Doe"), "A")

    expect(props.onFieldChange).toHaveBeenCalledWith("full_name", "A")
  })

  it("reports a respondent type selection", async () => {
    render(<RespondentInfoStep {...props} />)

    await userEvent.click(screen.getByRole("button", { name: "Producer" }))

    expect(props.onFieldChange).toHaveBeenCalledWith("respondent_type", "Producer")
  })

  it("shows a field's validation error inline", () => {
    render(<RespondentInfoStep {...props} errors={{ full_name: "Full name is required" }} />)

    expect(screen.getByText("Full name is required")).toBeInTheDocument()
  })

  it("hides the agent-name field until assisted_by_agent is checked", () => {
    render(<RespondentInfoStep {...props} />)

    expect(screen.queryByPlaceholderText(/name of the agent/i)).not.toBeInTheDocument()
  })

  it("shows the agent-name field once assisted_by_agent is true", () => {
    render(<RespondentInfoStep {...props} form={{ ...initialForm, assisted_by_agent: true }} />)

    expect(screen.getByPlaceholderText(/name of the agent/i)).toBeInTheDocument()
  })

  it("clears agent_name when assisted_by_agent is unchecked", async () => {
    render(<RespondentInfoStep {...props} form={{ ...initialForm, assisted_by_agent: true }} />)

    await userEvent.click(screen.getByRole("checkbox"))

    expect(props.onFieldChange).toHaveBeenCalledWith("assisted_by_agent", false)
    expect(props.onFieldChange).toHaveBeenCalledWith("agent_name", "")
  })

  it("calls onContinue when Continue is clicked", async () => {
    render(<RespondentInfoStep {...props} />)

    await userEvent.click(screen.getByRole("button", { name: /continue/i }))

    expect(props.onContinue).toHaveBeenCalledTimes(1)
  })
})
