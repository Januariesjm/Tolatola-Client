"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Upload, CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { HeaderAnimatedText } from "@/components/layout/header-animated-text"

export default function TransporterRegisterClient() {
  const [businessName, setBusinessName] = useState("")
  const [vehicleType, setVehicleType] = useState("")
  const [vehicleRegistration, setVehicleRegistration] = useState("")
  const [licenseNumber, setLicenseNumber] = useState("")
  const [region, setRegion] = useState("")
  const [district, setDistrict] = useState("")
  const [phone, setPhone] = useState("")
  const [idDocument, setIdDocument] = useState<File | null>(null)
  const [driverLicense, setDriverLicense] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  const vehicleTypes = [
    { value: "bodaboda", label: "Bodaboda" },
    { value: "bajaj", label: "Bajaj" },
    { value: "car", label: "Car" },
    { value: "canter", label: "Canter (Fuso)" },
    { value: "semi_trailer", label: "Semi Trailer" },
    { value: "flight", label: "Flight" },
  ]

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }
      setUser(user)

      const { data: existingTransporter } = await supabase
        .from("transporters")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()

      if (existingTransporter) {
        router.push("/transporter/dashboard")
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

    try {
      let idDocumentUrl = ""
      let driverLicenseUrl = ""

      if (idDocument) {
        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", idDocument)

        const uploadResponse = await fetch("/api/upload-transporter-document", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json()
          throw new Error(errorData.error || "Failed to upload ID document")
        }

        const { url } = await uploadResponse.json()
        idDocumentUrl = url
      }

      if (driverLicense) {
        const formData = new FormData()
        formData.append("file", driverLicense)

        const uploadResponse = await fetch("/api/upload-transporter-document", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json()
          throw new Error(errorData.error || "Failed to upload driver license")
        }

        const { url } = await uploadResponse.json()
        driverLicenseUrl = url
      }

      setIsUploading(false)

      // Create transporter via backend API
      const { clientApiPost } = await import("@/lib/api-client")
      const transporterData = {
        business_name: businessName,
        vehicle_type: vehicleType,
        vehicle_registration: vehicleRegistration,
        license_number: licenseNumber,
        region,
        district,
        phone,
        id_document_url: idDocumentUrl,
        driver_license_url: driverLicenseUrl,
        kyc_status: "pending",
      }

      await clientApiPost("transporters", transporterData)
      router.push("/transporter/kyc-pending")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
      setIsUploading(false)
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
            <Image src="/logo-new.png" alt="TOLA" width={120} height={40} className="h-12 w-auto" />
            <HeaderAnimatedText />
          </Link>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Transporter Registration</CardTitle>
              <CardDescription>Complete your KYC to start delivering on our platform</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      type="text"
                      placeholder="Your Business Name (Optional)"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="vehicleType">Vehicle Type *</Label>
                    <Select value={vehicleType} onValueChange={setVehicleType} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="vehicleRegistration">Vehicle Registration Number *</Label>
                    <Input
                      id="vehicleRegistration"
                      type="text"
                      placeholder="T123ABC"
                      required
                      value={vehicleRegistration}
                      onChange={(e) => setVehicleRegistration(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="licenseNumber">Driver License Number *</Label>
                    <Input
                      id="licenseNumber"
                      type="text"
                      placeholder="Your License Number"
                      required
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="region">Region *</Label>
                      <Input
                        id="region"
                        type="text"
                        placeholder="e.g., Dar es Salaam"
                        required
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="district">District *</Label>
                      <Input
                        id="district"
                        type="text"
                        placeholder="e.g., Kinondoni"
                        required
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+255 XXX XXX XXX"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="idDocument">ID Document (NIDA/Passport) *</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="idDocument"
                          className="flex-1 flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {idDocument ? idDocument.name : "Choose file..."}
                          </span>
                        </label>
                        <Input
                          id="idDocument"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          required
                          onChange={(e) => setIdDocument(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </div>
                      {idDocument && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>File selected: {(idDocument.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="driverLicense">Driver License Document *</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="driverLicense"
                          className="flex-1 flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {driverLicense ? driverLicense.name : "Choose file..."}
                          </span>
                        </label>
                        <Input
                          id="driverLicense"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          required
                          onChange={(e) => setDriverLicense(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </div>
                      {driverLicense && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>File selected: {(driverLicense.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button type="submit" className="w-full" disabled={isLoading || isUploading}>
                    {isUploading ? "Uploading documents..." : isLoading ? "Submitting..." : "Submit for Review"}
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
