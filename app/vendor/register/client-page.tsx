"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Upload, Building2, User, CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { HeaderAnimatedText } from "@/components/layout/header-animated-text"

type KYCType = "individual" | "company"

export default function VendorRegisterPageClient() {
  const [kycType, setKycType] = useState<KYCType>("individual")

  // Common fields
  const [phoneNumber, setPhoneNumber] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [tinNumber, setTinNumber] = useState("")
  const [location, setLocation] = useState("")
  const [businessLicense, setBusinessLicense] = useState<File | null>(null)

  // Company representative fields
  const [repFullName, setRepFullName] = useState("")
  const [repPhone, setRepPhone] = useState("")
  const [repTin, setRepTin] = useState("")
  const [repNationalId, setRepNationalId] = useState("")

  const [isUploadingLicense, setIsUploadingLicense] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      console.log("[v0] Vendor register - User:", user?.id)

      if (!user) {
        router.push("/auth/login")
        return
      }
      setUser(user)

      const { data: existingVendor, error: vendorError } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()

      console.log("[v0] Vendor register - Existing vendor:", existingVendor, "Error:", vendorError)

      if (existingVendor) {
        router.push("/vendor/dashboard")
      }
    }
    checkUser()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    console.log("[v0] Vendor register - Starting submission...")

    try {
      let businessLicenseUrl = ""

      if (businessLicense) {
        setIsUploadingLicense(true)
        console.log("[v0] Vendor register - Uploading business license...")
        const formData = new FormData()
        formData.append("file", businessLicense)

        const uploadResponse = await fetch("/api/upload-business-license", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json()
          throw new Error(errorData.error || "Failed to upload business license")
        }

        const { url } = await uploadResponse.json()
        businessLicenseUrl = url
        setIsUploadingLicense(false)
        console.log("[v0] Vendor register - Business license uploaded:", businessLicenseUrl)
      }

      console.log("[v0] Vendor register - Creating vendor record...")
      const vendorData: any = {
        user_id: user.id,
        kyc_type: kycType,
        phone_number: phoneNumber,
        business_name: businessName,
        tin_number: tinNumber,
        location: location,
        business_license_url: businessLicenseUrl,
        kyc_status: "pending",
      }

      // Add company representative fields if company type
      if (kycType === "company") {
        vendorData.representative_full_name = repFullName
        vendorData.representative_phone = repPhone
        vendorData.representative_tin = repTin
        vendorData.representative_national_id = repNationalId
      }

      console.log("[v0] Vendor register - Vendor data:", vendorData)

      const { data: createdVendor, error: vendorError } = await supabase
        .from("vendors")
        .insert(vendorData)
        .select()
        .single()

      console.log("[v0] Vendor register - Created vendor:", createdVendor, "Error:", vendorError)

      if (vendorError) {
        console.error("[v0] Vendor register - Error details:", JSON.stringify(vendorError, null, 2))
        throw vendorError
      }

      console.log("[v0] Vendor register - Success! Redirecting to KYC pending...")
      router.push("/vendor/kyc-pending")
    } catch (error: unknown) {
      console.error("[v0] Vendor register - Caught error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
      setIsUploadingLicense(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-muted/30">
      <div className="w-full max-w-3xl">
        <div className="flex flex-col gap-6">
          <Link href="/" className="flex items-center gap-3 justify-center hover:scale-105 transition-transform">
            <Image src="/tolalogo.jpg" alt="TOLA" width={120} height={40} className="h-12 w-auto" />
            <HeaderAnimatedText />
          </Link>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Vendor Registration</CardTitle>
              <CardDescription>Complete your KYC to start selling on our platform</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6">

                  {/* KYC Type Selection */}
                  <div className="grid gap-4">
                    <Label className="text-base font-bold">Select KYC Type *</Label>
                    <RadioGroup value={kycType} onValueChange={(value) => setKycType(value as KYCType)}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label
                          htmlFor="individual"
                          className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${kycType === "individual" ? "border-primary bg-primary/5" : "border-stone-200 hover:border-primary/50"
                            }`}
                        >
                          <RadioGroupItem value="individual" id="individual" />
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-bold text-sm">Individual / Sole Trader</p>
                              <p className="text-xs text-muted-foreground">For individual sellers</p>
                            </div>
                          </div>
                        </label>

                        <label
                          htmlFor="company"
                          className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${kycType === "company" ? "border-primary bg-primary/5" : "border-stone-200 hover:border-primary/50"
                            }`}
                        >
                          <RadioGroupItem value="company" id="company" />
                          <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-bold text-sm">Company</p>
                              <p className="text-xs text-muted-foreground">For registered companies</p>
                            </div>
                          </div>
                        </label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Common Fields */}
                  <div className="grid gap-4 pt-4 border-t">
                    <h3 className="font-bold text-sm uppercase tracking-wide text-stone-500">Business Information</h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="phoneNumber">Phone Number *</Label>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          placeholder="+255 XXX XXX XXX"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="businessName">Business Name *</Label>
                        <Input
                          id="businessName"
                          type="text"
                          placeholder="Your Business Name"
                          required
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="tinNumber">TIN Number *</Label>
                        <Input
                          id="tinNumber"
                          type="text"
                          placeholder="123-456-789"
                          required
                          value={tinNumber}
                          onChange={(e) => setTinNumber(e.target.value)}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="location">Location *</Label>
                        <Input
                          id="location"
                          type="text"
                          placeholder="City, Region"
                          required
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="businessLicense">Valid Business License *</Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor="businessLicense"
                            className="flex-1 flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                          >
                            <Upload className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {businessLicense ? businessLicense.name : "Choose file..."}
                            </span>
                          </label>
                          <Input
                            id="businessLicense"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            required
                            onChange={(e) => setBusinessLicense(e.target.files?.[0] || null)}
                            className="hidden"
                          />
                        </div>
                        {businessLicense && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>File selected: {(businessLicense.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">Upload PDF, JPG, or PNG (Max 5MB)</p>
                      </div>
                    </div>
                  </div>

                  {/* Company Representative Fields */}
                  {kycType === "company" && (
                    <div className="grid gap-4 pt-4 border-t">
                      <h3 className="font-bold text-sm uppercase tracking-wide text-stone-500">
                        Company Representative (Director / Secretary)
                      </h3>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="repFullName">Full Name *</Label>
                          <Input
                            id="repFullName"
                            type="text"
                            placeholder="Representative's Full Name"
                            required={kycType === "company"}
                            value={repFullName}
                            onChange={(e) => setRepFullName(e.target.value)}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="repPhone">Phone Number *</Label>
                          <Input
                            id="repPhone"
                            type="tel"
                            placeholder="+255 XXX XXX XXX"
                            required={kycType === "company"}
                            value={repPhone}
                            onChange={(e) => setRepPhone(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="repTin">TIN Number *</Label>
                          <Input
                            id="repTin"
                            type="text"
                            placeholder="123-456-789"
                            required={kycType === "company"}
                            value={repTin}
                            onChange={(e) => setRepTin(e.target.value)}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="repNationalId">National ID *</Label>
                          <Input
                            id="repNationalId"
                            type="text"
                            placeholder="NIDA Number"
                            required={kycType === "company"}
                            value={repNationalId}
                            onChange={(e) => setRepNationalId(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button type="submit" className="w-full" disabled={isLoading || isUploadingLicense}>
                    {isUploadingLicense ? "Uploading document..." : isLoading ? "Submitting..." : "Submit for Review"}
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
