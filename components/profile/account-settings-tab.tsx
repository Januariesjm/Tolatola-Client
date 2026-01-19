"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Settings, LogOut, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface AccountSettingsTabProps {
  user: any
  profile: any
}

export default function AccountSettingsTab({ user, profile }: AccountSettingsTabProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Passwords don't match")
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (error) throw error

      alert("Password updated successfully")
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error) {
      console.error("Error updating password:", error)
      alert("Failed to update password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch("/api/profile/delete", {
        method: "POST",
      })

      if (response.ok) {
        // Clear local session and redirect
        await supabase.auth.signOut()
        window.location.href = "/"
      } else {
        alert("Failed to delete account. Please try again or contact support.")
      }
    } catch (error) {
      console.error("Error deleting account:", error)
      alert("An error occurred while deleting your account.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLogout = async () => {
    try {
      // Clear Supabase session on client side first
      await supabase.auth.signOut()

      // Also call backend logout (optional, but good for consistency)
      try {
        const { clientApiPost } = await import("@/lib/api-client")
        await clientApiPost("auth/logout")
      } catch (apiError) {
        // Backend logout failed, but we've already cleared local session
        console.error("Backend logout error:", apiError)
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Force redirect to home page
      window.location.href = "/"
    }
  }

  return (
    <div className="space-y-8">
      {/* Password Change Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Security</h3>
          <p className="text-sm text-muted-foreground">Manage your password and security preferences.</p>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-xl">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="h-10"
            />
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]">
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      </div>

      <Separator />

      {/* Danger Zone */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
          <p className="text-sm text-muted-foreground">Irreversible actions for your account.</p>
        </div>

        <div className="border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Sign out</h4>
              <p className="text-sm text-muted-foreground">Sign out of your account on this device.</p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-900/20">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <Separator className="bg-red-100 dark:bg-red-900/30" />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Delete Account</h4>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all data.</p>
            </div>
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700">Delete Account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-red-600 text-white hover:bg-red-700"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete Account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  )
}
