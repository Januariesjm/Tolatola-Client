 "use client"

import { useEffect, useState } from "react"

export default function AdminVerifyPage() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const verifySetup = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/verify")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error("Error verifying setup:", error)
      setStatus({ setup: { status: "error", message: "Failed to verify setup" } })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void verifySetup()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-slate-600">Verifying admin system setup...</p>
      </div>
    )
  }

  const isSuccess = status?.setup?.status === "success"

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6">
        <div
          className={`rounded-2xl border px-6 py-4 ${
            isSuccess ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Admin system setup status
              </p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {isSuccess ? "Configuration looks healthy" : "Attention required"}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {status?.setup?.message}
                {status?.timestamp && <span className="ml-1">• Verified at {status.timestamp}</span>}
              </p>
            </div>
            <button
              type="button"
              onClick={verifySetup}
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {isSuccess && status?.statistics && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-500">Total roles</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{status.statistics.totalRoles}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-500">Total admins assigned</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{status.statistics.totalAdmins}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
