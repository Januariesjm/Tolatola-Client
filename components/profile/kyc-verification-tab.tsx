"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldCheck, AlertCircle, CheckCircle, Upload, Camera, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface KycVerificationTabProps {
  kyc: any
  userId: string
}

export default function KycVerificationTab({ kyc, userId }: KycVerificationTabProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    full_name: kyc?.full_name || "",
    date_of_birth: kyc?.date_of_birth || "",
    phone_number: kyc?.phone_number || "",
    address: kyc?.address || "",
    city: kyc?.city || "",
    region: kyc?.region || "",
    postal_code: kyc?.postal_code || "",
    id_type: kyc?.id_type || "nida",
    id_number: kyc?.id_number || "",
    id_document_front_url: kyc?.id_document_front_url || "",
    id_document_back_url: kyc?.id_document_back_url || "",
    selfie_url: kyc?.selfie_url || "",
  })

  const handleFileUpload = async (file: File, documentType: string) => {
    setUploadingDoc(documentType)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("documentType", documentType)

      const response = await fetch("/api/kyc/upload-document", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()

      // Update form data with the uploaded file URL
      setFormData((prev) => ({
        ...prev,
        [`${documentType}_url`]: data.url,
      }))
    } catch (error) {
      console.error("Error uploading file:", error)
      alert("Failed to upload file. Please try again.")
    } finally {
      setUploadingDoc(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/kyc/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, user_id: userId }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error("Error submitting KYC:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusAlert = () => {
    if (!kyc) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Complete your KYC verification to unlock full Digital trade and Supply Chain Ecosystem features and build trust with vendors.
          </AlertDescription>
        </Alert>
      )
    }

    switch (kyc.kyc_status) {
      case "approved":
        return (
          <Alert className="border-green-600 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              Your identity has been verified. You can now enjoy full Digital trade and Supply Chain Ecosystem access.
            </AlertDescription>
          </Alert>
        )
      case "pending":
        return (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your KYC application is under review. We'll notify you once it's processed.
            </AlertDescription>
          </Alert>
        )
      case "rejected":
        return (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your KYC application was rejected. {kyc.kyc_notes && `Reason: ${kyc.kyc_notes}`}
            </AlertDescription>
          </Alert>
        )
      case "changes_requested":
        return (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Changes requested: {kyc.kyc_notes}. Please update your information and resubmit.
            </AlertDescription>
          </Alert>
        )
    }
  }

  const canEdit = !kyc || kyc.kyc_status === "rejected" || kyc.kyc_status === "changes_requested"

  const DocumentUpload = ({
    label,
    documentType,
    currentUrl,
    required = false,
    description,
  }: {
    label: string
    documentType: string
    currentUrl: string
    required?: boolean
    description: string
  }) => (
    <div className="space-y-2">
      <Label htmlFor={documentType}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>

      {currentUrl && (
        <div className="relative">
          <img
            src={currentUrl || "/placeholder.svg"}
            alt={label}
            className="w-full h-48 object-cover rounded-lg border"
          />
          {canEdit && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => setFormData({ ...formData, [`${documentType}_url`]: "" })}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {canEdit && !currentUrl && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              disabled={uploadingDoc === documentType}
              onClick={() => document.getElementById(`${documentType}-file`)?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadingDoc === documentType ? "Uploading..." : "Choose File"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              disabled={uploadingDoc === documentType}
              onClick={() => document.getElementById(`${documentType}-camera`)?.click()}
            >
              <Camera className="h-4 w-4 mr-2" />
              Take Photo
            </Button>
          </div>

          <input
            id={`${documentType}-file`}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload(file, documentType)
            }}
          />

          <input
            id={`${documentType}-camera`}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload(file, documentType)
            }}
          />

          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {getStatusAlert()}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                KYC Verification
              </CardTitle>
              <CardDescription>Verify your identity to access all Digital trade and Supply Chain Ecosystem features</CardDescription>
            </div>
            {kyc && (
              <Badge
                variant={
                  kyc.kyc_status === "approved"
                    ? "default"
                    : kyc.kyc_status === "rejected"
                      ? "destructive"
                      : "secondary"
                }
              >
                {kyc.kyc_status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name (as per ID)</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  disabled={!canEdit}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  disabled={!canEdit}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  disabled={!canEdit}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={!canEdit}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  disabled={!canEdit}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code (Optional)</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Full Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={!canEdit}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id_type">ID Type</Label>
                <Select
                  value={formData.id_type}
                  onValueChange={(value) => setFormData({ ...formData, id_type: value })}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nida">NIDA (National ID)</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="drivers_license">Driver's License</SelectItem>
                    <SelectItem value="voters_id">Voter's ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="id_number">ID Number</Label>
                <Input
                  id="id_number"
                  value={formData.id_number}
                  onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                  disabled={!canEdit}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <DocumentUpload
                label="ID Document (Front)"
                documentType="id_document_front"
                currentUrl={formData.id_document_front_url}
                required
                description="Upload a clear photo of the front of your ID document"
              />

              <DocumentUpload
                label="ID Document (Back)"
                documentType="id_document_back"
                currentUrl={formData.id_document_back_url}
                description="Upload a clear photo of the back of your ID document (if applicable)"
              />

              <DocumentUpload
                label="Selfie with ID"
                documentType="selfie"
                currentUrl={formData.selfie_url}
                required
                description="Take a selfie holding your ID next to your face"
              />
            </div>

            {canEdit && (
              <Button type="submit" disabled={isLoading || uploadingDoc !== null} className="w-full">
                {isLoading ? "Submitting..." : kyc ? "Resubmit KYC" : "Submit KYC"}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
