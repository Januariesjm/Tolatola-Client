"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import Image from "next/image"
import { HeaderAnimatedText } from "@/components/layout/header-animated-text"
import Link from "next/link"

type VendorType = "producer" | "manufacturer" | "supplier" | "wholesaler" | "retail_trader"

function CompleteProfileContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const from = searchParams.get("from")
    const next = searchParams.get("next")

    const [userType, setUserType] = useState<"customer" | "vendor" | "transporter">("customer")
    const [vendorType, setVendorType] = useState<VendorType | "">("")
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [userEmail, setUserEmail] = useState<string>("")

    useEffect(() => {
        // Get current user to display their email
        const getUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserEmail(user.email || "")

                // If user already has a user_type in metadata (from OAuth maybe?), pre-select it
                if (user.user_metadata?.user_type) {
                    setUserType(user.user_metadata.user_type)
                    if (user.user_metadata.vendor_type) {
                        setVendorType(user.user_metadata.vendor_type)
                    }
                }
            } else {
                // If no user, redirect to login
                router.push("/auth/login")
            }
        }
        getUser()
    }, [router])

    const handleCompleteProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            // Validate vendor type if user is a vendor
            if (userType === "vendor" && !vendorType) {
                setError("Please select your business type")
                setIsLoading(false)
                return
            }

            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                throw new Error("No authenticated user found")
            }

            // 1. Update user metadata in Supabase Auth
            const { error: updateError } = await supabase.auth.updateUser({
                data: {
                    user_type: userType,
                    vendor_type: userType === "vendor" ? vendorType : null
                }
            })

            if (updateError) {
                console.error("Auth metadata update warning:", updateError)
                // We'll continue because the database update is more important
            }

            // 2. Update the users table via our API
            const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
            if (!apiBase) {
                throw new Error("API base URL is not configured")
            }

            const session = await supabase.auth.getSession()
            const response = await fetch(`${apiBase}/users/${user.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.data.session?.access_token}`
                },
                body: JSON.stringify({
                    user_type: userType,
                    vendor_type: userType === "vendor" ? vendorType : null,
                    full_name: user.user_metadata?.full_name // Preserve if available
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Failed to update profile" }))
                throw new Error(errorData.error || "Unable to save your profile choices")
            }

            // Success! Redirect
            if (next) {
                router.push(next)
            } else if (userType === "vendor") {
                router.push("/vendor/dashboard")
            } else if (userType === "transporter") {
                router.push("/transporter/dashboard")
            } else {
                router.push("/shop")
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "An error occurred"
            setError(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse animation-delay-2000" />
            </div>

            <div className="w-full max-w-sm animate-fade-in-up">
                <div className="flex flex-col gap-6">
                    <Link href="/" className="flex items-center gap-3 justify-center hover:scale-105 transition-transform">
                        <Image src="/tolalogo.jpg" alt="TOLA" width={150} height={45} className="h-16 md:h-16 lg:h-20 w-auto" />
                        <HeaderAnimatedText />
                    </Link>
                    <Card className="backdrop-blur-sm bg-card/95 shadow-xl border-primary/10">
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
                            <CardDescription className="text-base">
                                Select how you want to use TOLA to continue.
                            </CardDescription>
                            {userEmail && (
                                <p className="text-xs text-muted-foreground pt-1 italic">
                                    Continue as <span className="font-bold text-primary">{userEmail}</span>
                                </p>
                            )}
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCompleteProfile}>
                                <div className="flex flex-col gap-6">
                                    <div className="grid gap-4">
                                        <Label className="text-sm font-black uppercase tracking-widest text-stone-400">I want to</Label>
                                        <RadioGroup
                                            value={userType}
                                            onValueChange={(value) => {
                                                setUserType(value as "customer" | "vendor" | "transporter")
                                                // Reset vendor type when switching away from vendor
                                                if (value !== "vendor") {
                                                    setVendorType("")
                                                }
                                            }}
                                            className="gap-3"
                                        >
                                            <div className="flex items-center space-x-3 p-4 rounded-xl border border-stone-100 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
                                                <RadioGroupItem value="customer" id="customer" className="text-primary" />
                                                <Label htmlFor="customer" className="font-bold cursor-pointer flex-1 text-stone-700 group-hover:text-primary transition-colors capitalize">
                                                    shop for products
                                                </Label>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-3 p-4 rounded-xl border border-stone-100 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
                                                    <RadioGroupItem value="vendor" id="vendor" />
                                                    <Label htmlFor="vendor" className="font-bold cursor-pointer flex-1 text-stone-700 group-hover:text-primary transition-colors capitalize">
                                                        sell my products
                                                    </Label>
                                                </div>
                                                {userType === "vendor" && (
                                                    <div className="ml-9 pr-3 pb-2 animate-in slide-in-from-left-2 duration-300">
                                                        <Select value={vendorType} onValueChange={(value) => setVendorType(value as VendorType)}>
                                                            <SelectTrigger id="vendorType" className="h-11 border-stone-200 focus:ring-primary/20">
                                                                <SelectValue placeholder="Select your business type" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="producer">Producer</SelectItem>
                                                                <SelectItem value="manufacturer">Manufacturer</SelectItem>
                                                                <SelectItem value="supplier">Supplier</SelectItem>
                                                                <SelectItem value="wholesaler">Wholesaler</SelectItem>
                                                                <SelectItem value="retail_trader">Retail Trader</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center space-x-3 p-4 rounded-xl border border-stone-100 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
                                                <RadioGroupItem value="transporter" id="transporter" />
                                                <Label htmlFor="transporter" className="font-bold cursor-pointer flex-1 text-stone-700 group-hover:text-primary transition-colors capitalize">
                                                    provide transport services
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                    {error && (
                                        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 animate-shake">
                                            <p className="text-sm text-destructive text-center font-medium">{error}</p>
                                        </div>
                                    )}
                                    <Button
                                        type="submit"
                                        className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center gap-2">
                                                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                                Finalizing Account...
                                            </span>
                                        ) : "Start Using Tolatola"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                    <p className="text-center text-xs text-stone-400">
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function CompleteProfilePage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-primary/5 via-background to-accent/5">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        }>
            <CompleteProfileContent />
        </Suspense>
    )
}
