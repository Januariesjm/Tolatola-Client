"use client"

import { useEffect, useState } from "react"
import { logger } from "@/lib/logger"
import { defaultStats, type SurveyStats, type ValidationSurvey } from "@/lib/admin/validation-surveys-types"

const log = logger.child("admin.validation-surveys-tab")

/**
 * Data fetching and filter state for the validation-surveys admin tab.
 *
 * Extracted from components/admin/validation-surveys-tab.tsx, which mixed
 * this with the table/filter-panel markup. The two effects mirror the
 * original exactly: a filter change (type, region, or either date range)
 * refetches immediately, while search/agent text is debounced 450ms so
 * every keystroke doesn't issue a request.
 */
export function useValidationSurveys(initialSurveys: ValidationSurvey[] = [], initialStats?: SurveyStats) {
  const [surveys, setSurveys] = useState<ValidationSurvey[]>(initialSurveys)
  const [stats, setStats] = useState<SurveyStats>(initialStats || defaultStats)
  const [loading, setLoading] = useState(!initialSurveys.length)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isImportOpen, setIsImportOpen] = useState(false)

  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [regionFilter, setRegionFilter] = useState("all")
  const [agentFilter, setAgentFilter] = useState("")
  const [surveyFrom, setSurveyFrom] = useState("")
  const [surveyTo, setSurveyTo] = useState("")
  const [uploadFrom, setUploadFrom] = useState("")
  const [uploadTo, setUploadTo] = useState("")

  const fetchSurveys = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.append("search", search)
      if (typeFilter && typeFilter !== "all") params.append("type", typeFilter)
      if (surveyFrom) params.append("survey_from", surveyFrom)
      if (surveyTo) params.append("survey_to", surveyTo)
      if (uploadFrom) params.append("upload_from", uploadFrom)
      if (uploadTo) params.append("upload_to", uploadTo)
      if (regionFilter && regionFilter !== "all") params.append("region", regionFilter)
      if (agentFilter.trim()) params.append("agent", agentFilter)

      const res = await fetch(`/api/admin/validation-surveys?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setSurveys(json.data || [])
        setStats(json.stats || defaultStats)
      }
    } catch (e) {
      log.error("failed to fetch surveys", e)
    } finally {
      setLoading(false)
    }
  }

  // Trigger search on filter changes
  useEffect(() => {
    fetchSurveys()
  }, [typeFilter, surveyFrom, surveyTo, uploadFrom, uploadTo, regionFilter])

  // Debounced trigger on search/agent queries
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSurveys()
    }, 450)
    return () => clearTimeout(timer)
  }, [search, agentFilter])

  const resetFilters = () => {
    setSearch("")
    setTypeFilter("all")
    setRegionFilter("all")
    setAgentFilter("")
    setSurveyFrom("")
    setSurveyTo("")
    setUploadFrom("")
    setUploadTo("")
  }

  return {
    surveys,
    stats,
    loading,
    expandedId,
    setExpandedId,
    isImportOpen,
    setIsImportOpen,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    regionFilter,
    setRegionFilter,
    agentFilter,
    setAgentFilter,
    surveyFrom,
    setSurveyFrom,
    surveyTo,
    setSurveyTo,
    uploadFrom,
    setUploadFrom,
    uploadTo,
    setUploadTo,
    fetchSurveys,
    resetFilters,
  }
}
