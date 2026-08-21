/**
 * Tests for SurveyAnswersStep (components/validation/survey-answers-step.tsx).
 *
 * Presentational: form state, validation and submission live in the parent.
 * What matters is that each answer type reports through the right callback
 * (onFieldChange for most, onToggleChannel for the multi-select), a form-level
 * error renders, and submit reflects the `submitting` flag.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SurveyAnswersStep } from "@/components/validation/survey-answers-step"
import { initialForm } from "@/lib/validation-survey-form"

const props = {
  form: initialForm,
  errors: {} as Record<string, string>,
  onFieldChange: jest.fn(),
  onToggleChannel: jest.fn(),
  onBack: jest.fn(),
  onSubmit: jest.fn(),
  submitting: false,
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("SurveyAnswersStep", () => {
  it("reports a Yes/No answer with the right field key", async () => {
    render(<SurveyAnswersStep {...props} />)

    await userEvent.click(screen.getAllByRole("button", { name: "Yes" })[0])

    expect(props.onFieldChange).toHaveBeenCalledWith("q1_challenges", "Yes")
  })

  it("reports a channel toggle separately from field changes", async () => {
    render(<SurveyAnswersStep {...props} />)

    await userEvent.click(screen.getByRole("button", { name: "WhatsApp" }))

    expect(props.onToggleChannel).toHaveBeenCalledWith("WhatsApp")
  })

  it("shows a form-level error when present", () => {
    render(<SurveyAnswersStep {...props} errors={{ _form: "Failed to submit survey. Please try again." }} />)

    expect(screen.getByText("Failed to submit survey. Please try again.")).toBeInTheDocument()
  })

  it("shows no form-level error banner when there is none", () => {
    render(<SurveyAnswersStep {...props} />)

    expect(screen.queryByText(/failed to submit/i)).not.toBeInTheDocument()
  })

  it("shows a question's validation error inline", () => {
    render(<SurveyAnswersStep {...props} errors={{ q1_challenges: "Please answer this question" }} />)

    expect(screen.getByText("Please answer this question")).toBeInTheDocument()
  })

  it("calls onBack from the Back button", async () => {
    render(<SurveyAnswersStep {...props} />)

    await userEvent.click(screen.getByRole("button", { name: /back/i }))

    expect(props.onBack).toHaveBeenCalledTimes(1)
  })

  it("calls onSubmit from the submit button", async () => {
    render(<SurveyAnswersStep {...props} />)

    await userEvent.click(screen.getByRole("button", { name: "Submit Survey" }))

    expect(props.onSubmit).toHaveBeenCalledTimes(1)
  })

  it("disables submit and shows progress while submitting", () => {
    render(<SurveyAnswersStep {...props} submitting />)

    expect(screen.getByRole("button", { name: /submitting/i })).toBeDisabled()
  })
})
