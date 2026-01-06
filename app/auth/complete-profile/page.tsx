"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { HeaderAnimatedText } from "@/components/layout/header-animated-text"
import Link from "next/link"

type VendorType = "producer" | "manufacturer" | "supplier" | "wholesaler" | "retail_trader"

export default function CompleteProfilePage() {
    const router = useRouter()
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
                setError("Please select a vendor type")
                setIsLoading(false)
                return
            }

            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                throw new Error("No authenticated user found")
            }

            // Update user metadata
            const { error: updateError } = await supabase.auth.updateUser({
                data: {
                    user_type: userType,
                    vendor_type: userType === "vendor" ? vendorType : null
                }
            })

            if (updateError) {
                throw updateError
            }

            // Also update the users table via API
            const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
            if (apiBase) {
                try {
                    const response = await fetch(`${apiBase}/users/${user.id}`, {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                        },
                        body: JSON.stringify({
                            user_type: userType,
                            vendor_type: userType === "vendor" ? vendorType : null
                        })
                    })

                    if (!response.ok) {
                        console.error("Failed to update user table, but metadata updated")
                    }
                } catch (err) {
                    console.error("API update failed, but metadata updated:", err)
                }
            }

            // Success! Redirect to home
            router.push("/")
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
                            <CardDescription>
                                Welcome! Tell us a bit more about yourself to get started.
                            </CardDescription>
                            {userEmail && (
                                <p className="text-sm text-muted-foreground pt-2">
                                    Signed in as: <span className="font-medium">{userEmail}</span>
                                </p>
                            )}
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCompleteProfile}>
                                <div className="flex flex-col gap-6">
                                    <div className="grid gap-2">
                                        <Label>I want to</Label>
                                        <RadioGroup
                                            value={userType}
                                            onValueChange={(value) => {
                                                setUserType(value as "customer" | "vendor" | "transporter")
                                                // Reset vendor type when switching away from vendor
                                                if (value !== "vendor") {
                                                    setVendorType("")
                                                }
                                            }}
                                        >
                                            <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                                                <RadioGroupItem value="customer" id="customer" />
                                                <Label htmlFor="customer" className="font-normal cursor-pointer flex-1">
                                                    Buy products (Consumer)
                                                </Label>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                                                    <RadioGroupItem value="vendor" id="vendor" />
                                                    <Label htmlFor="vendor" className="font-normal cursor-pointer flex-1">
                                                        Sell products (Vendor)
                                                    </Label>
                                                </div>
                                                {userType === "vendor" && (
                                                    <div className="ml-8 pr-3 pb-2">
                                                        <Select value={vendorType} onValueChange={(value) => setVendorType(value as VendorType)}>
                                                            <SelectTrigger id="vendorType" className="transition-all focus:scale-[1.02]">
                                                                <SelectValue placeholder="Select your vendor type" />
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
                                            <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                                                <RadioGroupItem value="transporter" id="transporter" />
                                                <Label htmlFor="transporter" className="font-normal cursor-pointer flex-1">
                                                    Transport products (Transporter)
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                    {error && (
                                        <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md animate-shake">{error}</p>
                                    )}
                                    <Button
                                        type="submit"
                                        className="w-full transition-all hover:scale-[1.02]"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Completing profile..." : "Complete Profile"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
