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

export type AssignRoleRequest = z.infer<typeof assignRoleSchema>
export type RevokeRoleRequest = z.infer<typeof revokeRoleSchema>
export type PayoutDecisionRequest = z.infer<typeof payoutDecisionSchema>
export type PayoutRequestBody = z.infer<typeof payoutRequestSchema>
export type CreateAdminRequest = z.infer<typeof createAdminSchema>
