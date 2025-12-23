"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Upload } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { HeaderAnimatedText } from "@/components/layout/header-animated-text"
import { CheckCircle } from "lucide-react"

export default function VendorRegisterPageClient() {
  const [businessName, setBusinessName] = useState("")
  const [tinNumber, setTinNumber] = useState("")
  const [nidaNumber, setNidaNumber] = useState("")
  const [businessLicense, setBusinessLicense] = useState<File | null>(null)
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
      const vendorData = {
        user_id: user.id,
        business_name: businessName,
        tin_number: tinNumber,
        nida_number: nidaNumber,
        business_license_url: businessLicenseUrl,
        kyc_status: "pending",
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
      <div className="w-full max-w-2xl">
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
                    <Label htmlFor="nidaNumber">NIDA Number *</Label>
                    <Input
                      id="nidaNumber"
                      type="text"
                      placeholder="Your NIDA Number"
                      required
                      value={nidaNumber}
                      onChange={(e) => setNidaNumber(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="businessLicense">Business License (Optional)</Label>
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
