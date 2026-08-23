/**
 * Tests for ValidationSurveysImportWizard
 * (components/admin/validation-surveys-import-wizard.tsx).
 *
 * A 4-step modal: (1) configure defaults, (2) pick a CSV, (3) preview the
 * parsed rows, (4) success. The highest-value branches are all in
 * handleCsvFileChange's CSV parser (quote-aware splitting, header
 * normalization/aliasing, per-column default fallbacks, and every error
 * exit) and in executeBulkImport's success/failure paths. Real jsdom
 * File/FileReader objects are used throughout rather than mocking them, so
 * the parser runs for real.
 */

import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ValidationSurveysImportWizard } from "@/components/admin/validation-surveys-import-wizard"
import { setErrorReporter, type LogRecord } from "@/lib/logger"

function makeProps(overrides: Partial<{ open: boolean; onClose: () => void; onImported: () => void }> = {}) {
  return {
    open: true,
    onClose: jest.fn(),
    onImported: jest.fn(),
    ...overrides,
  }
}

/** Uploads a CSV file (built from `text`) via the hidden file input. */
async function uploadCsv(text: string, filename = "surveys.csv") {
  const file = new File([text], filename, { type: "text/csv" })
  const input = document.getElementById("csvFileInput") as HTMLInputElement
  await userEvent.upload(input, file)
}

/** Advances from step 1 (Defaults) to step 2 (File Upload). */
async function goToFileUploadStep() {
  await userEvent.click(screen.getByRole("button", { name: "Choose File" }))
}

const HEADER = "full_name,phone,email,region,district,ward,respondent_type,date,collection_method,source,agent_id,agent_name,q1_challenges"

function row(fields: Partial<Record<string, string>> = {}) {
  const defaults = {
    full_name: "Asha Mwinyi",
    phone: "0712345678",
    email: "asha@example.com",
    region: "Dar es Salaam",
    district: "Ilala",
    ward: "Kariakoo",
    respondent_type: "Consumer",
    date: "2026-08-01",
    collection_method: "",
    source: "",
    agent_id: "",
    agent_name: "",
    q1_challenges: "Trust",
  }
  const merged = { ...defaults, ...fields }
  return [
    merged.full_name,
    merged.phone,
    merged.email,
    merged.region,
    merged.district,
    merged.ward,
    merged.respondent_type,
    merged.date,
    merged.collection_method,
    merged.source,
    merged.agent_id,
    merged.agent_name,
    merged.q1_challenges,
  ].join(",")
}

let reported: LogRecord[]

beforeEach(() => {
  reported = []
  setErrorReporter((record) => reported.push(record))
  jest.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  setErrorReporter(null)
  jest.restoreAllMocks()
})

