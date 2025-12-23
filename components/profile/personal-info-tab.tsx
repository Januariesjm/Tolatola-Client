"use client"

import { useRouter } from "next/navigation"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Upload, CheckCircle2 } from "lucide-react"

interface PersonalInfoTabProps {
  profile: any
  kycStatus?: string
}

export default function PersonalInfoTab({ profile, kycStatus }: PersonalInfoTabProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
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

    setIsUploadingImage(true)

    try {
      // Create a preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to server
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/profile/upload-image", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error("Error uploading image:", error)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsEditing(false)
        router.refresh()
      }
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>View and update your personal details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 mb-6 pb-6 border-b">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={previewImage || "/placeholder.svg"} alt={profile?.full_name || "User"} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {getInitials(profile?.full_name || profile?.email || "User")}
              </AvatarFallback>
            </Avatar>
            {isVerified && (
              <CheckCircle2 className="absolute -bottom-1 -right-1 h-6 w-6 text-primary bg-background rounded-full" />
            )}
          </div>
          <div className="text-center">
            <h3 className="font-semibold flex items-center gap-2 justify-center">
              {profile?.full_name || "User"}
              {isVerified && (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingImage}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploadingImage ? "Uploading..." : "Change Photo"}
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={profile?.email} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Account Type</Label>
            <Input value={profile?.user_type || "customer"} disabled className="capitalize" />
          </div>

          <div className="space-y-2">
            <Label>Member Since</Label>
            <Input value={new Date(profile?.created_at).toLocaleDateString()} disabled />
          </div>

          <div className="flex gap-2">
            {!isEditing ? (
              <Button type="button" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            ) : (
              <>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
