// <NEW FILE> Admin verification status page
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

export default function AdminVerifyPage() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    verifySetup()
  }, [])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Verifying admin system setup...</p>
      </div>
    )
  }

  const isSuccess = status?.setup?.status === "success"

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isSuccess ? (
                <CheckCircle className="text-green-500" />
              ) : (
                <AlertCircle className="text-red-500" />
              )}
              Admin System Setup Status
            </CardTitle>
            <CardDescription>Verification performed at {status?.timestamp}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold">Status: {status?.setup?.status.toUpperCase()}</p>
              <p className="text-sm text-muted-foreground mt-1">{status?.setup?.message}</p>
            </div>

            <div className="flex gap-2">
              <Button onClick={verifySetup} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Verification
              </Button>
            </div>
          </CardContent>
        </Card>

        {isSuccess && status?.statistics && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Admin System Statistics</CardTitle>
                <CardDescription>Current state of your admin setup</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Roles</p>
                    <p className="text-2xl font-bold">{status.statistics.totalRoles}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Admins Assigned</p>
                    <p className="text-2xl font-bold">{status.statistics.totalAdmins}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Roles Overview</CardTitle>
                <CardDescription>All available admin roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {status.statistics.roles.map((role: any) => (
                    <div key={role.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{role.role_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {status.statistics.adminsByRole[role.role_name] || 0} admin(s) assigned
                        </p>
                      </div>
                      <Badge variant="default">{role.access_level}% Access</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Admin Users</CardTitle>
                <CardDescription>All users with admin roles</CardDescription>
              </CardHeader>
              <CardContent>
                {status.statistics.admins.length > 0 ? (
                  <div className="space-y-3">
                    {status.statistics.admins.map((admin: any) => (
                      <div key={admin.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{admin.email}</p>
                          <p className="text-sm text-muted-foreground">{admin.admin_roles?.role_name}</p>
                        </div>
                        <Badge variant="secondary">{admin.admin_roles?.access_level}%</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No admin users assigned yet</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
