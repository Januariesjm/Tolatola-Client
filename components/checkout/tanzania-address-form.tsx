"use client"

import { useState, useEffect, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Loader2, Search, Info, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getGoogleMapsScriptUrl } from "@/app/actions/maps"
import { cn } from "@/lib/utils"

declare global {
  interface Window {
    google: any
    initGoogleMapsCallback?: () => void
  }
}

const TANZANIA_REGIONS = [
  "Arusha", "Dar es Salaam", "Dodoma", "Geita", "Iringa", "Kagera", "Katavi", "Kigoma",
  "Kilimanjaro", "Lindi", "Manyara", "Mara", "Mbeya", "Morogoro", "Mtwara", "Mwanza",
  "Njombe", "Pemba North", "Pemba South", "Pwani", "Rukwa", "Ruvuma", "Shinyanga",
  "Simiyu", "Singida", "Songwe", "Tabora", "Tanga", "Zanzibar North",
  "Zanzibar South and Central", "Zanzibar West"
]

interface AddressData {
  country: string
  region: string
  district: string
  ward: string
  village: string
  street: string
}

interface TanzaniaAddressFormProps {
  value: AddressData
  onChange: (address: AddressData) => void
  onAddressComplete: (fullAddress: string, coordinates?: { lat: number; lng: number }) => void
  userId: string
}

