import { z } from "zod"

/**
 * Zod schema for a wallet withdrawal request.
 *
 * `lib/agent/wallet.ts` already enforced these rules by hand with a sequence of
 * `if` statements; this makes the shape a schema like every other input
 * boundary in the codebase (see `lib/schemas/api.ts`), so it can be reused if a
 * server-side withdrawal endpoint is ever added to this repo directly, and so
 * the rules are visible as data rather than only as control flow.
 *
 * There is currently no such route here: `POST agents/withdrawals/request` is
 * served by the separate backend behind `NEXT_PUBLIC_API_BASE_URL`, which this
 * repo does not own and cannot validate on. This schema is the client-side
 * gate `useAdminVendors`-style code already relies on before that request is
 * ever sent.
 *
 * Order matters and is enforced by `superRefine` bailing out after the first
 * issue: amount validity, then sufficient balance, then phone. Callers that
 * need the exact same Swahili-titled shape `validateWithdrawal` returns should
 * keep using that function; this schema is what backs it.
 */

/** Minimum digits for a mobile-money number to be worth submitting. */
export const MIN_PHONE_DIGITS = 9

export interface WithdrawalIssueParams {
  code: "invalid_amount" | "insufficient_balance" | "invalid_phone"
}

export const withdrawalRequestSchema = z
  .object({
    /** Raw form value; a string because that is what an <input type="number"> yields. */
    amount: z.string(),
    /** The withdrawable balance the amount is checked against. */
    balance: z.number(),
    phoneNumber: z.string(),
  })
  .superRefine((value, ctx) => {
    const numericAmount = Number(value.amount)

    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      ctx.addIssue({ code: "custom", path: ["amount"], message: "Amount must be a positive number", params: { code: "invalid_amount" } })
      return
    }

    if (numericAmount > value.balance) {
      ctx.addIssue({
        code: "custom",
        path: ["amount"],
        message: "Amount exceeds the withdrawable balance",
        params: { code: "insufficient_balance" },
      })
      return
    }

    if (!value.phoneNumber || value.phoneNumber.trim().length < MIN_PHONE_DIGITS) {
      ctx.addIssue({
        code: "custom",
        path: ["phoneNumber"],
        message: "A valid phone number is required",
        params: { code: "invalid_phone" },
      })
    }
  })

export type WithdrawalRequestInput = z.input<typeof withdrawalRequestSchema>

/**
 * The first rejection code from a failed parse, or null when the request is
 * valid. `superRefine` above only ever adds one issue per call, so this is
 * always `issues[0]`; the type still allows for more so a future rule cannot
 * silently produce a code this function drops on the floor.
 */
export function firstWithdrawalIssueCode(
  result: z.SafeParseReturnType<WithdrawalRequestInput, unknown>,
): WithdrawalIssueParams["code"] | null {
  if (result.success) return null
  const [issue] = result.error.issues
  if (issue?.code !== "custom") return null
  return (issue.params as WithdrawalIssueParams | undefined)?.code ?? null
}
