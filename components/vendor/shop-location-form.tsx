"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Loader2, CheckCircle } from "lucide-react"
import { geocodeAddress } from "@/app/actions/maps"

// Tanzania regions
const TANZANIA_REGIONS = [
  "Arusha",
  "Dar es Salaam",
  "Dodoma",
  "Geita",
  "Iringa",
  "Kagera",
  "Katavi",
  "Kigoma",
  "Kilimanjaro",
  "Lindi",
  "Manyara",
  "Mara",
  "Mbeya",
  "Morogoro",
  "Mtwara",
  "Mwanza",
  "Njombe",
  "Pemba North",
  "Pemba South",
  "Pwani",
  "Rukwa",
  "Ruvuma",
  "Shinyanga",
  "Simiyu",
  "Singida",
  "Songwe",
  "Tabora",
  "Tanga",
  "Zanzibar North",
  "Zanzibar South and Central",
  "Zanzibar West",
]

interface ShopLocationFormProps {
  value: {
    address: string
    region: string
    district: string
    ward: string
    village: string
    street: string
    latitude: number | null
    longitude: number | null
  }
  onChange: (value: any) => void
}

export function ShopLocationForm({ value, onChange }: ShopLocationFormProps) {
  const [isGeocodingManual, setIsGeocodingManual] = useState(false)

  // Check if manual entry is complete
  const hasCompleteLocation = value.region && value.district && value.ward && value.village && value.street

  const handleFieldChange = async (field: string, fieldValue: string) => {
    const newValue = { ...value, [field]: fieldValue }

    // Build full address from components
    const addressParts = []
    if (newValue.street) addressParts.push(newValue.street)
    if (newValue.village) addressParts.push(newValue.village)
    if (newValue.ward) addressParts.push(`${newValue.ward} Ward`)
    if (newValue.district) addressParts.push(`${newValue.district} District`)
    if (newValue.region) addressParts.push(`${newValue.region} Region`)
    addressParts.push("Tanzania")

    newValue.address = addressParts.join(", ")

    onChange(newValue)

    if (newValue.region && newValue.district && newValue.ward && newValue.street && newValue.village) {
      setIsGeocodingManual(true)
      try {
        const result = await geocodeAddress(newValue.address)
        if (result) {
          onChange({
            ...newValue,
            latitude: result.latitude,
            longitude: result.longitude,
          })
        }
      } catch (error) {
        console.error("Failed to geocode address:", error)
      } finally {
        setIsGeocodingManual(false)
      }
    }
  }

  return (
    <div className="space-y-4">
      <Label className="flex items-center gap-2 text-base font-semibold">
        <MapPin className="h-5 w-5" />
        Shop Location in Tanzania
      </Label>

      <p className="text-sm text-muted-foreground">
        Enter your shop's complete address. GPS coordinates will be automatically obtained for delivery fee
        calculations.
      </p>

      {isGeocodingManual && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2 text-blue-700 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Getting GPS coordinates for your location...
        </div>
      )}

      {hasCompleteLocation && value.latitude && value.longitude && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-green-700 font-medium">
            <CheckCircle className="h-5 w-5" />
            Location Ready
          </div>
          <div className="text-sm text-green-800">
            <p>
              <strong>Full Address:</strong> {value.address}
            </p>
          </div>
          <p className="text-xs text-green-600">
            GPS Coordinates: {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="region">Region *</Label>
            <Select value={value.region} onValueChange={(val) => handleFieldChange("region", val)}>
              <SelectTrigger id="region">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {TANZANIA_REGIONS.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="district">District *</Label>
            <Input
              id="district"
              value={value.district}
              onChange={(e) => handleFieldChange("district", e.target.value)}
              placeholder="e.g., Kinondoni"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ward">Ward *</Label>
            <Input
              id="ward"
              value={value.ward}
              onChange={(e) => handleFieldChange("ward", e.target.value)}
              placeholder="e.g., Mwananyamala"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="village">Village/Mtaa *</Label>
            <Input
              id="village"
              value={value.village || ""}
              onChange={(e) => handleFieldChange("village", e.target.value)}
              placeholder="e.g., Kijitonyama"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="street">Street/Building *</Label>
          <Input
            id="street"
            value={value.street || ""}
            onChange={(e) => handleFieldChange("street", e.target.value)}
            placeholder="e.g., Ali Hassan Mwinyi Road, Building No. 5"
          />
        </div>

        {value.address && !hasCompleteLocation && (
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            <span className="font-medium">Current Address:</span> {value.address}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {hasCompleteLocation && value.latitude && value.longitude
          ? "✓ Location is ready! You can now save your shop details."
          : "Please fill in all location fields. GPS coordinates will be fetched automatically for delivery calculations."}
      </p>
    </div>
  )
}
