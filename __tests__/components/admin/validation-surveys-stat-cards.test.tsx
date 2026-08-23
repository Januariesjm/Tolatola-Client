/**
 * Tests for ValidationSurveysStatCards (components/admin/validation-surveys-stat-cards.tsx).
 *
 * Purely presentational -- pinning that all ten cards render with the given
 * stats, including the percentage-suffixed ones.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import { ValidationSurveysStatCards } from "@/components/admin/validation-surveys-stat-cards"
import { defaultStats } from "@/lib/admin/validation-surveys-types"

describe("ValidationSurveysStatCards", () => {
  it("renders every stat card's label", () => {
    render(<ValidationSurveysStatCards stats={defaultStats} />)

    expect(screen.getByText("Total Responses")).toBeInTheDocument()
    expect(screen.getByText("Consumers")).toBeInTheDocument()
    expect(screen.getByText("Vendors")).toBeInTheDocument()
    expect(screen.getByText("Transporters")).toBeInTheDocument()
    expect(screen.getByText("Trust Problem")).toBeInTheDocument()
    expect(screen.getByText("Info Gap")).toBeInTheDocument()
    expect(screen.getByText("Digital Adoption")).toBeInTheDocument()
    expect(screen.getByText("Willing to Pay")).toBeInTheDocument()
    expect(screen.getByText("Escrow Acceptance")).toBeInTheDocument()
    expect(screen.getByText("Buyer Protection")).toBeInTheDocument()
  })

  it("shows a raw count for the total-responses card", () => {
    render(<ValidationSurveysStatCards stats={{ ...defaultStats, totalResponses: 42 }} />)

    expect(screen.getByText("42")).toBeInTheDocument()
  })

  it("suffixes a percentage stat with %", () => {
    render(<ValidationSurveysStatCards stats={{ ...defaultStats, trustProblemPct: 67 }} />)

    expect(screen.getByText("67%")).toBeInTheDocument()
  })
})
