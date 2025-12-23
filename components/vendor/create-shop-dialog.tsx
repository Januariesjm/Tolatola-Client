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
import { clientApiPost } from "@/lib/api-client"
import { ShopLocationForm } from "./shop-location-form"
import { AlertCircle } from "lucide-react"

interface CreateShopDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendorId: string
  onSuccess: () => void
}

export function CreateShopDialog({ open, onOpenChange, vendorId, onSuccess }: CreateShopDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState({
    address: "",
    region: "",
    district: "",
    ward: "",
    village: "",
    street: "",
    latitude: null as number | null,
    longitude: null as number | null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!location.region || !location.district || !location.ward) {
      setError("Please provide Region, District, and Ward for your shop location")
      return
    }

    if (!location.street || !location.village) {
      setError("Please provide Street/Building and Village/Mtaa for your shop location")
      return
    }

    let finalLocation = { ...location }
    if (!location.latitude || !location.longitude) {
      setError("Getting GPS coordinates...")
      const { geocodeAddress } = await import("@/app/actions/maps")
      const result = await geocodeAddress(location.address)

      if (!result) {
        setError(
          "Could not determine GPS coordinates. Please try using the address search above or check your location details.",
        )
        return
      }

      finalLocation = {
        ...location,
        latitude: result.latitude,
        longitude: result.longitude,
      }
      setLocation(finalLocation)
    }

    setIsLoading(true)
    setError(null)

    try {
      await clientApiPost("shops", {
        vendor_id: vendorId,
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
        is_active: true,
      })

      onOpenChange(false)
      onSuccess()
      setName("")
      setDescription("")
      setLocation({
        address: "",
        region: "",
        district: "",
        ward: "",
        village: "",
        street: "",
        latitude: null,
        longitude: null,
      })
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Your Shop</DialogTitle>
          <DialogDescription>
            Set up your shop to start selling products. Shop location is required for accurate delivery fee calculation.
          </DialogDescription>
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
                Shop Location (Required)
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
              {isLoading ? "Creating..." : "Create Shop"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
