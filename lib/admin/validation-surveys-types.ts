/**
 * Types for the admin market-validation survey tab.
 *
 * Lifted out of components/admin/validation-surveys-tab.tsx so the export
 * helpers and the import wizard can share them without importing from a
 * component.
 */

export interface ValidationSurvey {
  id: string
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
  created_at: string
  // Enhanced fields
  survey_date: string
  upload_date: string
  assisted_by_agent?: boolean
  agent_id?: string
  agent_name?: string
  collection_method?: string
  source?: string
  created_by?: string
  updated_by?: string
  updated_at?: string
}

export interface SurveyStats {
  totalResponses: number
  totalConsumers: number
  totalVendors: number
  totalTransporters: number
  trustProblemPct: number
  informationGapPct: number
  digitalAdoptionPct: number
  willingnessToPayPct: number
  escrowAcceptancePct: number
  buyerProtectionAcceptancePct: number
}

export const defaultStats: SurveyStats = {
  totalResponses: 0,
  totalConsumers: 0,
  totalVendors: 0,
  totalTransporters: 0,
  trustProblemPct: 0,
  informationGapPct: 0,
  digitalAdoptionPct: 0,
  willingnessToPayPct: 0,
  escrowAcceptancePct: 0,
  buyerProtectionAcceptancePct: 0,
}
