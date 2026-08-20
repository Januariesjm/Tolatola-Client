/**
 * Form model for the public market-validation survey.
 *
 * Split out of app/validation/page.tsx, which held the shape, its blank value
 * and ~500 lines of step markup in one file.
 */

export interface FormData {
  full_name: string
  phone: string
  email: string
  region: string
  district: string
  location_ward: string
  respondent_type: string
  q1_challenges: string
  q2_biggest_challenge: string
  q3_impact_rating: number
  q4_time_searching: string
  q5_lost_money: string
  q6_channels: string[]
  q7_satisfaction_rating: number
  q8_platform_value_rating: number
  q9_escrow_importance: number
  q10_buyer_protection_importance: number
  q11_otp_reduces_disputes: string
  q12_nearby_suppliers_frequency: string
  q13_willing_to_pay: string
  q14_payment_amount: string
  q15_choice_and_reason: string
  assisted_by_agent: boolean
  agent_name: string
}

export const initialForm: FormData = {
  full_name: "",
  phone: "",
  email: "",
  region: "",
  district: "",
  location_ward: "",
  respondent_type: "",
  q1_challenges: "",
  q2_biggest_challenge: "",
  q3_impact_rating: 5,
  q4_time_searching: "",
  q5_lost_money: "",
  q6_channels: [],
  q7_satisfaction_rating: 5,
  q8_platform_value_rating: 5,
  q9_escrow_importance: 5,
  q10_buyer_protection_importance: 5,
  q11_otp_reduces_disputes: "",
  q12_nearby_suppliers_frequency: "",
  q13_willing_to_pay: "",
  q14_payment_amount: "",
  q15_choice_and_reason: "",
  assisted_by_agent: false,
  agent_name: "",
}

/**
 * Step 1 (respondent details) validation. Returns a field -> message map;
 * an empty object means the step is valid.
 *
 * Pure, so it can be unit-tested without rendering the form.
 */
export function validateRespondentStep(form: FormData): Record<string, string> {
  const e: Record<string, string> = {}
  if (!form.full_name.trim()) e.full_name = "Full name is required"
  if (!form.phone.trim()) e.phone = "Phone number is required"
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    e.email = "Invalid email format"
  }
  if (!form.region) e.region = "Region is required"
  if (!form.district.trim()) e.district = "District is required"
  if (!form.location_ward.trim()) e.location_ward = "Location / Ward is required"
  if (!form.respondent_type) e.respondent_type = "Respondent type is required"
  if (form.assisted_by_agent && !form.agent_name.trim()) {
    e.agent_name = "Agent name is required"
  }
  return e
}

/** Step 2 (survey answers) validation. Same contract as above. */
export function validateAnswersStep(form: FormData): Record<string, string> {
  const e: Record<string, string> = {}
  if (!form.q1_challenges) e.q1_challenges = "Required"
  if (!form.q2_biggest_challenge) e.q2_biggest_challenge = "Required"
  if (!form.q4_time_searching) e.q4_time_searching = "Required"
  if (!form.q5_lost_money) e.q5_lost_money = "Required"
  if (form.q6_channels.length === 0) e.q6_channels = "Select at least one channel"
  if (!form.q11_otp_reduces_disputes) e.q11_otp_reduces_disputes = "Required"
  if (!form.q12_nearby_suppliers_frequency) e.q12_nearby_suppliers_frequency = "Required"
  if (!form.q13_willing_to_pay) e.q13_willing_to_pay = "Required"
  if (!form.q14_payment_amount) e.q14_payment_amount = "Required"
  if (!form.q15_choice_and_reason.trim()) e.q15_choice_and_reason = "Required"
  return e
}
