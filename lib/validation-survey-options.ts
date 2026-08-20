/**
 * Option lists for the market-validation survey.
 *
 * These were duplicated: the public survey form (app/validation/page.tsx) and
 * the admin surveys tab (components/admin/validation-surveys-tab.tsx) each
 * carried their own copy of the 31 Tanzanian regions and of the respondent
 * types. Two copies of a list the UI filters on is a correctness risk, not just
 * duplication -- a region added to one and not the other silently drops rows
 * from the admin filter.
 */

export const RESPONDENT_TYPES = ["Consumer", "Producer", "Manufacturer", "Supplier", "Wholesaler", "Retail Trader", "Transporter", "Other"]
export const CHALLENGE_OPTIONS = [
  "Trust",
  "Product Availability",
  "Supplier Discovery",
  "Logistics",
  "Payment Security",
  "Information Gap",
  "Other",
]
export const CHANNEL_OPTIONS = ["WhatsApp", "Facebook", "Phone Calls", "Referral", "Physical Market", "Other"]
export const TIME_OPTIONS = ["Less than 1 hour", "1–3 hours", "3–6 hours", "6–12 hours", "More than 12 hours", "Multiple days"]
export const FREQUENCY_OPTIONS = ["Daily", "Several times a week", "Weekly", "Monthly", "Rarely", "Never"]
export const PAYMENT_OPTIONS = [
  "Less than TZS 1,000",
  "TZS 1,000 – 5,000",
  "TZS 5,000 – 10,000",
  "TZS 10,000 – 25,000",
  "TZS 25,000 – 50,000",
  "More than TZS 50,000",
]

export const TANZANIA_REGIONS = [
  "Arusha",
  "Dar es Salaam",
  "Dodoma",
  "Geita",
  "Iringa",
  "Kagera",
  "Katavi",
  "Kigoma",
  "Kilimanjaro",
  "Lindi",
  "Manyara",
  "Mara",
  "Mbeya",
  "Morogoro",
  "Mtwara",
  "Mwanza",
  "Njombe",
  "Pemba Kaskazini",
  "Pemba Kusini",
  "Pwani",
  "Rukwa",
  "Ruvuma",
  "Shinyanga",
  "Simiyu",
  "Singida",
  "Songwe",
  "Tabora",
  "Tanga",
  "Unguja Kaskazini",
  "Unguja Kusini",
  "Unguja Mjini Magharibi",
]

/** Admin filter values: the respondent types plus an "all" sentinel. */
export const RESPONDENT_TYPE_FILTERS = ["all", ...RESPONDENT_TYPES]
