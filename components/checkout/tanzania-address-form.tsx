"use client"

import { useState, useEffect, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Loader2, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getGoogleMapsScriptUrl } from "@/app/actions/maps"

// Declare google maps types
declare global {
  interface Window {
    google: any
    initGoogleMapsCallback: () => void
  }
}

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
  onAddressComplete: (fullAddress: string) => void
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
    console.log("[v0] Starting Google Maps initialization")

    // Check if already loaded
    if (window.google?.maps?.places) {
      console.log("[v0] Google Maps already loaded")
      setIsGoogleLoaded(true)
      setIsLoadingGoogle(false)
      return
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      console.log("[v0] Google Maps script already exists in DOM, waiting for load")
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.places) {
          console.log("[v0] Google Maps loaded after waiting")
          setIsGoogleLoaded(true)
          setIsLoadingGoogle(false)
          clearInterval(checkLoaded)
        }
      }, 100)

      setTimeout(() => {
        clearInterval(checkLoaded)
        if (!window.google?.maps?.places) {
          console.log("[v0] Google Maps failed to load after 10 seconds")
        }
        setIsLoadingGoogle(false)
      }, 10000)

      return () => clearInterval(checkLoaded)
    }

    const loadScript = async () => {
      try {
        console.log("[v0] Fetching Google Maps script URL from server")
        const scriptUrl = await getGoogleMapsScriptUrl()

        if (!scriptUrl) {
          console.log("[v0] No script URL returned from server - API key may be missing")
          toast({
            title: "Autocomplete Unavailable",
            description: "Please fill in address fields manually",
            variant: "destructive",
          })
          setIsLoadingGoogle(false)
          return
        }

        console.log("[v0] Creating script element with URL")

        const script = document.createElement("script")
        script.src = scriptUrl
        script.async = true
        script.defer = true

        window.initGoogleMapsCallback = () => {
          console.log("[v0] Google Maps callback executed successfully")
          setIsGoogleLoaded(true)
          setIsLoadingGoogle(false)
        }

        script.onload = () => {
          console.log("[v0] Script onload fired")
        }

        script.onerror = (error) => {
          console.error("[v0] Script loading error:", error)
          toast({
            title: "Map Loading Error",
            description: "Address autocomplete failed to load. Please fill in fields manually.",
            variant: "destructive",
          })
          setIsLoadingGoogle(false)
        }

        document.head.appendChild(script)
        console.log("[v0] Script element added to document head")
      } catch (error) {
        console.error("[v0] Error in loadScript:", error)
        toast({
          title: "Error",
          description: "Failed to load address autocomplete",
          variant: "destructive",
        })
        setIsLoadingGoogle(false)
      }
    }

    loadScript()

    return () => {
      delete window.initGoogleMapsCallback
    }
  }, [toast])

  // Initialize autocomplete when Google is loaded
  useEffect(() => {
    if (!isGoogleLoaded) {
      console.log("[v0] Google not loaded yet, skipping autocomplete init")
      return
    }

    if (autocompleteRef.current) {
      console.log("[v0] Autocomplete already initialized")
      return
    }

    const initAutocomplete = () => {
      const input = inputRef.current

      console.log("[v0] Input element check:", {
        exists: !!input,
        tagName: input?.tagName,
        id: input?.id,
        type: input?.type,
      })

      if (!input) {
        console.log("[v0] Input element not found")
        return
      }

      try {
        // Guard for legacy Autocomplete deprecation; if unavailable, fall back gracefully
        const AutocompleteCtor = (window.google as any)?.maps?.places?.Autocomplete
        if (!AutocompleteCtor) {
          console.warn("[v0] Google Autocomplete not available in this environment; using manual entry")
          toast({
            title: "Autocomplete Unavailable",
            description: "Please type your address manually; Google autocomplete is not available.",
            variant: "destructive",
          })
          return
        }

        console.log("[v0] Initializing autocomplete on input element")

        autocompleteRef.current = new AutocompleteCtor(input, {
          componentRestrictions: { country: "tz" },
          fields: ["address_components", "formatted_address", "geometry"],
          types: ["geocode", "establishment"],
        })

        console.log("[v0] Autocomplete object created successfully")

        autocompleteRef.current.addListener("place_changed", () => {
          console.log("[v0] Place changed event fired")
          const place = autocompleteRef.current.getPlace()

          if (!place.address_components) {
            console.log("[v0] No address components in place object")
            return
          }

          console.log("[v0] Place selected:", place.formatted_address)

          // Parse address components
          const addressData: AddressData = {
            country: "Tanzania",
            region: "",
            district: "",
            ward: "",
            village: "",
            street: "",
          }

          const streetParts: string[] = []

          for (const component of place.address_components) {
            const types = component.types

            if (types.includes("administrative_area_level_1")) {
              // Region
              const regionName = component.long_name.replace(" Region", "")
              // Match to our region list
              const matchedRegion = TANZANIA_REGIONS.find((r) => r.toLowerCase() === regionName.toLowerCase())
              addressData.region = matchedRegion || regionName
            } else if (types.includes("administrative_area_level_2")) {
              // District
              addressData.district = component.long_name.replace(" District", "")
            } else if (types.includes("administrative_area_level_3") || types.includes("sublocality_level_1")) {
              // Ward
              addressData.ward = component.long_name
            } else if (types.includes("sublocality_level_2") || types.includes("neighborhood")) {
              // Village/Neighborhood
              addressData.village = component.long_name
            } else if (types.includes("route")) {
              streetParts.push(component.long_name)
            } else if (types.includes("street_number")) {
              streetParts.unshift(component.short_name)
            } else if (types.includes("premise") || types.includes("establishment")) {
              streetParts.push(component.long_name)
            }
          }

          addressData.street = streetParts.join(" ") || place.formatted_address?.split(",")[0] || ""

          console.log("[v0] Parsed address data:", addressData)

          onChange(addressData)
          setSearchQuery(place.formatted_address || "")

          toast({
            title: "Address Selected",
            description: "Fields have been auto-filled from your selection",
          })
        })

        console.log("[v0] Place changed listener added successfully")
      } catch (error) {
        console.error("[v0] Failed to initialize autocomplete:", error)
        toast({
          title: "Autocomplete Error",
          description: "Please fill in address fields manually",
          variant: "destructive",
        })
      }
    }

    const timer = setTimeout(initAutocomplete, 200)
    return () => clearTimeout(timer)
  }, [isGoogleLoaded, onChange, toast])

  useEffect(() => {
    if (value.region) {
      // Build address for calculation with available information
      const addressParts = []
      if (value.street) addressParts.push(value.street)
      if (value.village) addressParts.push(value.village)
      if (value.ward) addressParts.push(`${value.ward} Ward`)
      if (value.district) addressParts.push(`${value.district} District`)
      addressParts.push(`${value.region} Region, Tanzania`)

      const fullAddress = addressParts.join(", ")
      onAddressComplete(fullAddress)
    }
  }, [value.region, value.district, value.ward, value.street, value.village, onAddressComplete])

  const handleFieldChange = (field: keyof AddressData, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-base font-semibold">
          <MapPin className="h-5 w-5" />
          Delivery Address in Tanzania
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address-search" className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          Search your address (start typing to autocomplete)
        </Label>
        <div className="relative">
          <input
            ref={inputRef}
            id="address-search"
            type="text"
            placeholder={isLoadingGoogle ? "Loading address search..." : "Type your address in Tanzania..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoadingGoogle}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {isLoadingGoogle && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {isGoogleLoaded
            ? "Start typing your address and select from suggestions. Fields below will be auto-filled."
            : isLoadingGoogle
              ? "Loading address autocomplete..."
              : "Autocomplete not available. Please fill in the fields manually below."}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country *</Label>
          <Input id="country" value="Tanzania" disabled className="bg-muted" />
        </div>

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
            placeholder="e.g., Ilala, Kinondoni"
            value={value.district}
            onChange={(e) => handleFieldChange("district", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ward">Ward *</Label>
          <Input
            id="ward"
            placeholder="e.g., Kariakoo, Magomeni"
            value={value.ward}
            onChange={(e) => handleFieldChange("ward", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="village">Village/Mtaa (Optional)</Label>
          <Input
            id="village"
            placeholder="Enter village or neighborhood"
            value={value.village}
            onChange={(e) => handleFieldChange("village", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="street">Street/Building *</Label>
          <Input
            id="street"
            placeholder="e.g., Samora Avenue, Building Name"
            value={value.street}
            onChange={(e) => handleFieldChange("street", e.target.value)}
            required
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        * Required fields.{" "}
        {isGoogleLoaded
          ? "Use the search box above for autocomplete or fill in manually."
          : "Fill in the fields manually."}{" "}
        Delivery fee will be calculated based on your location.
      </p>
    </div>
  )
}
