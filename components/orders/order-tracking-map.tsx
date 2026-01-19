"use client"

import { useEffect, useRef, useState } from "react"
import { getGoogleMapsScriptUrl } from "@/app/actions/maps"
import { Loader2 } from "lucide-react"

interface Location {
    lat: number
    lng: number
    address?: string
}

interface OrderTrackingMapProps {
    origin: Location
    destination: Location
    transporterLocation?: Location | null
    className?: string
}

declare global {
    interface Window {
        google: any
        initGoogleMapsCallback?: () => void
    }
}

export function OrderTrackingMap({ origin, destination, transporterLocation, className }: OrderTrackingMapProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const [map, setMap] = useState<any>(null)
    const [scriptLoaded, setScriptLoaded] = useState(false)
    const [markers, setMarkers] = useState<any[]>([])
    const [directionsRenderer, setDirectionsRenderer] = useState<any>(null)

    useEffect(() => {
        let script: HTMLScriptElement | null = null

        const loadMap = async () => {
            if (window.google?.maps) {
                setScriptLoaded(true)
                return
            }

            const scriptUrl = await getGoogleMapsScriptUrl()
            if (!scriptUrl) return

            // Check if script already exists
            const existingScript = document.querySelector(`script[src^="${scriptUrl.split('?')[0]}"]`)
            if (existingScript) {
                if (window.google?.maps) {
                    setScriptLoaded(true)
                } else {
                    existingScript.addEventListener("load", () => setScriptLoaded(true))
                }
                return
            }

            window.initGoogleMapsCallback = () => {
                setScriptLoaded(true)
            }

            script = document.createElement("script")
            script.src = scriptUrl
            script.async = true
            script.defer = true
            document.head.appendChild(script)
        }

        loadMap()

        return () => {
            // Cleanup if needed
        }
    }, [])

    // Initialize Map
    useEffect(() => {
        if (scriptLoaded && mapRef.current && !map) {
            const google = window.google
            const mapInstance = new google.maps.Map(mapRef.current, {
                center: { lat: -6.7924, lng: 39.2083 }, // Default to Dar es Salaam
                zoom: 12,
                mapTypeControl: false,
                fullscreenControl: true,
                streetViewControl: false,
                styles: [
                    {
                        featureType: "poi",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }],
                    },
                ],
            })

            const renderer = new google.maps.DirectionsRenderer({
                map: mapInstance,
                suppressMarkers: true,
                polylineOptions: {
                    strokeColor: "#2563eb",
                    strokeWeight: 5,
                },
            })

            setMap(mapInstance)
            setDirectionsRenderer(renderer)
        }
    }, [scriptLoaded, mapRef])

    // Update Markers & Route
    useEffect(() => {
        if (!map || !window.google) return

        const google = window.google

        // Clear existing markers
        markers.forEach((marker) => marker.setMap(null))
        const newMarkers: any[] = []

        // 1. Origin Marker (Shop)
        const originMarker = new google.maps.Marker({
            position: { lat: origin.lat, lng: origin.lng },
            map,
            title: "Shop",
            icon: {
                url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                scaledSize: new google.maps.Size(40, 40),
            },
        })
        newMarkers.push(originMarker)

        // 2. Destination Marker (Customer)
        const destMarker = new google.maps.Marker({
            position: { lat: destination.lat, lng: destination.lng },
            map,
            title: "Delivery Location",
            icon: {
                url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                scaledSize: new google.maps.Size(40, 40),
            },
        })
        newMarkers.push(destMarker)

        // 3. Transporter Marker (Truck)
        if (transporterLocation) {
            const truckMarker = new google.maps.Marker({
                position: { lat: transporterLocation.lat, lng: transporterLocation.lng },
                map,
                title: "Transporter",
                icon: {
                    path: "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
                    fillColor: "#000000",
                    fillOpacity: 1,
                    strokeWeight: 0,
                    scale: 1.5,
                    anchor: new google.maps.Point(0, 20),
                },
            })
            newMarkers.push(truckMarker)
        }

        setMarkers(newMarkers)

        // Calculate Route
        const directionsService = new google.maps.DirectionsService()
        directionsService.route(
            {
                origin: { lat: origin.lat, lng: origin.lng },
                destination: { lat: destination.lat, lng: destination.lng },
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (result: any, status: any) => {
                if (status === google.maps.DirectionsStatus.OK) {
                    directionsRenderer.setDirections(result)
                } else {
                    console.error(`Directions request failed due to ${status}`)
                }
            }
        )

        // Fit Bounds
        const bounds = new google.maps.LatLngBounds()
        bounds.extend({ lat: origin.lat, lng: origin.lng })
        bounds.extend({ lat: destination.lat, lng: destination.lng })
        if (transporterLocation) {
            bounds.extend({ lat: transporterLocation.lat, lng: transporterLocation.lng })
        }
        map.fitBounds(bounds)
        // Zoom out simple slighty
        const listener = google.maps.event.addListener(map, "idle", () => {
            if (map.getZoom() > 14) map.setZoom(14);
            google.maps.event.removeListener(listener);
        });

    }, [map, origin, destination, transporterLocation])

    if (!scriptLoaded) {
        return (
            <div className={`flex items-center justify-center bg-muted rounded-lg ${className}`} style={{ minHeight: "300px" }}>
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Loading Map...</p>
                </div>
            </div>
        )
    }

    return <div ref={mapRef} className={`rounded-lg overflow-hidden border shadow-sm ${className}`} style={{ minHeight: "350px", width: "100%" }} />
}
