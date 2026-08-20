"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, FileSpreadsheet, ShieldCheck, Upload } from "lucide-react"
import { logger, normalizeError } from "@/lib/logger"

const log = logger.child("admin.validation-surveys-import")

/**
 * One CSV row after header normalization. Values arrive as strings; the
 * `assisted_by_agent` flag is derived locally, hence the boolean.
 */
type ParsedSurveyRow = Record<string, string | boolean>

interface ValidationSurveysImportWizardProps {
  open: boolean
  /** Closes the wizard and resets its internal step/errors. */
  onClose: () => void
  /** Called after a successful import so the parent can refetch. */
  onImported: () => void
}

/**
 * Multi-step bulk-import wizard for market-validation surveys: pick a CSV,
 * review the parsed rows, set defaults for the columns the CSV omits, then
 * POST to /api/admin/validation-surveys/bulk-import.
 *
 * Extracted from components/admin/validation-surveys-tab.tsx, which held its
 * state, its CSV parser and ~180 lines of modal markup inline.
 */
export function ValidationSurveysImportWizard({ open, onClose, onImported }: ValidationSurveysImportWizardProps) {
  const [importStep, setImportStep] = useState(1)
  const [importError, setImportError] = useState<string | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedSurveyRow[]>([])

  // Default values configurables
  const [defaultAgentId, setDefaultAgentId] = useState("")
  const [defaultAgentName, setDefaultAgentName] = useState("")
  const [defaultSource, setDefaultSource] = useState("Manual Bulk Entry")
  const [defaultCollectionMethod, setDefaultCollectionMethod] = useState("Physical Interview")
  const [isImporting, setIsImporting] = useState(false)

  const closeImportWizard = () => {
    onClose()
    setImportStep(1)
    setImportError(null)
    setParsedRows([])
  }

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportError(null)
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        if (!text) {
          setImportError("File is empty.")
          return
        }

        const lines = text.split(/\r?\n/)
        if (lines.length < 2) {
          setImportError("CSV must have a header row and at least one data row.")
          return
        }

        // Quote-aware CSV line parsing
        const parseCsvLine = (line: string) => {
          const result = []
          let cur = ""
          let inQuotes = false
          for (let i = 0; i < line.length; i++) {
            const char = line[i]
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === "," && !inQuotes) {
              result.push(cur.trim())
              cur = ""
            } else {
              cur += char
            }
          }
          result.push(cur.trim())
          return result
        }

        const rawHeaders = parseCsvLine(lines[0])
        const headers = rawHeaders.map((h) =>
          h
            .toLowerCase()
            .trim()
            .replace(/[\s_]+/g, "_"),
        )

        const parsed: ParsedSurveyRow[] = []
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          const values = parseCsvLine(line)
          const record: ParsedSurveyRow = {}

          headers.forEach((header, index) => {
            let val: string | undefined = values[index]
            if (val === undefined) val = ""

            if (typeof val === "string" && val.startsWith('"') && val.endsWith('"')) {
              val = val.slice(1, -1)
            }

            let key = header
            if (header === "ward") key = "location_ward"
            if (header === "fullname" || header === "name") key = "full_name"
            if (header === "date") key = "survey_date"

            record[key] = val
          })

          // Defaults overrides
          if (!record.collection_method) record.collection_method = defaultCollectionMethod
          if (!record.source) record.source = defaultSource
          if (!record.agent_id && defaultAgentId) record.agent_id = defaultAgentId
          if (!record.agent_name && defaultAgentName) record.agent_name = defaultAgentName
          record.agent_name = record.agent_name || "Self-Submitted"
          record.assisted_by_agent = !!(record.agent_name && record.agent_name !== "Self-Submitted")

          parsed.push(record)
        }

        if (parsed.length === 0) {
          setImportError("No records found in CSV.")
          return
        }

        setParsedRows(parsed)
        setImportStep(3)
      } catch (err) {
        log.error("failed to parse import CSV", err)
        setImportError(`Failed to parse CSV: ${normalizeError(err).message}`)
      }
    }
    reader.readAsText(file)
  }

  const executeBulkImport = async () => {
    setIsImporting(true)
    setImportError(null)
    try {
      const res = await fetch("/api/admin/validation-surveys/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surveys: parsedRows,
          defaultAgentId: defaultAgentId || null,
          defaultAgentName: defaultAgentName || null,
          defaultSource: defaultSource || null,
          defaultCollectionMethod: defaultCollectionMethod || null,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || json.details?.join("\n") || "Failed to import records.")
      }

      setImportStep(4)
      onImported() // Refresh dashboard items immediately!
    } catch (err) {
      log.error("bulk import failed", err)
      setImportError(normalizeError(err).message)
    } finally {
      setIsImporting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out] p-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-[scale-up_0.2s_ease-out]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary animate-bounce" />
              Bulk Import Survey Wizard
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Parse, map override parameters, and securely batch insert validation surveys.</p>
          </div>
          <button onClick={closeImportWizard} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition">
            <span className="text-xl font-semibold">&times;</span>
          </button>
        </div>

        {/* Wizard Steps */}
        <div className="px-6 py-3 bg-indigo-50/40 border-b border-slate-100 grid grid-cols-4 gap-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <span className={`${importStep === 1 ? "text-indigo-600 font-extrabold" : importStep > 1 ? "text-indigo-400" : ""}`}>
            1. Defaults
          </span>
          <span className={`${importStep === 2 ? "text-indigo-600 font-extrabold" : importStep > 2 ? "text-indigo-400" : ""}`}>
            2. File Upload
          </span>
          <span className={`${importStep === 3 ? "text-indigo-600 font-extrabold" : importStep > 3 ? "text-indigo-400" : ""}`}>
            3. Preview
          </span>
          <span className={`${importStep === 4 ? "text-indigo-600 font-extrabold" : ""}`}>4. Finish</span>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* STEP 1: Default Override Params */}
          {importStep === 1 && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-xs text-slate-500 leading-relaxed">
                Configure fallback defaults. If the uploaded CSV file doesn't specify these columns or leaves them blank, they will
                automatically default to these configured values.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Default Agent ID</label>
                  <Input
                    placeholder="e.g. AGENT-1049"
                    value={defaultAgentId}
                    onChange={(e) => setDefaultAgentId(e.target.value)}
                    className="rounded-xl border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Default Agent Name</label>
                  <Input
                    placeholder="e.g. Ally Mwamba"
                    value={defaultAgentName}
                    onChange={(e) => setDefaultAgentName(e.target.value)}
                    className="rounded-xl border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Default Source</label>
                  <Input
                    placeholder="e.g. Kariakoo Field Study"
                    value={defaultSource}
                    onChange={(e) => setDefaultSource(e.target.value)}
                    className="rounded-xl border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Default Collection Method</label>
                  <select
                    value={defaultCollectionMethod}
                    onChange={(e) => setDefaultCollectionMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="Physical Interview">Physical Interview</option>
                    <option value="Phone Interview">Phone Interview</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Website">Website</option>
                    <option value="Mobile App">Mobile App</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Drag and drop select file */}
          {importStep === 2 && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition"
                onClick={() => document.getElementById("csvFileInput")?.click()}
              >
                <input id="csvFileInput" type="file" accept=".csv" className="hidden" onChange={handleCsvFileChange} />
                <div className="h-14 w-14 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                  <FileSpreadsheet className="h-7 w-7 text-indigo-600" />
                </div>
                <h4 className="text-sm font-semibold text-slate-900">Click to upload or drag CSV file here</h4>
                <p className="text-xs text-slate-400 mt-1">Accepts standard comma-separated UTF-8 `.csv` files.</p>
              </div>

              {importError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 leading-relaxed font-semibold whitespace-pre-line">
                  {importError}
                </div>
              )}

              <div className="text-xs text-slate-500">
                <span className="font-bold text-slate-600 block mb-1">CSV Template Columns Required:</span>
                <div className="font-mono text-[9px] bg-slate-100 p-2.5 rounded-lg leading-normal select-all break-all text-slate-600">
                  full_name, phone, email, region, district, location_ward, respondent_type, survey_date, collection_method, source,
                  agent_id, agent_name, q1_challenges, q2_biggest_challenge, q3_impact_rating, q4_time_searching, q5_lost_money,
                  q6_channels, q7_satisfaction_rating, q8_platform_value_rating, q9_escrow_importance, q10_buyer_protection_importance,
                  q11_otp_reduces_disputes, q12_nearby_suppliers_frequency, q13_willing_to_pay, q14_payment_amount, q15_choice_and_reason
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Preview Data Grid */}
          {importStep === 3 && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex justify-between items-center">
                <span>
                  Parsed <strong className="font-extrabold">{parsedRows.length}</strong> survey responses from file successfully!
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setImportStep(2)}
                  className="h-7 text-[10px] text-emerald-800 hover:bg-emerald-100 rounded-lg"
                >
                  Change File
                </Button>
              </div>

              {importError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 leading-relaxed font-semibold whitespace-pre-line">
                  {importError}
                </div>
              )}

              <div>
                <span className="text-xs font-bold text-slate-500 block mb-1.5">Data Mapping Preview (First 3 Records)</span>
                <div className="overflow-x-auto border rounded-xl bg-white max-h-[30vh]">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b">
                        <th className="px-3 py-2 font-semibold text-slate-600">Respondent Name</th>
                        <th className="px-3 py-2 font-semibold text-slate-600">Region</th>
                        <th className="px-3 py-2 font-semibold text-slate-600">Respondent Type</th>
                        <th className="px-3 py-2 font-semibold text-slate-600">Survey Date</th>
                        <th className="px-3 py-2 font-semibold text-slate-600">Collection Method</th>
                        <th className="px-3 py-2 font-semibold text-slate-600">Agent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.slice(0, 3).map((r, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="px-3 py-2 font-medium">{r.full_name}</td>
                          <td className="px-3 py-2 text-slate-500">{r.region}</td>
                          <td className="px-3 py-2">
                            <Badge variant="outline">{r.respondent_type}</Badge>
                          </td>
                          <td className="px-3 py-2 text-slate-500">{r.survey_date || "Current"}</td>
                          <td className="px-3 py-2 text-slate-500">{r.collection_method}</td>
                          <td className="px-3 py-2 text-slate-500">{r.agent_name || "Self-Submitted"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Success state */}
          {importStep === 4 && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center animate-ping">
                <ShieldCheck className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center absolute">
                <ShieldCheck className="h-8 w-8 text-emerald-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Import Successful!</h4>
              <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                Successfully saved <strong className="font-extrabold text-slate-900">{parsedRows.length}</strong> validation survey
                responses to the database in a secure transaction.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            {importStep > 1 && importStep < 4 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setImportStep((prev) => prev - 1)
                  setImportError(null)
                }}
                className="rounded-xl"
              >
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={closeImportWizard} className="rounded-xl text-slate-500 hover:text-slate-900">
              {importStep === 4 ? "Done" : "Cancel"}
            </Button>
            {importStep === 1 && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setImportStep(2)}
                className="rounded-xl bg-primary text-white hover:bg-primary/95 transition"
              >
                Choose File
              </Button>
            )}
            {importStep === 3 && (
              <Button
                variant="default"
                size="sm"
                onClick={executeBulkImport}
                disabled={isImporting}
                className="rounded-xl bg-primary text-white hover:bg-primary/95 transition"
              >
                {isImporting ? "Importing..." : "Confirm & Import"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
