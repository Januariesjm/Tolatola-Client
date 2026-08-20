"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts"
import type { ValidationSurvey } from "@/lib/admin/validation-surveys-types"

interface ValidationSurveysTrendChartProps {
  surveys: ValidationSurvey[]
}

/**
 * Submissions-per-day area chart for the last 15 days with responses.
 *
 * Buckets by `survey_date` (when the survey was actually conducted), falling
 * back to `created_at` for rows recorded before that column existed. Renders
 * nothing when there is no data.
 */
export function ValidationSurveysTrendChart({ surveys }: ValidationSurveysTrendChartProps) {
  const trendData = useMemo(() => {
    const datesMap: Record<string, number> = {}
    surveys.forEach((s) => {
      const dateStr = s.survey_date ? s.survey_date.split("T")[0] : new Date(s.created_at).toISOString().split("T")[0]
      datesMap[dateStr] = (datesMap[dateStr] || 0) + 1
    })

    return Object.entries(datesMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-15) // last 15 days for a clean grid layout
  }, [surveys])

  if (trendData.length === 0) return null

  return (
    <Card className="shadow-sm border border-slate-100 bg-white/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Response Submissions Trend (by Survey Conducted Date)
        </CardTitle>
      </CardHeader>
      <CardContent className="h-44 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              labelStyle={{ fontWeight: "bold", fontSize: "10px", color: "#1e293b" }}
              itemStyle={{ fontSize: "11px", color: "#4f46e5" }}
            />
            <Area
              type="monotone"
              dataKey="count"
              name="Surveys Conducted"
              stroke="#4f46e5"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCount)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
