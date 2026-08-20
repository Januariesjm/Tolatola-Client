/**
 * Tests for the survey exporters (lib/admin/validation-surveys-export.ts).
 *
 * These were ~207 lines buried inside a 952-line component and had no coverage.
 * The behaviours that matter: a header row plus one row per survey, commas and
 * quotes in free-text answers must not break the CSV, and each exporter must
 * revoke the object URL it creates.
 */

import { exportSurveysToCsv, exportSurveysToExcel, exportSurveysToPdf } from "@/lib/admin/validation-surveys-export"
import type { ValidationSurvey } from "@/lib/admin/validation-surveys-types"

function survey(overrides: Partial<ValidationSurvey> = {}): ValidationSurvey {
  return {
    id: "s-1",
    full_name: "Asha Mwinyi",
    phone: "255700000001",
    email: "asha@example.test",
    region: "Dodoma",
    district: "Central",
    location_ward: "Kikuyu",
    respondent_type: "Consumer",
    q1_challenges: "Trust",
    q2_biggest_challenge: "Fake sellers",
    q3_impact_rating: 4,
    q4_time_searching: "2 hours",
    q5_lost_money: "Yes",
    q6_channels: ["WhatsApp", "Instagram"],
    q7_satisfaction_rating: 3,
    q8_platform_value_rating: 5,
    q9_escrow_importance: 5,
    q10_buyer_protection_importance: 4,
    q11_otp_reduces_disputes: "Yes",
    q12_nearby_suppliers_frequency: "Often",
    q13_willing_to_pay: "Yes",
    q14_payment_amount: "5000",
    q15_choice_and_reason: "Escrow, because it protects me",
    created_at: "2026-02-01T10:00:00Z",
    survey_date: "2026-01-30",
    upload_date: "2026-02-01",
    ...overrides,
  }
}

/** Captures what each exporter passed to `new Blob(...)`. */
interface CapturedBlob {
  text: string
  type: string
}

let createdBlobs: CapturedBlob[]
const RealBlob = global.Blob
let revoked: string[]
let clicks: number
let openedWindow: { document: { write: jest.Mock; close: jest.Mock }; print: jest.Mock } | null

beforeEach(() => {
  createdBlobs = []
  revoked = []
  clicks = 0

  // jsdom's Blob has no .text(), so capture the constructor input instead.
  global.Blob = class {
    constructor(parts: unknown[], options?: { type?: string }) {
      createdBlobs.push({
        text: (parts || []).map(String).join(""),
        type: options?.type ?? "",
      })
    }
  } as unknown as typeof Blob

  global.URL.createObjectURL = jest.fn(() => `blob:mock/${createdBlobs.length}`) as unknown as typeof URL.createObjectURL
  global.URL.revokeObjectURL = jest.fn((url: string) => {
    revoked.push(url)
  }) as unknown as typeof URL.revokeObjectURL

  // Intercept the synthetic <a> each exporter creates and clicks.
  const realCreate = document.createElement.bind(document)
  jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
    const el = realCreate(tag) as HTMLElement
    if (tag === "a") {
      ;(el as HTMLAnchorElement).click = () => {
        clicks += 1
      }
    }
    return el
  })

  openedWindow = {
    document: { write: jest.fn(), close: jest.fn() },
    print: jest.fn(),
  }
  jest.spyOn(window, "open").mockImplementation(() => openedWindow as unknown as Window)
  jest.useFakeTimers()
})

afterEach(() => {
  global.Blob = RealBlob
  jest.runOnlyPendingTimers()
  jest.useRealTimers()
  jest.restoreAllMocks()
})

/** Reads back the text of the blob an exporter produced. */
function blobText(index = 0) {
  return createdBlobs[index].text
}

describe("exportSurveysToCsv", () => {
  it("writes a header row plus one row per survey", async () => {
    exportSurveysToCsv([survey({ id: "a" }), survey({ id: "b", full_name: "Juma Said" })])

    const text = blobText()
    const rows = text.trim().split("\n")
    expect(rows).toHaveLength(3)
    expect(rows[0]).toContain("Survey Date")
    expect(text).toContain("Asha Mwinyi")
    expect(text).toContain("Juma Said")
  })

  it("quotes free-text answers so a comma cannot shift columns", async () => {
    exportSurveysToCsv([survey({ q15_choice_and_reason: "Escrow, speed, and trust" })])

    const text = blobText()
    expect(text).toContain('"Escrow, speed, and trust"')
    // Header count must still match the data row's field count.
    const rows = text.trim().split("\n")
    expect(rows).toHaveLength(2)
  })

  it("produces only a header row for an empty list", async () => {
    exportSurveysToCsv([])

    const text = blobText()
    expect(text.trim().split("\n")).toHaveLength(1)
  })

  it("marks the blob as CSV and revokes the URL it created", async () => {
    exportSurveysToCsv([survey()])

    expect(createdBlobs[0].type).toContain("text/csv")
    expect(clicks).toBe(1)
    expect(revoked).toEqual(["blob:mock/1"])
  })
})

describe("exportSurveysToExcel", () => {
  it("creates a downloadable blob and revokes its URL", async () => {
    exportSurveysToExcel([survey()])

    expect(createdBlobs).toHaveLength(1)
    expect(clicks).toBe(1)
    expect(revoked).toEqual(["blob:mock/1"])
  })

  it("includes the respondent in the output", async () => {
    exportSurveysToExcel([survey({ full_name: "Neema Paul" })])

    expect(blobText()).toContain("Neema Paul")
  })

  it("handles an empty list without throwing", () => {
    expect(() => exportSurveysToExcel([])).not.toThrow()
  })
})

describe("exportSurveysToPdf", () => {
  it("writes a printable document into a new window and prints it", () => {
    exportSurveysToPdf([survey()])

    expect(window.open).toHaveBeenCalled()
    expect(openedWindow?.document.write).toHaveBeenCalled()
    expect(openedWindow?.document.close).toHaveBeenCalled()

    const html = String(openedWindow?.document.write.mock.calls[0][0])
    expect(html).toContain("TOLA Market Validation Survey Report")
    expect(html).toContain("Asha Mwinyi")
    expect(html).toContain("Total: 1 responses")

    // Printing is deferred so the document can lay out first.
    expect(openedWindow?.print).not.toHaveBeenCalled()
    jest.advanceTimersByTime(500)
    expect(openedWindow?.print).toHaveBeenCalled()
  })

  it("bails out quietly when the popup is blocked", () => {
    jest.spyOn(window, "open").mockReturnValue(null)

    expect(() => exportSurveysToPdf([survey()])).not.toThrow()
  })

  it("reports the row count for an empty list", () => {
    exportSurveysToPdf([])

    const html = String(openedWindow?.document.write.mock.calls[0][0])
    expect(html).toContain("Total: 0 responses")
  })
})
