"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { clientApiPost, clientApiGet } from "@/lib/api-client"
import { ShopLocationForm } from "@/components/vendor/shop-location-form"
import { AlertCircle, Store, ChevronLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function CreateShopPage() {
    const router = useRouter()
    const [vendor, setVendor] = useState<any>(null)
    const [isInitializing, setIsInitializing] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

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

    useEffect(() => {
        const fetchVendor = async () => {
            try {
                const res = await clientApiGet<{ data: any[] }>("vendors")
                if (res.data && res.data.length > 0) {
                    setVendor(res.data[0])

                    // Check if they already have a shop
                    const shopsRes = await clientApiGet<{ data: any[] }>(`vendors/${res.data[0].id}/shops`)
                    if (shopsRes.data && shopsRes.data.length > 0) {
                        router.push("/vendor/dashboard")
                    }
                } else {
                    router.push("/vendor/register")
                }
            } catch (err) {
                console.error("Failed to load vendor", err)
            } finally {
                setIsInitializing(false)
            }
        }
        fetchVendor()
    }, [router])

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

        setIsLoading(true)
        setError(null)

        try {
            await clientApiPost("shops", {
                vendor_id: vendor.id,
                name,
                description,
                address: location.address,
                region: location.region,
                district: location.district,
                ward: location.ward,
                village: location.village,
                street: location.street,
                latitude: location.latitude,
                longitude: location.longitude,
                is_active: true,
            })

            router.push("/vendor/dashboard")
            router.refresh()
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    if (isInitializing) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-stone-500 font-bold uppercase tracking-widest text-[10px]">Initializing Logistics Engine</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#FDFCFB]">
            {/* Header */}
            <header className="border-b bg-white sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/vendor/dashboard" className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                        <span className="text-sm font-bold uppercase tracking-widest">Back to Dashboard</span>
                    </Link>
                    <Image src="/tolalogo.jpg" alt="TOLA" width={100} height={30} className="h-8 w-auto" />
                </div>
            </header>

            <main className="container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto space-y-8">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-stone-900 tracking-tight">Setup Your Shop</h1>
                        <p className="text-stone-500 font-medium">Configure your business presence and location mapping.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <Card className="border-none shadow-2xl shadow-stone-200/50 rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="bg-stone-900 text-white p-10">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                        <Store className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl font-black">Shop Profile</CardTitle>
                                        <CardDescription className="text-stone-400">Basic information about your business</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-10 space-y-8">
                                <div className="space-y-3">
                                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 ml-1">Shop Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="Enter your registered shop name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="h-14 rounded-2xl border-stone-100 bg-stone-50 text-lg font-bold placeholder:text-stone-300 focus:ring-stone-200"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 ml-1">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Describe what you sell and your shop's mission..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={4}
                                        className="rounded-2xl border-stone-100 bg-stone-50 font-medium placeholder:text-stone-300 focus:ring-stone-200"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-2xl shadow-stone-200/50 rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="p-10 pb-0">
                                <div className="flex flex-col gap-1">
                                    <Label className="flex items-center gap-3 text-2xl font-black text-stone-900">
                                        <AlertCircle className="h-6 w-6 text-[#2563EB]" />
                                        Logistics Integration
                                    </Label>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2563EB]/60 ml-9">
                                        Required for Delivery Mapping
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent className="p-10 pt-6">
                                <ShopLocationForm value={location} onChange={setLocation} />
                            </CardContent>
                        </Card>

                        {error && (
                            <div className="p-6 bg-red-50 border border-red-100 rounded-3xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-bottom-2">
                                <AlertCircle className="h-5 w-5" />
                                <p className="text-sm font-black">{error}</p>
                            </div>
                        )}

                        <div className="flex flex-col gap-4">
                            <Button
                                type="submit"
                                className="h-16 rounded-[2rem] bg-stone-900 hover:bg-stone-800 text-lg font-black transition-all hover:scale-[1.02] active:scale-[0.98]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                        Provisioning Shop...
                                    </>
                                ) : "Initialize Business & Launch Shop"}
                            </Button>
                            <p className="text-center text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                By clicking launch, you agree to TOLA's vendor logistics protocols.
                            </p>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}
