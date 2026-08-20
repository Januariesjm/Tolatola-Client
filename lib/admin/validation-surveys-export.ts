/**
 * CSV / Excel / print-to-PDF exporters for the market-validation surveys.
 *
 * Extracted verbatim from components/admin/validation-surveys-tab.tsx, where
 * they were ~207 lines of the same 952-line file. They only ever needed the
 * survey list, so they take it as an argument and are now unit-testable.
 *
 * Browser-only: they use Blob, URL.createObjectURL and window.open.
 */

import type { ValidationSurvey } from "./validation-surveys-types"

export function exportSurveysToCsv(surveys: ValidationSurvey[]) {
  const filtered = surveys
  const headers = [
    "#",
    "Survey Date",
    "Upload Date",
    "Full Name",
    "Phone",
    "Email",
    "Region",
    "District",
    "Ward",
    "Type",
    "Assisted by Agent",
    "Agent ID",
    "Agent Name",
    "Collection Method",
    "Source",
    "Created By",
    "Created At",
    "Updated By",
    "Updated At",
    "Q1-Challenges",
    "Q2-Biggest Challenge",
    "Q3-Impact",
    "Q4-Time Searching",
    "Q5-Lost Money",
    "Q6-Channels",
    "Q7-Satisfaction",
    "Q8-Platform Value",
    "Q9-Escrow",
    "Q10-Buyer Protection",
    "Q11-OTP",
    "Q12-Nearby Frequency",
    "Q13-Willing to Pay",
    "Q14-Amount",
    "Q15-Choice & Reason",
  ]
  const rows = filtered.map((s, i) => [
    i + 1,
    s.survey_date || "",
    s.upload_date || "",
    s.full_name,
    s.phone,
    s.email || "",
    s.region,
    s.district,
    s.location_ward,
    s.respondent_type,
    s.assisted_by_agent ? "Yes" : "No",
    s.agent_id || "",
    s.agent_name || "Self-Submitted",
    s.collection_method || "Website",
    s.source || "",
    s.created_by || "",
    s.created_at || "",
    s.updated_by || "",
    s.updated_at || "",
    s.q1_challenges,
    s.q2_biggest_challenge,
    s.q3_impact_rating,
    s.q4_time_searching,
    s.q5_lost_money,
    (s.q6_channels || []).join("; "),
    s.q7_satisfaction_rating,
    s.q8_platform_value_rating,
    s.q9_escrow_importance,
    s.q10_buyer_protection_importance,
    s.q11_otp_reduces_disputes,
    s.q12_nearby_suppliers_frequency,
    s.q13_willing_to_pay,
    s.q14_payment_amount,
    `"${(s.q15_choice_and_reason || "").replace(/"/g, '""')}"`,
  ])
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `tola-validation-surveys-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportSurveysToExcel(surveys: ValidationSurvey[]) {
  const filtered = surveys
  const headers = [
    "#",
    "Survey Date",
    "Upload Date",
    "Full Name",
    "Phone",
    "Email",
    "Region",
    "District",
    "Ward",
    "Type",
    "Assisted by Agent",
    "Agent ID",
    "Agent Name",
    "Collection Method",
    "Source",
    "Created By",
    "Created At",
    "Updated By",
    "Updated At",
    "Q1",
    "Q2",
    "Q3",
    "Q4",
    "Q5",
    "Q6",
    "Q7",
    "Q8",
    "Q9",
    "Q10",
    "Q11",
    "Q12",
    "Q13",
    "Q14",
    "Q15",
  ]
  const rows = filtered.map((s, i) => [
    i + 1,
    s.survey_date || "",
    s.upload_date || "",
    s.full_name,
    s.phone,
    s.email || "",
    s.region,
    s.district,
    s.location_ward,
    s.respondent_type,
    s.assisted_by_agent ? "Yes" : "No",
    s.agent_id || "",
    s.agent_name || "Self-Submitted",
    s.collection_method || "Website",
    s.source || "",
    s.created_by || "",
    s.created_at || "",
    s.updated_by || "",
    s.updated_at || "",
    s.q1_challenges,
    s.q2_biggest_challenge,
    s.q3_impact_rating,
    s.q4_time_searching,
    s.q5_lost_money,
    (s.q6_channels || []).join("; "),
    s.q7_satisfaction_rating,
    s.q8_platform_value_rating,
    s.q9_escrow_importance,
    s.q10_buyer_protection_importance,
    s.q11_otp_reduces_disputes,
    s.q12_nearby_suppliers_frequency,
    s.q13_willing_to_pay,
    s.q14_payment_amount,
    s.q15_choice_and_reason,
  ])
  let table = "<table><tr>" + headers.map((h) => `<th>${h}</th>`).join("") + "</tr>"
  rows.forEach((r) => {
    table += "<tr>" + r.map((c) => `<td>${c ?? ""}</td>`).join("") + "</tr>"
  })
  table += "</table>"
  const blob = new Blob([`<html><head><meta charset="utf-8"></head><body>${table}</body></html>`], { type: "application/vnd.ms-excel" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `tola-validation-surveys-${new Date().toISOString().slice(0, 10)}.xls`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportSurveysToPdf(surveys: ValidationSurvey[]) {
  const filtered = surveys
  const win = window.open("", "_blank")
  if (!win) return

  const headers = [
    "#",
    "Survey Date",
    "Upload Date",
    "Full Name",
    "Phone",
    "Email",
    "Region",
    "District",
    "Ward",
    "Type",
    "Assisted by Agent",
    "Agent ID",
    "Agent Name",
    "Collection Method",
    "Source",
    "Created By",
    "Created At",
    "Updated By",
    "Updated At",
    "Q1",
    "Q2",
    "Q3",
    "Q4",
    "Q5",
    "Q6",
    "Q7",
    "Q8",
    "Q9",
    "Q10",
    "Q11",
    "Q12",
    "Q13",
    "Q14",
    "Q15",
  ]

  const headerCols = headers.map((h) => `<th>${h}</th>`).join("")

  const rows = filtered
    .map((s, i) => {
      const cols = [
        i + 1,
        s.survey_date || "",
        s.upload_date ? new Date(s.upload_date).toLocaleDateString() : "",
        s.full_name,
        s.phone,
        s.email || "",
        s.region,
        s.district,
        s.location_ward,
        s.respondent_type,
        s.assisted_by_agent ? "Yes" : "No",
        s.agent_id || "",
        s.agent_name || "Self-Submitted",
        s.collection_method || "Website",
        s.source || "",
        s.created_by || "",
        s.created_at ? new Date(s.created_at).toLocaleDateString() : "",
        s.updated_by || "",
        s.updated_at ? new Date(s.updated_at).toLocaleDateString() : "",
        s.q1_challenges,
        s.q2_biggest_challenge,
        s.q3_impact_rating,
        s.q4_time_searching,
        s.q5_lost_money,
        (s.q6_channels || []).join("; "),
        s.q7_satisfaction_rating,
        s.q8_platform_value_rating,
        s.q9_escrow_importance,
        s.q10_buyer_protection_importance,
        s.q11_otp_reduces_disputes,
        s.q12_nearby_suppliers_frequency,
        s.q13_willing_to_pay,
        s.q14_payment_amount,
        s.q15_choice_and_reason,
      ]
      return `<tr>${cols.map((c) => `<td>${c ?? ""}</td>`).join("")}</tr>`
    })
    .join("")

  win.document.write(`<!DOCTYPE html><html><head><title>TOLA Validation Surveys Report</title>
      <style>
        @page {
          size: A3 landscape;
          margin: 5mm;
        }
        body {
          font-family: sans-serif;
          padding: 10px;
          margin: 0;
          font-size: 8px;
        }
        h1 {
          font-size: 16px;
          margin: 0 0 4px 0;
        }
        p {
          color: #666;
          font-size: 9px;
          margin: 0 0 10px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          table-layout: auto;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 3px 4px;
          text-align: left;
          font-size: 7px;
          word-break: break-word;
          max-width: 120px;
        }
        th {
          background: #f5f5f5;
          font-weight: 600;
          white-space: nowrap;
        }
        tr:nth-child(even) {
          background: #fafafa;
        }
      </style></head>
      <body><h1>TOLA Market Validation Survey Report</h1>
      <p>Generated: ${new Date().toLocaleString()} | Total: ${filtered.length} responses</p>
      <table><thead><tr>${headerCols}</tr></thead>
      <tbody>${rows}</tbody></table></body></html>`)
  win.document.close()
  setTimeout(() => {
    win.print()
  }, 500)
}
