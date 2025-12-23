"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Plus, Shield, History, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { RevokeAdminDialog } from "./revoke-admin-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { clientApiGet, clientApiPost } from "@/lib/api-client"

export function AdminUsersManagementTab() {
  const { toast } = useToast()
  const router = useRouter()
  const [admins, setAdmins] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [revokedHistory, setRevokedHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedRoleId, setSelectedRoleId] = useState("")
  const [revokeDialog, setRevokeDialog] = useState<{
    open: boolean
    userId: string
    userName: string
    userEmail: string
  }>({
    open: false,
    userId: "",
    userName: "",
    userEmail: "",
  })
  const [isRevoking, setIsRevoking] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [rolesRes, adminsRes, usersRes, historyRes] = await Promise.all([
        clientApiGet<{ roles: any[] }>("admin/roles"),
        clientApiGet<{ admins: any[] }>("admin/users"),
        clientApiGet<{ data: any[] }>("admin/users-all"),
        clientApiGet<{ data: any[] }>("admin/revoke-history").catch(() => ({ data: [] })),
      ])

      setRoles(rolesRes.roles || [])
      setAdmins(adminsRes.admins || [])
      setAllUsers(usersRes.data || [])
      setRevokedHistory(historyRes.data || [])
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
      toast({ title: "Error", description: "Failed to load admin users", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleAssignRole = async () => {
    if (!selectedUserId) {
      toast({ title: "Error", description: "Please select a user", variant: "destructive" })
      return
    }

    if (!selectedRoleId) {
      toast({ title: "Error", description: "Please select a role", variant: "destructive" })
      return
    }

    if (roles.length === 0) {
      toast({
        title: "Setup Required",
        description: "Admin roles are not set up. Please run migration scripts 018 and 019 first.",
        variant: "destructive",
      })
      return
    }

    try {
      const data = await clientApiPost("admin/roles/assign", { userId: selectedUserId, roleId: selectedRoleId })

      const selectedRole = roles.find((r) => r.id === selectedRoleId)
      toast({
        title: "Success",
        description: `User granted ${selectedRole?.role_name} access successfully`,
      })
      setSelectedUserId("")
      setSelectedRoleId("")
      router.refresh()
      fetchData()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const handleOpenRevokeDialog = (admin: any) => {
    setRevokeDialog({
      open: true,
      userId: admin.id,
      userName: admin.full_name || "Unknown User",
      userEmail: admin.email,
    })
  }

  const handleRevokeWithReason = async (reason: string) => {
    setIsRevoking(true)
    try {
      const data = await clientApiPost("admin/roles/revoke", {
        userId: revokeDialog.userId,
        reason,
      })

      toast({ title: "Success", description: "Admin access revoked successfully" })
      setRevokeDialog({ open: false, userId: "", userName: "", userEmail: "" })
      router.refresh()
      fetchData()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsRevoking(false)
    }
  }

  const getRoleBadgeVariant = (accessLevel: number) => {
    if (accessLevel >= 100) return "default"
    if (accessLevel >= 80) return "secondary"
    if (accessLevel >= 60) return "outline"
    return "outline"
  }

  const nonAdminUsers = allUsers.filter((u) => !admins.find((a) => a.id === u.id))

  if (loading) {
    return <div className="text-center py-8">Loading admin users...</div>
  }

  return (
    <div className="space-y-6">
      <RevokeAdminDialog
        open={revokeDialog.open}
        onOpenChange={(open) => setRevokeDialog({ open, userId: "", userName: "", userEmail: "" })}
        adminName={revokeDialog.userName}
        adminEmail={revokeDialog.userEmail}
        onConfirm={handleRevokeWithReason}
        isLoading={isRevoking}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Grant Admin Access
          </CardTitle>
          <CardDescription>
            Assign a specific admin role to an existing user to give them dashboard access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Select User</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {nonAdminUsers.length > 0 ? (
                    nonAdminUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || "No Name"} ({user.email})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No users available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Select Role</label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a role..." />
                </SelectTrigger>
                <SelectContent>
                  {roles.length > 0 ? (
                    roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.role_name} ({role.access_level}%)
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No roles available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleAssignRole} disabled={!selectedUserId || !selectedRoleId}>
              <Plus className="h-4 w-4 mr-2" />
              Assign Role
            </Button>
          </div>

          {roles.length > 0 && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-semibold mb-2">Available Roles:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-start gap-2">
                    <Badge variant={getRoleBadgeVariant(role.access_level)} className="mt-0.5">
                      {role.access_level}%
                    </Badge>
                    <div>
                      <div className="font-medium">{role.role_name}</div>
                      <div className="text-muted-foreground text-xs">{role.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin Management</CardTitle>
          <CardDescription>View current admins and revocation history</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current">
                <Shield className="h-4 w-4 mr-2" />
                Current Admins ({admins.length})
              </TabsTrigger>
              <TabsTrigger value="revoked">
                <History className="h-4 w-4 mr-2" />
                Revoked History ({revokedHistory.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="mt-4">
              {admins.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Access Level</TableHead>
                      <TableHead>Member Since</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((admin) => {
                      const role = admin.admin_roles
                      return (
                        <TableRow key={admin.id}>
                          <TableCell className="font-medium">{admin.full_name || "N/A"}</TableCell>
                          <TableCell>{admin.email}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(role?.access_level || 100)}>
                              {role?.role_name || "Super Admin"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{ width: `${role?.access_level || 100}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground">{role?.access_level || 100}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{new Date(admin.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button variant="destructive" size="sm" onClick={() => handleOpenRevokeDialog(admin)}>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Revoke
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No admin users yet. Grant admin access to a user to get started.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="revoked" className="mt-4">
              {revokedHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Previous Role</TableHead>
                      <TableHead>Revoked Date</TableHead>
                      <TableHead>Revoked By</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revokedHistory.map((history) => (
                      <TableRow key={history.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{history.user_name || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">{history.user_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {history.previous_role_name || "Admin"} ({history.previous_access_level || 100}%)
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(history.revoked_at).toLocaleDateString()}
                            <div className="text-xs text-muted-foreground">
                              {new Date(history.revoked_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Super Admin</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-muted-foreground">{history.revoke_reason}</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No admin revocations yet. All admin access removals will be logged here.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
