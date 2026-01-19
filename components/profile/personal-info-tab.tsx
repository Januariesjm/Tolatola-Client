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
    address: profile?.address || "",
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
              className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            >
              <Upload className="h-8 w-8 text-white" />
            </button>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">Profile Photo</p>
            <p className="text-xs text-muted-foreground mt-1">Click to change</p>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>
        </div>

        {/* Form Section */}
        <div className="flex-1 w-full">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  disabled={!isEditing}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={profile?.email} disabled className="bg-muted/50 h-10" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label>Account Type</Label>
                <Input value={profile?.user_type || "customer"} disabled className="capitalize bg-muted/50 h-10" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address / Location</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={!isEditing}
                placeholder="e.g. Dar es Salaam, Kinondoni"
                className="h-10"
              />
            </div>

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
                    {isLoading ? "Saving..." : "Save Changes"}
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