export function TanzaniaAddressForm({ value, onChange, onAddressComplete, userId }: TanzaniaAddressFormProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(true)
  const autocompleteRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (window.google?.maps?.places) {
      setIsGoogleLoaded(true)
      setIsLoadingGoogle(false)
      return
    }

    const loadScript = async () => {
      try {
        const scriptUrl = await getGoogleMapsScriptUrl()
        if (!scriptUrl) {
          setIsLoadingGoogle(false)
          return
        }

        const script = document.createElement("script")
        script.src = scriptUrl
        script.async = true
        script.defer = true

        window.initGoogleMapsCallback = () => {
          setIsGoogleLoaded(true)
          setIsLoadingGoogle(false)
        }

        script.onerror = () => {
          toast({ title: "Map Loading Error", description: "Address autocomplete failed to load.", variant: "destructive" })
          setIsLoadingGoogle(false)
        }

        document.head.appendChild(script)
      } catch {
        setIsLoadingGoogle(false)
      }
    }

    loadScript()
    return () => { delete window.initGoogleMapsCallback }
  }, [toast])

  useEffect(() => {
    if (!isGoogleLoaded || autocompleteRef.current) return

    const initAutocomplete = () => {
      const input = inputRef.current
      if (!input) return

      try {
        const AutocompleteCtor = (window.google as any)?.maps?.places?.Autocomplete
        if (!AutocompleteCtor) return

        autocompleteRef.current = new AutocompleteCtor(input, {
          componentRestrictions: { country: "tz" },
          fields: ["address_components", "formatted_address", "geometry"],
          types: ["geocode", "establishment"],
        })

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current.getPlace()
          if (!place.address_components) return

          const addressData: AddressData = { country: "Tanzania", region: "", district: "", ward: "", village: "", street: "" }
          const streetParts: string[] = []

          for (const component of place.address_components) {
            const types = component.types
            if (types.includes("administrative_area_level_1")) {
              const regionName = component.long_name.replace(" Region", "")
              const matchedRegion = TANZANIA_REGIONS.find((r) => r.toLowerCase() === regionName.toLowerCase())
              addressData.region = matchedRegion || regionName
            } else if (types.includes("administrative_area_level_2")) {
              addressData.district = component.long_name.replace(" District", "")
            } else if (types.includes("administrative_area_level_3") || types.includes("sublocality_level_1")) {
              addressData.ward = component.long_name
            } else if (types.includes("sublocality_level_2") || types.includes("neighborhood")) {
              addressData.village = component.long_name
            } else if (types.includes("route")) {
              streetParts.push(component.long_name)
            } else if (types.includes("street_number")) {
              streetParts.unshift(component.short_name)
            }
          }

          addressData.street = streetParts.join(" ") || place.formatted_address?.split(",")[0] || ""
          onChange(addressData)
          setSearchQuery(place.formatted_address || "")

          const lat = place.geometry?.location?.lat()
          const lng = place.geometry?.location?.lng()
          const coords = lat && lng ? { lat, lng } : undefined

          if (coords) {
            // Immediately notify parent with coordinates
            onAddressComplete(place.formatted_address || "", coords)
            toast({ title: "Address Found", description: "Location synced and fields auto-filled." })
          } else {
            toast({ title: "Location Warning", description: "Coordinates not found. Delivery calculation may be unavailable.", variant: "destructive" })
          }
        })
      } catch (err) {
        console.error(err)
      }
    }

    const timer = setTimeout(initAutocomplete, 200)
    return () => clearTimeout(timer)
  }, [isGoogleLoaded, onChange, toast])



  const handleFieldChange = (field: keyof AddressData, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue })
  }

  return (
    <div className="space-y-10">
      {/* Search Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Search className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <Label htmlFor="address-search" className="text-sm font-bold text-stone-900 tracking-tight">Address Search</Label>
            <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">Search for your location</p>
          </div>
        </div>

        <div className="relative group">
          <input
            ref={inputRef}
            id="address-search"
            type="text"
            placeholder={isLoadingGoogle ? "Loading maps..." : "Type to search location..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoadingGoogle}
            className="flex h-12 w-full rounded-xl border-2 border-stone-100 bg-white px-4 py-2 text-base font-medium ring-offset-background placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all disabled:opacity-50"
          />
          {isLoadingGoogle && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
          {isGoogleLoaded && searchQuery && (
            <div className="absolute -bottom-4 right-6 px-3 py-1 bg-primary text-[8px] font-black uppercase tracking-widest text-white rounded-full translate-y-full animate-in fade-in slide-in-from-top-2">
              Active Autocomplete
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-stone-50" />

      {/* Manual Entry Grid */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-stone-400" />
          <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">Manual Entry</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <Label htmlFor="region" className="text-[10px] font-bold uppercase tracking-wide text-stone-500 ml-1">Region *</Label>
            <Select value={value.region} onValueChange={(val) => handleFieldChange("region", val)}>
              <SelectTrigger id="region" className="h-12 rounded-xl border-stone-200 bg-white font-medium text-stone-900 px-4">
                <SelectValue placeholder="Select Region" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-stone-100 shadow-xl">
                {TANZANIA_REGIONS.map((region) => (
                  <SelectItem key={region} value={region} className="rounded-lg focus:bg-primary/5 font-medium">
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="district" className="text-[10px] font-bold uppercase tracking-wide text-stone-500 ml-1">District *</Label>
            <Input
              id="district"
              placeholder="e.g., Kinondoni"
              value={value.district}
              onChange={(e) => handleFieldChange("district", e.target.value)}
              required
              className="h-12 rounded-xl border-stone-200 bg-white font-medium placeholder:text-stone-400 px-4"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="ward" className="text-[10px] font-bold uppercase tracking-wide text-stone-500 ml-1">Ward *</Label>
            <Input
              id="ward"
              placeholder="e.g., Masaki"
              value={value.ward}
              onChange={(e) => handleFieldChange("ward", e.target.value)}
              required
              className="h-12 rounded-xl border-stone-200 bg-white font-medium placeholder:text-stone-400 px-4"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="street" className="text-[10px] font-bold uppercase tracking-wide text-stone-500 ml-1">Street / Building *</Label>
            <Input
              id="street"
              placeholder="e.g., Samora Ave"
              value={value.street}
              onChange={(e) => handleFieldChange("street", e.target.value)}
              required
              className="h-12 rounded-xl border-stone-200 bg-white font-medium placeholder:text-stone-400 px-4"
            />
          </div>

          <div className="space-y-3 md:col-span-2">
            <Label htmlFor="village" className="text-[10px] font-bold uppercase tracking-wide text-stone-500 ml-1">Village / Mtaa / Notes</Label>
            <Input
              id="village"
              placeholder="Additional delivery instructions"
              value={value.village}
              onChange={(e) => handleFieldChange("village", e.target.value)}
              className="h-12 rounded-xl border-stone-200 bg-white font-medium placeholder:text-stone-400 px-4"
            />
          </div>
        </div>
      </div>

      <div className="p-4 bg-stone-50 rounded-xl flex items-start gap-3 border border-stone-100">
        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
        <p className="text-stone-600 text-xs leading-relaxed font-medium">
          Please ensure your address details are accurate to ensure smooth delivery.
        </p>
      </div>
    </div>
  )
}
