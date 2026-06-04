"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, Locate, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface WebMapPickerProps {
  latitude: number | null
  longitude: number | null
  onLocationSelect: (coords: { lat: number; lng: number }) => void
  title?: string
}

export function WebMapPicker({
  latitude,
  longitude,
  onLocationSelect,
  title = "Pin Location on Map",
}: WebMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerInstanceRef = useRef<any>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)
  const { toast } = useToast()

  // Poll for window.google
  useEffect(() => {
    const checkGoogle = () => {
      if (window.google?.maps) {
        setIsGoogleLoaded(true)
      } else {
        setTimeout(checkGoogle, 500)
      }
    }
    checkGoogle()
  }, [])

  // Initialize and update map
  useEffect(() => {
    if (!isGoogleLoaded || !mapRef.current) return

    const google = window.google
    const defaultCenter = {
      lat: latitude || -6.7924,
      lng: longitude || 39.2083,
    }

    if (!mapInstanceRef.current) {
      // Create map instance
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: latitude && longitude ? 15 : 12,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
      })

      // Add click listener to map to place marker
      mapInstanceRef.current.addListener("click", (e: any) => {
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()
        onLocationSelect({ lat, lng })
      })
    }

    const map = mapInstanceRef.current

    // Handle marker positioning
    if (latitude && longitude) {
      const position = { lat: latitude, lng: longitude }

      if (!markerInstanceRef.current) {
        markerInstanceRef.current = new google.maps.Marker({
          position,
          map,
          draggable: true,
          animation: google.maps.Animation.DROP,
        })

        // Add drag end event listener
        markerInstanceRef.current.addListener("dragend", () => {
          const pos = markerInstanceRef.current.getPosition()
          onLocationSelect({ lat: pos.lat(), lng: pos.lng() })
        })
      } else {
        markerInstanceRef.current.setPosition(position)
      }

      // Pan to marker
      map.panTo(position)
    } else {
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setMap(null)
        markerInstanceRef.current = null
      }
    }
  }, [isGoogleLoaded, latitude, longitude, onLocationSelect])

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive",
      })
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        onLocationSelect({ lat, lng })
        setIsLocating(false)
        toast({
          title: "Location Fetched",
          description: `Acquired coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        })

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setZoom(16)
        }
      },
      (error) => {
        setIsLocating(false)
        toast({
          title: "Location Error",
          description: "Could not fetch GPS location. Please choose manually.",
          variant: "destructive",
        })
        console.error("GPS Error:", error)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary animate-bounce" />
          <h4 className="font-bold text-stone-900 text-sm">{title}</h4>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGetCurrentLocation}
          disabled={isLocating || !isGoogleLoaded}
          className="rounded-full border-primary/20 hover:border-primary text-xs font-bold gap-2 hover:bg-primary/5 transition-all"
        >
          {isLocating ? (
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
          ) : (
            <Locate className="h-3 w-3 text-primary" />
          )}
          Use Current GPS
        </Button>
      </div>

      <div className="relative rounded-[2rem] overflow-hidden border border-stone-200 shadow-inner bg-stone-50 h-[300px]">
        {!isGoogleLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-stone-50 z-10 text-stone-400">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-bold">Initializing Maps...</p>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
      </div>

      <div className="flex gap-4">
        <div className="flex-1 bg-stone-50 border border-stone-100 rounded-2xl p-3 flex flex-col items-center justify-center">
          <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Latitude</span>
          <span className="text-xs font-black text-stone-700 mt-1">
            {latitude ? latitude.toFixed(6) : "Not pinned"}
          </span>
        </div>
        <div className="flex-1 bg-stone-50 border border-stone-100 rounded-2xl p-3 flex flex-col items-center justify-center">
          <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Longitude</span>
          <span className="text-xs font-black text-stone-700 mt-1">
            {longitude ? longitude.toFixed(6) : "Not pinned"}
          </span>
        </div>
      </div>
      <p className="text-[10px] text-stone-400 font-bold text-center italic">
        💡 Drag the marker or click anywhere on the map to pin your exact location.
      </p>
    </div>
  )
}
