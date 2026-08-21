/**
 * Dialling codes used to split a stored E.164 phone number back into a country
 * code and a local number.
 *
 * Extracted from app/auth/sign-up/page.tsx, where this table sat inline as 122
 * string literals inside a callback — about a seventh of that file.
 *
 * Order matters: codes are listed LONGEST FIRST so a prefix search cannot match
 * a shorter code that happens to be a prefix of the right one. "+1876"
 * (Jamaica) has to be tried before "+1", and "+255" before "+2". Keep any new
 * entry in the correct length bucket.
 */
export const DIALLING_CODES = [
  "+1876",
  "+880",
  "+886",
  "+852",
  "+855",
  "+998",
  "+995",
  "+994",
  "+993",
  "+977",
  "+976",
  "+975",
  "+974",
  "+973",
  "+972",
  "+971",
  "+968",
  "+966",
  "+965",
  "+964",
  "+962",
  "+961",
  "+960",
  "+593",
  "+509",
  "+421",
  "+420",
  "+386",
  "+385",
  "+381",
  "+380",
  "+374",
  "+372",
  "+371",
  "+370",
  "+359",
  "+358",
  "+354",
  "+353",
  "+351",
  "+291",
  "+269",
  "+268",
  "+267",
  "+266",
  "+265",
  "+264",
  "+263",
  "+261",
  "+260",
  "+258",
  "+257",
  "+256",
  "+255",
  "+254",
  "+253",
  "+252",
  "+251",
  "+250",
  "+249",
  "+248",
  "+244",
  "+237",
  "+235",
  "+234",
  "+233",
  "+230",
  "+227",
  "+226",
  "+225",
  "+223",
  "+221",
  "+218",
  "+216",
  "+213",
  "+212",
  "+211",
  "+98",
  "+95",
  "+94",
  "+93",
  "+92",
  "+91",
  "+90",
  "+86",
  "+84",
  "+82",
  "+81",
  "+66",
  "+65",
  "+64",
  "+63",
  "+62",
  "+61",
  "+58",
  "+57",
  "+56",
  "+55",
  "+54",
  "+53",
  "+52",
  "+51",
  "+49",
  "+48",
  "+47",
  "+46",
  "+45",
  "+44",
  "+43",
  "+41",
  "+40",
  "+39",
  "+36",
  "+34",
  "+33",
  "+32",
  "+31",
  "+30",
  "+27",
  "+20",
  "+7",
  "+1",
] as const

export type DiallingCode = (typeof DIALLING_CODES)[number]

/** A phone number split into its dialling code and the rest. */
export interface SplitPhoneNumber {
  countryCode: string
  localNumber: string
}

/**
 * Splits an E.164-style number into its dialling code and local part.
 *
 * Returns null when the value is not in international form or no known code
 * matches, so the caller can decide what to do rather than getting a silently
 * mangled number.
 */
export function splitPhoneNumber(phone: string | null | undefined): SplitPhoneNumber | null {
  if (!phone) return null

  const trimmed = phone.trim()
  if (!trimmed.startsWith("+")) return null

  const match = DIALLING_CODES.find((code) => trimmed.startsWith(code))
  if (!match) return null

  return { countryCode: match, localNumber: trimmed.slice(match.length) }
}

/**
 * Joins a country code and a local number into an E.164-style string.
 *
 * Leading zeros are stripped from the local part: people write "0712..." for a
 * domestic number, which would be "+2550712..." if concatenated naively.
 */
export function joinPhoneNumber(countryCode: string, localNumber: string): string {
  if (!localNumber) return ""
  return `${countryCode}${localNumber.replace(/^0+/, "")}`
}
