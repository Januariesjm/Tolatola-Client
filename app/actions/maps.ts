"use server"

interface DistanceResult {
  distanceKm: number
  deliveryFee: number
  duration?: string
}

interface GeocodeResult {
  latitude: number
  longitude: number
  formattedAddress: string
}

// Base location (Dar es Salaam city center)
const BASE_LOCATION = {
  lat: -6.7924,
  lng: 39.2083,
  address: "Dar es Salaam, Tanzania",
}

// Calculate delivery fee based on distance
function calculateDeliveryFee(distanceKm: number): number {
  if (distanceKm <= 5) return 3000
  if (distanceKm <= 10) return 5000
  if (distanceKm <= 20) return 8000
  if (distanceKm <= 30) return 12000
  return 15000
}

export async function getGoogleMapsScriptUrl(): Promise<string | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.error("[v0] Google Maps API key not found. Make sure GOOGLE_MAPS_API_KEY is set.")
    return null
  }

  console.log("[v0] Returning Google Maps script URL with API key configured")

  return `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async&callback=initGoogleMapsCallback`
}

export async function calculateDeliveryDistance(
  region: string,
  district?: string,
  ward?: string,
): Promise<DistanceResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.error("[v0] Google Maps API key not found")
    return null
  }

  console.log("[v0] Calculating delivery with:", { region, district, ward })

  try {
    // Build destination address with priority: Ward > District > Region
    let destinationAddress = ""

    if (ward && district && region) {
      destinationAddress = `${ward} Ward, ${district} District, ${region} Region, Tanzania`
    } else if (district && region) {
      destinationAddress = `${district} District, ${region} Region, Tanzania`
    } else if (region) {
      destinationAddress = `${region} Region, Tanzania`
    } else {
      console.error("[v0] No location data provided")
      return null
    }

    console.log("[v0] Using destination address:", destinationAddress)

    // Try Distance Matrix API first
    const distanceResponse = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(BASE_LOCATION.address)}&destinations=${encodeURIComponent(destinationAddress)}&units=metric&key=${apiKey}`,
    )

    const distanceData = await distanceResponse.json()

    console.log("[v0] Distance Matrix response status:", distanceData.status)

    if (distanceData.status === "OK" && distanceData.rows?.[0]?.elements?.[0]?.status === "OK") {
      const element = distanceData.rows[0].elements[0]
      const distanceKm = element.distance.value / 1000
      const duration = element.duration.text
      const deliveryFee = calculateDeliveryFee(distanceKm)

      console.log("[v0] Distance calculated successfully:", { distanceKm, deliveryFee })

      return {
        distanceKm: Math.round(distanceKm * 10) / 10,
        deliveryFee,
        duration,
      }
    }

    // If Distance Matrix fails, try Geocoding as fallback
    console.log("[v0] Distance Matrix failed, trying Geocoding fallback")

    const geocodeResponse = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destinationAddress)}&key=${apiKey}`,
    )

    const geocodeData = await geocodeResponse.json()

    if (geocodeData.status === "OK" && geocodeData.results?.[0]?.geometry?.location) {
      const location = geocodeData.results[0].geometry.location

      // Calculate straight-line distance using Haversine formula
      const distanceKm = calculateHaversineDistance(BASE_LOCATION.lat, BASE_LOCATION.lng, location.lat, location.lng)

      // Add 20% to straight-line distance for actual road distance estimate
      const estimatedRoadDistance = distanceKm * 1.2

      const deliveryFee = calculateDeliveryFee(estimatedRoadDistance)

      console.log("[v0] Geocoding fallback successful:", { distanceKm: estimatedRoadDistance, deliveryFee })

      return {
        distanceKm: Math.round(estimatedRoadDistance * 10) / 10,
        deliveryFee,
        duration: estimateDeliveryTime(estimatedRoadDistance),
      }
    }

    // If ward-level fails, try with less specific address
    if (ward && district && region) {
      console.log("[v0] Ward-level failed, retrying with district only")
      return calculateDeliveryDistance(region, district)
    }

    if (district && region) {
      console.log("[v0] District-level failed, retrying with region only")
      return calculateDeliveryDistance(region)
    }

    console.error("[v0] All fallback attempts failed")
    return null
  } catch (error) {
    console.error("[v0] Distance calculation error:", error)
    return null
  }
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.error("[v0] Google Maps API key not found")
    return null
  }

  try {
    const geocodeResponse = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`,
    )

    const geocodeData = await geocodeResponse.json()

    if (geocodeData.status === "OK" && geocodeData.results?.[0]?.geometry?.location) {
      const location = geocodeData.results[0].geometry.location
      const formattedAddress = geocodeData.results[0].formatted_address

      return {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress,
      }
    }

    console.error("[v0] Geocoding failed:", geocodeData.status)
    return null
  } catch (error) {
    console.error("[v0] Geocoding error:", error)
    return null
  }
}

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

function estimateDeliveryTime(distanceKm: number): string {
  // Assume average speed of 30 km/h in urban areas
  const hours = distanceKm / 30
  const minutes = Math.round(hours * 60)

  if (minutes < 60) {
    return `${minutes} mins`
  } else {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h} hour${h > 1 ? "s" : ""} ${m} mins` : `${h} hour${h > 1 ? "s" : ""}`
  }
}

export interface TransportMethod {
  id: string
  name: string
  rate_per_km: number | null
  rate_per_kg: number | null
  description: string
}

export async function getTransportMethods(): Promise<TransportMethod[]> {
  const { createClient } = await import("@/lib/supabase/server")
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("transport_methods")
    .select("*")
    .eq("is_active", true)
    .order("rate_per_km", { ascending: true, nullsFirst: false })

  if (error) {
    console.error("[v0] Error fetching transport methods:", error)
    return []
  }

  return data || []
}

export async function calculateTransportDeliveryFee(
  distanceKm: number,
  weightKg: number,
  transportMethodId?: string,
): Promise<{
  deliveryFee: number
  transportMethod: string
  transportMethodId: string
}> {
  const { createClient } = await import("@/lib/supabase/server")
  const supabase = await createClient()

  // If no transport method specified, recommend based on distance and weight
  if (!transportMethodId) {
    // Auto-select based on distance and weight
    if (weightKg > 100) {
      transportMethodId = "Semi Trailer"
    } else if (weightKg > 50) {
      transportMethodId = "Canter (Fuso)"
    } else if (distanceKm > 30) {
      transportMethodId = "Car"
    } else if (distanceKm > 15) {
      transportMethodId = "Bajaj"
    } else {
      transportMethodId = "Bodaboda"
    }
  }

  const { data: method } = await supabase
    .from("transport_methods")
    .select("*")
    .or(`id.eq.${transportMethodId},name.eq.${transportMethodId}`)
    .single()

  if (!method) {
    // Fallback to default calculation
    return {
      deliveryFee: calculateDeliveryFee(distanceKm),
      transportMethod: "Standard",
      transportMethodId: "",
    }
  }

  let deliveryFee = 0

  if (method.rate_per_kg) {
    // Flight uses per kg rate
    deliveryFee = weightKg * method.rate_per_kg
  } else if (method.rate_per_km) {
    // Other methods use per km rate
    deliveryFee = distanceKm * method.rate_per_km
  }

  return {
    deliveryFee: Math.round(deliveryFee),
    transportMethod: method.name,
    transportMethodId: method.id,
  }
}
