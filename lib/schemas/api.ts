import { z } from "zod"

/**
 * Request-body schemas for the API route handlers.
 *
 * Every handler under app/api that accepts a body should validate it with one
 * of these via `validateRequestBody`. Before this, handlers destructured
 * straight out of `request.json()`, so a missing or wrongly-typed id reached a
 * Supabase query unchecked — a query built with `undefined` in it either 404s
 * confusingly or, on a permissive policy, matches more than intended.
 *
 * Ids are `.min(1)` rather than `.uuid()` on purpose: the tables mix uuid and
 * text keys, and rejecting a valid non-uuid id would be a regression.
 */

const id = (label: string) => z.string().min(1, `${label} is required`)

/** Which side of a payout is being actioned. */
export const payoutUserTypeSchema = z.enum(["vendor", "transporter"])

/** POST /api/admin/assign-role */
export const assignRoleSchema = z.object({
  userId: id("userId"),
  roleId: id("roleId"),
})

/** POST /api/admin/remove-role and /api/admin/revoke-role */
export const revokeRoleSchema = z.object({
  userId: id("userId"),
  reason: z.string().optional(),
})

/** POST /api/admin/payouts/approve and /api/admin/payouts/reject */
export const payoutDecisionSchema = z.object({
  payoutId: id("payoutId"),
  userType: payoutUserTypeSchema,
})

/** POST /api/payouts/request */
export const payoutRequestSchema = z.object({
  vendorId: id("vendorId"),
  /** Guard against zero, negative and NaN amounts reaching the ledger. */
  amount: z.number().positive("amount must be greater than 0"),
  paymentMethod: id("paymentMethod"),
  paymentDetails: z.unknown().optional(),
})

/** POST /api/setup/create-admin */
export const createAdminSchema = z.object({
  email: z.string().email("A valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(1, "fullName is required"),
  setupKey: z.string().min(1, "setupKey is required"),
})

/** POST /api/orders/[id]/assign */
export const assignTransporterSchema = z.object({
  transporterId: id("transporterId"),
})

/** POST /api/profile/update */
export const profileUpdateSchema = z.object({
  full_name: z.string().min(1, "full_name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
})

/** POST /api/transporters/update */
export const transporterUpdateSchema = z.object({
  business_name: z.string().min(1, "business_name is required"),
  vehicle_type: z.string().optional(),
  license_plate: z.string().optional(),
})

/**
 * POST /api/kyc/submit
 *
 * Every field the KYC form owns, and deliberately **not** `user_id`.
 *
 * The handler spread the whole body into a Supabase write. On the insert path
 * `user_id: user.id` was applied after the spread and won, but the update path
 * had no such override -- so a body carrying someone else's `user_id` reassigned
 * the caller's KYC record to that user. Zod strips unknown keys by default, so
 * omitting `user_id` here is what closes that: the column can now only come from
 * the authenticated session.
 *
 * Fields past the name are optional because the form saves partial progress.
 */
export const customerKycSubmitSchema = z.object({
  full_name: z.string().min(1, "full_name is required"),
  date_of_birth: z.string().optional(),
  phone_number: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  postal_code: z.string().optional(),
  id_type: z.string().optional(),
  id_number: z.string().optional(),
  id_document_front_url: z.string().optional(),
  id_document_back_url: z.string().optional(),
  selfie_url: z.string().optional(),
})

/** POST /api/notifications/transporter-kyc-{approved,rejected} */
export const kycNotificationSchema = z.object({
  email: z.string().email("A valid email is required"),
  fullName: z.string().min(1, "fullName is required"),
  /** Only the rejection notice carries one. */
  reason: z.string().optional(),
})

/**
 * POST /api/webhooks/clickpesa
 *
 * Lenient on purpose: ClickPesa owns this shape and adds fields without notice,
 * so only what the handler reads is required. `merchant_reference` is what the
 * order id is derived from and `status` decides whether an order is marked paid,
 * so those two are the ones worth rejecting a request over.
 *
 * Note this endpoint has no signature verification -- see the accompanying
 * summary. Schema validation is not authentication.
 */
export const clickpesaWebhookSchema = z.object({
  merchant_reference: z.string().min(1, "merchant_reference is required"),
  status: z.string().min(1, "status is required"),
  transaction_id: z.string().nullish(),
  amount: z.union([z.number(), z.string()]).nullish(),
  phone_number: z.string().nullish(),
})

/**
 * POST /api/registration-recovery/save
 *
 * A proxy to the backend, which owns the full contract, so this checks only what
 * the route depends on: that there is a session to attach the progress to.
 */
export const registrationRecoverySaveSchema = z.object({
  session_id: id("session_id"),
  user_type: z.string().optional(),
  full_name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  last_step: z.string().optional(),
  form_data: z.record(z.unknown()).optional(),
  user_id: z.string().optional(),
})

/** POST /api/registration-recovery/complete */
export const registrationRecoveryCompleteSchema = z.object({
  session_id: id("session_id"),
})

/**
 * POST /api/validation-survey
 *
 * The public market-validation survey. Also a proxy, so the identity fields are
 * required (a response with no respondent is not usable) and the answers are
 * type-checked but optional -- a half-finished survey is still worth storing,
 * and the question set changes between rounds.
 */
export const validationSurveySchema = z.object({
  full_name: z.string().min(1, "full_name is required"),
  phone: z.string().min(1, "phone is required"),
  email: z.string().optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  location_ward: z.string().optional(),
  respondent_type: z.string().optional(),
  q1_challenges: z.string().optional(),
  q2_biggest_challenge: z.string().optional(),
  q3_impact_rating: z.number().optional(),
  q4_time_searching: z.string().optional(),
  q5_lost_money: z.string().optional(),
  q6_channels: z.array(z.string()).optional(),
  q7_satisfaction_rating: z.number().optional(),
  q8_platform_value_rating: z.number().optional(),
  q9_escrow_importance: z.number().optional(),
  q10_buyer_protection_importance: z.number().optional(),
  q11_otp_reduces_disputes: z.string().optional(),
  q12_nearby_suppliers_frequency: z.string().optional(),
  q13_willing_to_pay: z.string().optional(),
  q14_payment_amount: z.string().optional(),
  q15_choice_and_reason: z.string().optional(),
  assisted_by_agent: z.boolean().optional(),
  agent_name: z.string().optional(),
})

export type AssignTransporterRequest = z.infer<typeof assignTransporterSchema>
export type ProfileUpdateRequest = z.infer<typeof profileUpdateSchema>
export type TransporterUpdateRequest = z.infer<typeof transporterUpdateSchema>
export type CustomerKycSubmitRequest = z.infer<typeof customerKycSubmitSchema>
export type KycNotificationRequest = z.infer<typeof kycNotificationSchema>
export type ClickpesaWebhookPayload = z.infer<typeof clickpesaWebhookSchema>
export type RegistrationRecoverySaveRequest = z.infer<typeof registrationRecoverySaveSchema>
export type RegistrationRecoveryCompleteRequest = z.infer<typeof registrationRecoveryCompleteSchema>
export type ValidationSurveyRequest = z.infer<typeof validationSurveySchema>

export type AssignRoleRequest = z.infer<typeof assignRoleSchema>
export type RevokeRoleRequest = z.infer<typeof revokeRoleSchema>
export type PayoutDecisionRequest = z.infer<typeof payoutDecisionSchema>
export type PayoutRequestBody = z.infer<typeof payoutRequestSchema>
export type CreateAdminRequest = z.infer<typeof createAdminSchema>
