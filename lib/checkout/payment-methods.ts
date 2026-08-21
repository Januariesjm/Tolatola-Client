/**
 * Display metadata for the payment methods offered at checkout.
 *
 * These lists were object literals written inline inside the JSX of
 * components/checkout/checkout-content.tsx, one per accordion section. Keeping
 * them there meant the set of selectable providers was only discoverable by
 * reading markup, and nothing tied them to the payment-method groups in
 * validate-checkout-form.ts -- so a provider could be rendered as selectable
 * while the validator did not recognise it as mobile money and therefore never
 * asked for a phone number.
 *
 * They live here as data so both the form and its validator read from one place,
 * and so a test can assert the two agree.
 */

import { CARD_METHODS, MOBILE_MONEY_METHODS, METHODS_UNDER_MAINTENANCE } from "@/lib/checkout/validate-checkout-form"

/** A mobile money provider as rendered in the "TOLA Pay" section. */
export interface MobileMoneyProvider {
  /** Payment method id; must be a member of MOBILE_MONEY_METHODS. */
  id: (typeof MOBILE_MONEY_METHODS)[number]
  /** Consumer-facing wallet name. */
  name: string
  /** Network operating the wallet. */
  provider: string
  /** True while the provider is disabled upstream; renders greyed out. */
  maintenance?: boolean
}

/**
 * Mobile money providers, in display order.
 *
 * `maintenance` is derived from METHODS_UNDER_MAINTENANCE rather than hardcoded,
 * so re-enabling a provider is a one-line change in the validator and this list
 * follows automatically.
 */
export const MOBILE_MONEY_PROVIDERS: MobileMoneyProvider[] = [
  { id: "airtel-money", name: "Airtel Money", provider: "Airtel" },
  { id: "mixx-by-yas", name: "Mixx by Yas", provider: "Tigo Pesa" },
  { id: "halopesa", name: "HaloPesa", provider: "Halotel" },
  { id: "ezypesa", name: "EzyPesa", provider: "Zantel" },
  { id: "m-pesa", name: "M-Pesa", provider: "Vodacom" },
].map((provider) => ({
  ...provider,
  ...(METHODS_UNDER_MAINTENANCE.includes(provider.id as (typeof METHODS_UNDER_MAINTENANCE)[number]) ? { maintenance: true } : {}),
})) as MobileMoneyProvider[]

/** Card networks, in display order. Ids match CARD_METHODS. */
export const CARD_NETWORKS: (typeof CARD_METHODS)[number][] = ["visa", "mastercard", "unionpay"]

/** Bank transfer channels, in display order. */
export const BANK_METHODS = ["crdb-simbanking", "crdb-internet-banking", "crdb-wakala", "crdb-branch-otc"] as const

/**
 * Turns a bank method id into its label ("crdb-wakala" -> "crdb wakala").
 *
 * The markup relied on `b.replace(/-/g, " ")` plus a `capitalize` CSS class, so
 * the transform is reproduced here rather than hand-writing labels that could
 * drift from the ids.
 */
export function formatBankMethodLabel(method: string): string {
  return method.replace(/-/g, " ")
}
