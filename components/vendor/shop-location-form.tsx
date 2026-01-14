"use client"

import { Label } from "@/components/ui/label"
import { MapPin, CheckCircle, AlertCircle } from "lucide-react"
import { TanzaniaAddressForm } from "@/components/checkout/tanzania-address-form"

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
  // Check if location is ready (has coordinates and basic address)
  const isLocationReady =
    value.latitude &&
    value.longitude &&
    value.region &&
    value.district &&
    value.street

  const handleAddressChange = (addressData: any) => {
    onChange({
      ...value,
      ...addressData
    })
  }

  const handleAddressComplete = (fullAddress: string, coordinates?: { lat: number; lng: number }) => {
    onChange({
      ...value,
      address: fullAddress,
      latitude: coordinates?.lat || null,
      longitude: coordinates?.lng || null
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <Label className="flex items-center gap-2 text-lg font-bold text-stone-900">
          <MapPin className="h-5 w-5 text-primary" />
          Shop Location Details
        </Label>
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 ml-7">
          Logistics Engine Integration
        </p>
      </div>

      {isLocationReady ? (
        <div className="bg-green-50/50 border border-green-100 rounded-[2rem] p-6 space-y-3 animate-in fade-in zoom-in duration-500">
          <div className="flex items-center gap-2 text-green-700 font-black uppercase tracking-wider text-[10px]">
            <CheckCircle className="h-4 w-4" />
            Coordinates Sync Active
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-green-900 leading-tight">
              {value.address || `${value.street}, ${value.ward}, ${value.district}, ${value.region}`}
            </p>
            <div className="flex gap-4">
              <p className="text-[10px] font-black text-green-600/80 uppercase">
                LAT: {value.latitude?.toFixed(6)}
              </p>
              <p className="text-[10px] font-black text-green-600/80 uppercase">
                LNG: {value.longitude?.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-stone-50 border border-stone-100 rounded-[2rem] p-6 flex items-start gap-4">
          <div className="h-10 w-10 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-stone-100">
            <AlertCircle className="h-5 w-5 text-amber-500" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-black text-stone-900">Location Incomplete</p>
            <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wide leading-relaxed">
              Search for your shop location below. This is critical for delivery logistics.
            </p>
          </div>
        </div>
      )}

      <div className="px-1">
        <TanzaniaAddressForm
          value={{
            country: "Tanzania",
            region: value.region,
            district: value.district,
            ward: value.ward,
            village: value.village,
            street: value.street,
          }}
          onChange={handleAddressChange}
          onAddressComplete={handleAddressComplete}
        />
      </div>
    </div>
  )
}
