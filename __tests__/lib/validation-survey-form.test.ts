/**
 * Tests for the survey step validators (lib/validation-survey-form.ts).
 *
 * These were closures inside app/validation/page.tsx and untestable. They gate
 * whether a respondent can advance, so the contract is exact: return a
 * field -> message map, empty when the step is valid.
 */

import { initialForm, validateAnswersStep, validateRespondentStep, type FormData } from "@/lib/validation-survey-form"

/** A respondent step that passes validation. */
function validRespondent(overrides: Partial<FormData> = {}): FormData {
  return {
    ...initialForm,
    full_name: "Asha Mwinyi",
    phone: "255700000001",
    region: "Dodoma",
    district: "Dodoma Urban",
    location_ward: "Kikuyu",
    respondent_type: "Consumer",
    ...overrides,
  }
}

/** An answers step that passes validation. */
function validAnswers(overrides: Partial<FormData> = {}): FormData {
  return {
    ...validRespondent(),
    q1_challenges: "Trust",
    q2_biggest_challenge: "Trust",
    q4_time_searching: "1–3 hours",
    q5_lost_money: "Yes",
    q6_channels: ["WhatsApp"],
    q11_otp_reduces_disputes: "Yes",
    q12_nearby_suppliers_frequency: "Weekly",
    q13_willing_to_pay: "Yes",
    q14_payment_amount: "TZS 1,000 – 5,000",
    q15_choice_and_reason: "Escrow protects me",
    ...overrides,
  }
}

describe("validateRespondentStep", () => {
  it("accepts a fully filled respondent", () => {
    expect(validateRespondentStep(validRespondent())).toEqual({})
  })

  it("reports every missing required field at once, not just the first", () => {
    const errors = validateRespondentStep(initialForm)

    expect(Object.keys(errors).sort()).toEqual(["district", "full_name", "location_ward", "phone", "region", "respondent_type"])
  })

  it.each([
    ["full_name", "Full name is required"],
    ["phone", "Phone number is required"],
    ["region", "Region is required"],
    ["district", "District is required"],
    ["location_ward", "Location / Ward is required"],
    ["respondent_type", "Respondent type is required"],
  ])("requires %s", (field, message) => {
    const errors = validateRespondentStep(validRespondent({ [field]: "" } as Partial<FormData>))

    expect(errors[field]).toBe(message)
  })

  it.each([["   "], ["\t"], ["\n"]])("treats whitespace-only %j as missing", (value) => {
    expect(validateRespondentStep(validRespondent({ full_name: value }))).toHaveProperty("full_name")
  })

  it("treats email as optional", () => {
    expect(validateRespondentStep(validRespondent({ email: "" }))).toEqual({})
  })

  it.each([["not-an-email"], ["missing@domain"], ["@example.com"], ["spaces @example.com"]])("rejects the malformed email %j", (email) => {
    expect(validateRespondentStep(validRespondent({ email }))).toHaveProperty("email", "Invalid email format")
  })

  it("accepts a well-formed email", () => {
    expect(validateRespondentStep(validRespondent({ email: "asha@example.co.tz" }))).toEqual({})
  })

  it("requires the agent name only when the survey was agent-assisted", () => {
    expect(validateRespondentStep(validRespondent({ assisted_by_agent: false, agent_name: "" }))).toEqual({})
    expect(validateRespondentStep(validRespondent({ assisted_by_agent: true, agent_name: "" }))).toHaveProperty(
      "agent_name",
      "Agent name is required",
    )
    expect(validateRespondentStep(validRespondent({ assisted_by_agent: true, agent_name: "Juma" }))).toEqual({})
  })

  it("does not mutate the form it was given", () => {
    const form = validRespondent()
    const snapshot = JSON.stringify(form)

    validateRespondentStep(form)

    expect(JSON.stringify(form)).toBe(snapshot)
  })
})

describe("validateAnswersStep", () => {
  it("accepts a fully answered survey", () => {
    expect(validateAnswersStep(validAnswers())).toEqual({})
  })

  it.each([
    "q1_challenges",
    "q2_biggest_challenge",
    "q4_time_searching",
    "q5_lost_money",
    "q11_otp_reduces_disputes",
    "q12_nearby_suppliers_frequency",
    "q13_willing_to_pay",
    "q14_payment_amount",
  ])("requires %s", (field) => {
    const errors = validateAnswersStep(validAnswers({ [field]: "" } as Partial<FormData>))

    expect(errors[field]).toBe("Required")
  })

  it("requires at least one channel", () => {
    expect(validateAnswersStep(validAnswers({ q6_channels: [] }))).toHaveProperty("q6_channels", "Select at least one channel")
    expect(validateAnswersStep(validAnswers({ q6_channels: ["Referral"] }))).toEqual({})
  })

  it("rejects a whitespace-only free-text answer", () => {
    expect(validateAnswersStep(validAnswers({ q15_choice_and_reason: "   " }))).toHaveProperty("q15_choice_and_reason", "Required")
  })

  it("does not require the rating sliders, which always have a value", () => {
    const errors = validateAnswersStep(validAnswers())

    for (const key of ["q3_impact_rating", "q7_satisfaction_rating", "q8_platform_value_rating"]) {
      expect(errors).not.toHaveProperty(key)
    }
  })

  it("reports all ten answer fields when nothing is filled in", () => {
    expect(Object.keys(validateAnswersStep(initialForm))).toHaveLength(10)
  })
})

describe("initialForm", () => {
  it("fails both steps, so a blank form cannot be submitted", () => {
    expect(validateRespondentStep(initialForm)).not.toEqual({})
    expect(validateAnswersStep(initialForm)).not.toEqual({})
  })

  it("starts with no channels selected", () => {
    expect(initialForm.q6_channels).toEqual([])
  })
})
