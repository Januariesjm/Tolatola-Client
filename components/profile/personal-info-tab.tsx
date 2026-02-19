"use client"

import { useRouter } from "next/navigation"
import type React from "react"
import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, CheckCircle2, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { clientApiPatchProfile, clientApiPostProfileAvatar } from "@/lib/api-client"

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024 // 2MB
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

interface PersonalInfoTabProps {
  profile: any
  kycStatus?: string
  editableFields?: string[]
  readOnlyFields?: string[]
  onProfileUpdated?: () => void
}

export default function PersonalInfoTab({
  profile,
  kycStatus,
  readOnlyFields,
  onProfileUpdated,
}: PersonalInfoTabProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
  })
  const [previewImage, setPreviewImage] = useState(profile?.profile_image_url || "")

  const isVerified = kycStatus === "approved"

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please use an image (JPEG, PNG, WebP, or GIF).",
        variant: "destructive",
      })
      return
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      toast({
        title: "File too large",
        description: "Image must be 2MB or smaller.",
        variant: "destructive",
      })
      return
    }

    setIsUploadingImage(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      setPreviewImage(dataUrl)

      const { ok, status, data } = await clientApiPostProfileAvatar(dataUrl)

      if (status === 401) {
        toast({ title: "Session expired", description: "Please sign in again.", variant: "destructive" })
        router.push("/auth/login")
        return
      }
      if (!ok) {
        toast({
          title: "Couldn't update photo",
          description: (data as any)?.error || "Please try again.",
          variant: "destructive",
        })
        return
      }
      toast({ title: "Photo updated" })
      onProfileUpdated?.()
      if ((data as any)?.profile_image_url) setPreviewImage((data as any).profile_image_url)
    } catch (err) {
      console.error("Error uploading image:", err)
      toast({ title: "Error", description: "Failed to upload image. Please try again.", variant: "destructive" })
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { ok, status, data } = await clientApiPatchProfile({
        full_name: formData.full_name.trim() || undefined,
        phone: formData.phone.trim() || undefined,
      })

      if (status === 401) {
        toast({ title: "Session expired", description: "Please sign in again.", variant: "destructive" })
        router.push("/auth/login")
        return
      }
      if (!ok) {
        const errData = data as { error?: string; readOnlyFields?: string[] }
        const msg = errData?.error || "Couldn't update profile."
        const readOnly = errData?.readOnlyFields?.length
          ? ` You can't update: ${errData.readOnlyFields.join(", ")}.`
          : ""
        toast({
          title: "Couldn't update profile",
          description: msg + readOnly,
          variant: "destructive",
        })
        return
      }
      toast({ title: "Profile updated" })
      setIsEditing(false)
      onProfileUpdated?.()
    } catch (err) {
      console.error("Error updating profile:", err)
      toast({ title: "Error", description: "Failed to save. Please try again.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Avatar Section */}
        <div className="w-full md:w-auto flex flex-col items-center gap-4 p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
          <div className="relative group">
            <Avatar className="h-32 w-32 border-4 border-white dark:border-zinc-800 shadow-md">
              <AvatarImage src={previewImage || "/placeholder.svg"} alt={profile?.full_name || "User"} className="object-cover" />
              <AvatarFallback className="bg-indigo-100 text-indigo-600 text-3xl font-bold">
                {getInitials(profile?.full_name || profile?.email || "User")}
              </AvatarFallback>
            </Avatar>
            {isVerified && (
              <div className="absolute bottom-1 right-1 bg-white dark:bg-zinc-950 rounded-full p-1 shadow-sm">
                <CheckCircle2 className="h-6 w-6 text-green-500 fill-green-500/20" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              <Upload className="h-8 w-8 text-white" />
            </button>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">Profile Photo</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isUploadingImage ? "Uploading…" : "Click to change (max 2MB, image only)"}
            </p>
            <input ref={fileInputRef} type="file" accept={ALLOWED_AVATAR_TYPES.join(",")} onChange={handleImageUpload} className="hidden" />
          </div>
        </div>

        {/* Form Section */}
        <div className="flex-1 w-full">
          {readOnlyFields?.length ? (
            <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-muted/50 border border-border">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Email and account type can't be changed here. Contact support if you need to update them.
              </p>
            </div>
          ) : null}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                  disabled={!isEditing}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={profile?.email ?? ""} disabled className="bg-muted/50 h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  disabled={!isEditing}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Input value={profile?.user_type || "customer"} disabled className="capitalize bg-muted/50 h-10" />
              </div>
            </div>

            {/* Read-only: address (backend does not allow editing via profile) */}
            {(profile?.address != null && profile?.address !== "") && (
              <div className="space-y-2">
                <Label>Address / Location</Label>
                <Input value={profile.address} disabled className="bg-muted/50 h-10" />
                <p className="text-xs text-muted-foreground">Address cannot be changed from this page.</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4">
              {!isEditing ? (
                <Button type="button" onClick={() => setIsEditing(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]">
                    {isLoading ? "Saving…" : "Save Changes"}
                  </Button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
