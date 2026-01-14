"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { clientApiPut } from "@/lib/api-client"
import { ShopLocationForm } from "./shop-location-form"
import { AlertCircle } from "lucide-react"

interface EditShopDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shop: any
  onSuccess: () => void
}

export function EditShopDialog({ open, onOpenChange, shop, onSuccess }: EditShopDialogProps) {
  const [name, setName] = useState(shop?.name || "")
  const [description, setDescription] = useState(shop?.description || "")
  const [location, setLocation] = useState({
    address: shop?.address || "",
    region: shop?.region || "",
    district: shop?.district || "",
    ward: shop?.ward || "",
    village: shop?.village || "",
    street: shop?.street || "",
    latitude: shop?.latitude || null,
    longitude: shop?.longitude || null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!location.region || !location.district || !location.ward) {
      setError("Please provide Region, District, and Ward for your shop location")
      return
    }

    if (!location.street) {
      setError("Please provide at least a Street or Building name for your shop location")
      return
    }

    if (!location.latitude || !location.longitude) {
      setError("Please select a specific location from the search or provide details until GPS coordinates are found.")
      return
    }

    let finalLocation = { ...location }

    setIsLoading(true)
    setError(null)

    try {
      await clientApiPut(`shops/${shop.id}`, {
        name,
        description,
        address: finalLocation.address,
        region: finalLocation.region,
        district: finalLocation.district,
        ward: finalLocation.ward,
        village: finalLocation.village,
        street: finalLocation.street,
        latitude: finalLocation.latitude,
        longitude: finalLocation.longitude,
        updated_at: new Date().toISOString(),
      })

      onOpenChange(false)
      onSuccess()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          if ((e.target as HTMLElement)?.closest('.pac-container')) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Edit Shop Details</DialogTitle>
          <DialogDescription>Update your shop information and location</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Shop Name *</Label>
              <Input
                id="name"
                placeholder="My Amazing Shop"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell customers about your shop..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                Shop Location (Required for Delivery Calculation)
              </h3>
              <ShopLocationForm value={location} onChange={setLocation} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
