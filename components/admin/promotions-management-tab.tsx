"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface Promotion {
  id: string
  title: string
  description: string | null
  image_url: string | null
  background_color: string
  text_color: string
  button_text: string
  button_link: string | null
  is_active: boolean
  display_order: number
  created_at: string
}

interface PromotionsManagementTabProps {
  promotions: Promotion[]
}

export function PromotionsManagementTab({ promotions: initialPromotions }: PromotionsManagementTabProps) {
  const [promotions, setPromotions] = useState(initialPromotions)

  // Sync state with props when dashboard data refreshes
  useEffect(() => {
    setPromotions(initialPromotions)
  }, [initialPromotions])

  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    background_color: "#1a1a1a",
    text_color: "#ffffff",
    button_text: "Learn More",
    button_link: "",
    is_active: true,
    display_order: 0,
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)

      // Create FormData and send to API route
      const formDataToSend = new FormData()
      formDataToSend.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataToSend,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      setFormData((prev) => ({ ...prev, image_url: data.url }))
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()

    try {
      if (editingId) {
        // Update existing promotion
        const { error } = await supabase.from("promotions").update(formData).eq("id", editingId)

        if (error) throw error
        alert("Promotion updated successfully!")
      } else {
        // Create new promotion
        const { error } = await supabase.from("promotions").insert([formData])

        if (error) throw error
        alert("Promotion created successfully!")
      }

      // Reset form
      setFormData({
        title: "",
        description: "",
        image_url: "",
        background_color: "#1a1a1a",
        text_color: "#ffffff",
        button_text: "Learn More",
        button_link: "",
        is_active: true,
        display_order: 0,
      })
      setIsAdding(false)
      setEditingId(null)
      router.refresh()
    } catch (error) {
      console.error("Error saving promotion:", error)
      alert("Failed to save promotion")
    }
  }

  const handleEdit = (promotion: Promotion) => {
    setFormData({
      title: promotion.title,
      description: promotion.description || "",
      image_url: promotion.image_url || "",
      background_color: promotion.background_color,
      text_color: promotion.text_color,
      button_text: promotion.button_text,
      button_link: promotion.button_link || "",
      is_active: promotion.is_active,
      display_order: promotion.display_order,
    })
    setEditingId(promotion.id)
    setIsAdding(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promotion?")) return

    const supabase = createClient()
    const { error } = await supabase.from("promotions").delete().eq("id", id)

    if (error) {
      console.error("Error deleting promotion:", error)
      alert("Failed to delete promotion")
      return
    }

    alert("Promotion deleted successfully!")
    router.refresh()
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const supabase = createClient()
    const { error } = await supabase.from("promotions").update({ is_active: !currentStatus }).eq("id", id)

    if (error) {
      console.error("Error toggling promotion:", error)
      alert("Failed to update promotion status")
      return
    }

    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Promotions & Ads</h2>
          <p className="text-muted-foreground">Manage hero slider promotions and advertisements</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Promotion
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Promotion" : "Add New Promotion"}</CardTitle>
            <CardDescription>Create attractive promotions for the homepage hero slider</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order.toString()}
                    onChange={(e) => setFormData({ ...formData, display_order: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Banner Image</Label>
                <div className="flex gap-4 items-start">
                  <Input id="image" type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                  {formData.image_url && (
                    <Image
                      src={formData.image_url || "/placeholder.svg"}
                      alt="Preview"
                      width={100}
                      height={60}
                      className="rounded border object-cover"
                    />
                  )}
                </div>
                {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="background_color">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="background_color"
                      type="color"
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      className="w-20"
                    />
                    <Input
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text_color">Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="text_color"
                      type="color"
                      value={formData.text_color}
                      onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                      className="w-20"
                    />
                    <Input
                      value={formData.text_color}
                      onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="button_text">Button Text</Label>
                  <Input
                    id="button_text"
                    value={formData.button_text}
                    onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="button_link">Button Link</Label>
                  <Input
                    id="button_link"
                    value={formData.button_link}
                    onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                    placeholder="/shop or https://..."
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">{editingId ? "Update" : "Create"} Promotion</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false)
                    setEditingId(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {promotions.map((promotion) => (
          <Card key={promotion.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {promotion.image_url && (
                  <Image
                    src={promotion.image_url || "/placeholder.svg"}
                    alt={promotion.title}
                    width={200}
                    height={120}
                    className="rounded border object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{promotion.title}</h3>
                      {promotion.description && (
                        <p className="text-sm text-muted-foreground mt-1">{promotion.description}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Order: {promotion.display_order}</span>
                        <span>Button: {promotion.button_text}</span>
                        {promotion.button_link && <span>Link: {promotion.button_link}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleActive(promotion.id, promotion.is_active)}
                      >
                        {promotion.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(promotion)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(promotion.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {promotions.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>No promotions yet. Click "Add Promotion" to create your first one.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