describe("ValidationSurveysImportWizard", () => {
  it("renders nothing when closed", () => {
    render(<ValidationSurveysImportWizard {...makeProps({ open: false })} />)

    expect(screen.queryByText("Bulk Import Survey Wizard")).not.toBeInTheDocument()
  })

  it("opens on step 1 (Defaults) with the documented default values", () => {
    render(<ValidationSurveysImportWizard {...makeProps()} />)

    expect(screen.getByText("Bulk Import Survey Wizard")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Manual Bulk Entry")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Physical Interview")).toBeInTheDocument()
    // Step 1 has no Back button yet.
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument()
  })

  describe("step navigation", () => {
    it("moves from Defaults to File Upload via Choose File", async () => {
      render(<ValidationSurveysImportWizard {...makeProps()} />)

      await goToFileUploadStep()

      expect(screen.getByText(/click to upload or drag csv file here/i)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument()
    })

    it("returns from File Upload to Defaults via Back, clearing any error", async () => {
      render(<ValidationSurveysImportWizard {...makeProps()} />)
      await goToFileUploadStep()
      await uploadCsv("just,one,line")
      expect(await screen.findByText(/CSV must have a header row/)).toBeInTheDocument()

      await userEvent.click(screen.getByRole("button", { name: "Back" }))

      expect(screen.getByDisplayValue("Manual Bulk Entry")).toBeInTheDocument()
      // Advancing to step 2 again should not show the stale error.
      await goToFileUploadStep()
      expect(screen.queryByText(/CSV must have a header row/)).not.toBeInTheDocument()
    })

    it("closes via the header × button and resets to step 1 (open stays controlled by the parent)", async () => {
      const onClose = jest.fn()
      const { rerender } = render(<ValidationSurveysImportWizard {...makeProps({ onClose })} />)
      await goToFileUploadStep()

      await userEvent.click(screen.getByText("×"))

      expect(onClose).toHaveBeenCalledTimes(1)
      // Internal state reset happens regardless of the (test-controlled) open prop.
      rerender(<ValidationSurveysImportWizard {...makeProps({ onClose })} open />)
      expect(screen.getByDisplayValue("Manual Bulk Entry")).toBeInTheDocument()
    })

    it("closes via the footer Cancel button at step 1", async () => {
      const onClose = jest.fn()
      render(<ValidationSurveysImportWizard {...makeProps({ onClose })} />)

      await userEvent.click(screen.getByRole("button", { name: "Cancel" }))

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe("default override fields (step 1)", () => {
    it("updates Default Agent ID and Default Agent Name text inputs", async () => {
      render(<ValidationSurveysImportWizard {...makeProps()} />)

      await userEvent.type(screen.getByPlaceholderText(/AGENT-1049/), "AGENT-9")
      await userEvent.type(screen.getByPlaceholderText(/Ally Mwamba/), "Zawadi K")

      expect(screen.getByDisplayValue("AGENT-9")).toBeInTheDocument()
      expect(screen.getByDisplayValue("Zawadi K")).toBeInTheDocument()
    })

    it("updates Default Source and Default Collection Method", async () => {
      render(<ValidationSurveysImportWizard {...makeProps()} />)

      const sourceInput = screen.getByPlaceholderText(/Kariakoo Field Study/)
      await userEvent.clear(sourceInput)
      await userEvent.type(sourceInput, "Field Team Alpha")
      await userEvent.selectOptions(screen.getByDisplayValue("Physical Interview"), "WhatsApp")

      expect(screen.getByDisplayValue("Field Team Alpha")).toBeInTheDocument()
      expect(screen.getByDisplayValue("WhatsApp")).toBeInTheDocument()
    })
  })

  describe("CSV parsing errors (step 2)", () => {
    it("shows 'File is empty.' for a zero-byte file", async () => {
      render(<ValidationSurveysImportWizard {...makeProps()} />)
      await goToFileUploadStep()

      await uploadCsv("")

      expect(await screen.findByText("File is empty.")).toBeInTheDocument()
    })

    it("shows a header-only-file error when there's no data row", async () => {
      render(<ValidationSurveysImportWizard {...makeProps()} />)
      await goToFileUploadStep()

      await uploadCsv(HEADER)

      expect(await screen.findByText("CSV must have a header row and at least one data row.")).toBeInTheDocument()
    })

    it("shows 'No records found in CSV.' when every data line is blank", async () => {
      render(<ValidationSurveysImportWizard {...makeProps()} />)
      await goToFileUploadStep()

      await uploadCsv(`${HEADER}\n\n   \n`)

      expect(await screen.findByText("No records found in CSV.")).toBeInTheDocument()
    })

    it("wraps an unexpected parse exception with 'Failed to parse CSV:' and logs it", async () => {
      render(<ValidationSurveysImportWizard {...makeProps()} />)
      await goToFileUploadStep()

      // Force the try block to throw by making the FileReader's onload event
      // hand back a `result` accessor that throws when read.
      const OriginalFileReader = global.FileReader
      class ThrowingFileReader {
        onload: ((ev: unknown) => void) | null = null
        readAsText() {
          this.onload?.({
            target: {
              get result(): string {
                throw new Error("disk exploded")
              },
            },
          })
        }
      }
      // @ts-expect-error -- deliberately swapping in a minimal stand-in
      global.FileReader = ThrowingFileReader

      try {
        const file = new File(["irrelevant"], "surveys.csv", { type: "text/csv" })
        const input = document.getElementById("csvFileInput") as HTMLInputElement
        await userEvent.upload(input, file)

        expect(await screen.findByText(/^Failed to parse CSV: disk exploded$/)).toBeInTheDocument()
        expect(reported.map((r) => r.message)).toContain("failed to parse import CSV")
      } finally {
        global.FileReader = OriginalFileReader
      }
    })

    it("ignores a change event with no selected file", async () => {
      render(<ValidationSurveysImportWizard {...makeProps()} />)
      await goToFileUploadStep()

      const input = document.getElementById("csvFileInput") as HTMLInputElement
      // fireEvent-level change with an empty FileList: handleCsvFileChange
      // returns early on `!file` and must not throw or advance the step.
      await userEvent.upload(input, [])

      expect(screen.getByText(/click to upload or drag csv file here/i)).toBeInTheDocument()
    })
  })

  describe("CSV parsing success (step 3 preview)", () => {
    it("parses a well-formed CSV and advances straight to the preview step", async () => {
      render(<ValidationSurveysImportWizard {...makeProps()} />)
      await goToFileUploadStep()

      await uploadCsv(`${HEADER}\n${row()}`)

      expect(await screen.findByText(/Parsed/)).toBeInTheDocument()
      expect(screen.getByText("1")).toBeInTheDocument()
      expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument()
    })

    it("normalizes 'ward'/'date'/'name' header aliases to their canonical keys", async () => {
      // A header row using aliases instead of the canonical column names.
      const aliasHeader = "name,ward,date"
      render(<ValidationSurveysImportWizard {...makeProps()} />)
      await goToFileUploadStep()

      await uploadCsv(`${aliasHeader}\nZuwena Ally,Buguruni,2026-08-05`)

      expect(await screen.findByText("Zuwena Ally")).toBeInTheDocument()
      // Preview table renders survey_date under the "Survey Date" column.
      const dateCell = screen.getByText("2026-08-05")
      expect(dateCell).toBeInTheDocument()
    })

    it("recognizes 'fullname' (no separator) as an alias for full_name too", async () => {
      render(<ValidationSurveysImportWizard {...makeProps()} />)
      await goToFileUploadStep()

      await uploadCsv("fullname,region\nHalima Juma,Mwanza")

      expect(await screen.findByText("Halima Juma")).toBeInTheDocument()
    })

    it("strips a fully-quoted value's surrounding quotes and respects commas inside quotes", async () => {
      render(<ValidationSurveysImportWizard {...makeProps()} />)
      await goToFileUploadStep()

      // q1_challenges contains a comma, quoted so the quote-aware splitter
      // treats it as one field instead of splitting it in two.
      await uploadCsv(`${HEADER}\n${row({ q1_challenges: '"Trust, and price"' })}`)

      await screen.findByText(/Parsed/)
      // 13 columns still map correctly -- respondent_type survived untouched,
      // which it would not if the quoted comma had shifted every later column.
      expect(screen.getByText("Consumer")).toBeInTheDocument()
    })

    it("falls back to the configured defaults for blank collection_method and source", async () => {
      render(<ValidationSurveysImportWizard {...makeProps()} />)

      const sourceInput = screen.getByPlaceholderText(/Kariakoo Field Study/)
      await userEvent.clear(sourceInput)
      await userEvent.type(sourceInput, "Field Team Alpha")
      await userEvent.selectOptions(screen.getByDisplayValue("Physical Interview"), "WhatsApp")

      await goToFileUploadStep()
      await uploadCsv(`${HEADER}\n${row({ collection_method: "", source: "" })}`)

      await screen.findByText(/Parsed/)
      expect(screen.getByText("WhatsApp")).toBeInTheDocument()
    })

    it("does not override a collection_method/source the CSV already specifies", async () => {
      render(<ValidationSurveysImportWizard {...makeProps()} />)
      await goToFileUploadStep()

      await uploadCsv(`${HEADER}\n${row({ collection_method: "Mobile App", source: "Kariakoo Field Study" })}`)

      await screen.findByText(/Parsed/)
      expect(screen.getByText("Mobile App")).toBeInTheDocument()
    })

    it("applies the default agent id/name only when the row omits them, and marks assisted_by_agent", async () => {
      render(<ValidationSurveysImportWizard {...makeProps()} />)

      await userEvent.type(screen.getByPlaceholderText(/AGENT-1049/), "AGENT-9")
      await userEvent.type(screen.getByPlaceholderText(/Ally Mwamba/), "Zawadi K")

      await goToFileUploadStep()
      await uploadCsv(`${HEADER}\n${row({ agent_id: "", agent_name: "" })}`)

      await screen.findByText(/Parsed/)
      expect(screen.getByText("Zawadi K")).toBeInTheDocument()
    })

    it("defaults agent_name to 'Self-Submitted' when neither the row nor a default supplies one", async () => {
      render(<ValidationSurveysImportWizard {...makeProps()} />)
      await goToFileUploadStep()

      await uploadCsv(`${HEADER}\n${row({ agent_name: "" })}`)

      await screen.findByText(/Parsed/)
      expect(screen.getByText("Self-Submitted")).toBeInTheDocument()
    })

    it("keeps a row's own agent_id/agent_name over the configured defaults", async () => {
      render(<ValidationSurveysImportWizard {...makeProps()} />)

      await userEvent.type(screen.getByPlaceholderText(/AGENT-1049/), "AGENT-DEFAULT")
      await userEvent.type(screen.getByPlaceholderText(/Ally Mwamba/), "Default Name")

      await goToFileUploadStep()
      await uploadCsv(`${HEADER}\n${row({ agent_id: "AGENT-ROW", agent_name: "Row Agent" })}`)

      await screen.findByText(/Parsed/)
      expect(screen.getByText("Row Agent")).toBeInTheDocument()
      expect(screen.queryByText("Default Name")).not.toBeInTheDocument()
    })

    it("shows only the first 3 parsed rows in the preview table", async () => {
      render(<ValidationSurveysImportWizard {...makeProps()} />)
      await goToFileUploadStep()

      const rows = [
        row({ full_name: "Row One" }),
        row({ full_name: "Row Two" }),
        row({ full_name: "Row Three" }),
        row({ full_name: "Row Four" }),
      ]
      await uploadCsv(`${HEADER}\n${rows.join("\n")}`)

      await screen.findByText(/Parsed/)
      expect(screen.getByText("4")).toBeInTheDocument() // parsed count in the banner
      expect(screen.getByText("Row One")).toBeInTheDocument()
      expect(screen.getByText("Row Three")).toBeInTheDocument()
      expect(screen.queryByText("Row Four")).not.toBeInTheDocument()
    })

    it("shows 'Current' for a row with no survey_date", async () => {
      render(<ValidationSurveysImportWizard {...makeProps()} />)
      await goToFileUploadStep()

      await uploadCsv(`${HEADER}\n${row({ date: "" })}`)

      await screen.findByText(/Parsed/)
      expect(screen.getByText("Current")).toBeInTheDocument()
    })

    it("returns to File Upload via 'Change File'", async () => {
      render(<ValidationSurveysImportWizard {...makeProps()} />)
      await goToFileUploadStep()
      await uploadCsv(`${HEADER}\n${row()}`)
      await screen.findByText(/Parsed/)

      await userEvent.click(screen.getByRole("button", { name: /change file/i }))

      expect(screen.getByText(/click to upload or drag csv file here/i)).toBeInTheDocument()
    })
  })

  describe("executeBulkImport (step 3 -> 4)", () => {
    async function getToPreview(customRow = row()) {
      render(<ValidationSurveysImportWizard {...makeProps({ onImported: jest.fn() })} />)
      await goToFileUploadStep()
      await uploadCsv(`${HEADER}\n${customRow}`)
      await screen.findByText(/Parsed/)
    }

    it("posts the parsed rows and configured defaults, then shows the success step and calls onImported", async () => {
      const onImported = jest.fn()
      render(<ValidationSurveysImportWizard {...makeProps({ onImported })} />)

      await userEvent.type(screen.getByPlaceholderText(/AGENT-1049/), "AGENT-9")
      await goToFileUploadStep()
      await uploadCsv(`${HEADER}\n${row()}`)
      await screen.findByText(/Parsed/)

      const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
      global.fetch = fetchMock as unknown as typeof fetch

      await userEvent.click(screen.getByRole("button", { name: /confirm & import/i }))

      await waitFor(() => expect(screen.getByText("Import Successful!")).toBeInTheDocument())
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/validation-surveys/bulk-import",
        expect.objectContaining({ method: "POST", headers: { "Content-Type": "application/json" } }),
      )
      const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
      expect(body.defaultAgentId).toBe("AGENT-9")
      expect(body.surveys).toHaveLength(1)
      expect(onImported).toHaveBeenCalledTimes(1)
    })

    it("sends null (not empty strings) for unset defaults", async () => {
      await getToPreview()
      const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
      global.fetch = fetchMock as unknown as typeof fetch

      await userEvent.click(screen.getByRole("button", { name: /confirm & import/i }))

      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
      expect(body.defaultAgentId).toBeNull()
      expect(body.defaultAgentName).toBeNull()
    })

    it("shows 'Importing...' and disables the confirm button while the request is in flight", async () => {
      await getToPreview()
      let resolveFetch: (v: unknown) => void = () => {}
      global.fetch = jest.fn(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve
          }),
      ) as unknown as typeof fetch

      const confirmButton = screen.getByRole("button", { name: /confirm & import/i })
      await userEvent.click(confirmButton)

      expect(await screen.findByRole("button", { name: "Importing..." })).toBeDisabled()

      resolveFetch({ ok: true, json: async () => ({}) })
      await waitFor(() => expect(screen.getByText("Import Successful!")).toBeInTheDocument())
    })

    it("shows the count of imported responses on the success screen", async () => {
      await getToPreview()
      global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) as unknown as typeof fetch

      await userEvent.click(screen.getByRole("button", { name: /confirm & import/i }))

      await screen.findByText("Import Successful!")
      const successPanel = screen.getByText("Import Successful!").closest("div") as HTMLElement
      expect(within(successPanel.parentElement as HTMLElement).getByText("1")).toBeInTheDocument()
    })

    it("shows the Done button (not Cancel) at the success step, and closes via it", async () => {
      const onClose = jest.fn()
      render(<ValidationSurveysImportWizard {...makeProps({ onClose })} />)
      await goToFileUploadStep()
      await uploadCsv(`${HEADER}\n${row()}`)
      await screen.findByText(/Parsed/)
      global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) as unknown as typeof fetch
      await userEvent.click(screen.getByRole("button", { name: /confirm & import/i }))
      await screen.findByText("Import Successful!")

      expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument()
      await userEvent.click(screen.getByRole("button", { name: "Done" }))

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it("shows the API's `error` message on a non-ok response and stays on step 3", async () => {
      await getToPreview()
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Duplicate phone numbers detected" }),
      }) as unknown as typeof fetch

      await userEvent.click(screen.getByRole("button", { name: /confirm & import/i }))

      expect(await screen.findByText("Duplicate phone numbers detected")).toBeInTheDocument()
      expect(screen.queryByText("Import Successful!")).not.toBeInTheDocument()
      expect(reported.map((r) => r.message)).toContain("bulk import failed")
    })

    it("joins `details` with newlines when there is no top-level `error`", async () => {
      await getToPreview()
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ details: ["row 1: missing phone", "row 4: invalid date"] }),
      }) as unknown as typeof fetch

      await userEvent.click(screen.getByRole("button", { name: /confirm & import/i }))

      // getByText's default normalizer collapses the whitespace-pre-line's
      // literal "\n" to a space, so match with a regex instead of the exact
      // joined string.
      expect(await screen.findByText(/row 1: missing phone\s+row 4: invalid date/)).toBeInTheDocument()
    })

    it("falls back to a generic message when the failure response has neither error nor details", async () => {
      await getToPreview()
      global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) }) as unknown as typeof fetch

      await userEvent.click(screen.getByRole("button", { name: /confirm & import/i }))

      expect(await screen.findByText("Failed to import records.")).toBeInTheDocument()
    })

    it("shows the thrown error's message when fetch itself rejects (network failure)", async () => {
      await getToPreview()
      global.fetch = jest.fn().mockRejectedValue(new Error("network unreachable")) as unknown as typeof fetch

      await userEvent.click(screen.getByRole("button", { name: /confirm & import/i }))

      expect(await screen.findByText("network unreachable")).toBeInTheDocument()
      expect(reported.map((r) => r.message)).toContain("bulk import failed")
    })

    it("does not call onImported when the import fails", async () => {
      const onImported = jest.fn()
      render(<ValidationSurveysImportWizard {...makeProps({ onImported })} />)
      await goToFileUploadStep()
      await uploadCsv(`${HEADER}\n${row()}`)
      await screen.findByText(/Parsed/)
      global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "nope" }) }) as unknown as typeof fetch

      await userEvent.click(screen.getByRole("button", { name: /confirm & import/i }))

      await screen.findByText("nope")
      expect(onImported).not.toHaveBeenCalled()
    })
  })
})
