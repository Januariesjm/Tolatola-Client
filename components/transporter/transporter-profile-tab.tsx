"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Upload, CheckCircle2, Truck, User } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface TransporterProfileTabProps {
    user: any
    transporter: any
}

export function TransporterProfileTab({ user, transporter }: TransporterProfileTabProps) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()

    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isUploadingImage, setIsUploadingImage] = useState(false)
    const [previewImage, setPreviewImage] = useState(user?.user_metadata?.avatar_url || "")

    // Combine user and transporter data into initial form state
    const [formData, setFormData] = useState({
        // User fields (from 'users' table)
        full_name: user?.user_metadata?.full_name || "",
        phone: user?.phone || "",
        address: user?.user_metadata?.address || "",

        // Transporter fields (from 'transporters' table)
        business_name: transporter?.business_name || "",
        vehicle_type: transporter?.vehicle_type || "",
        license_plate: transporter?.license_plate || "",
    })

    const getInitials = (name: string) => {
        if (!name) return "T"
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploadingImage(true)

        try {
            // Create a preview
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreviewImage(reader.result as string)
            }
            reader.readAsDataURL(file)

            // Upload to server
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch("/api/profile/upload-image", {
                method: "POST",
                body: formData,
            })

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Profile picture updated successfully",
                })
                router.refresh()
            } else {
                throw new Error("Upload failed")
            }
        } catch (error) {
            console.error("Error uploading image:", error)
            toast({
                title: "Error",
                description: "Failed to upload image. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsUploadingImage(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // 1. Update User Profile
            const userUpdateRes = await fetch("/api/profile/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: formData.full_name,
                    phone: formData.phone,
                    address: formData.address,
                }),
            })

            if (!userUpdateRes.ok) throw new Error("Failed to update user profile")

            // 2. Update Transporter Details
            const transporterUpdateRes = await fetch("/api/transporters/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    business_name: formData.business_name,
                    vehicle_type: formData.vehicle_type,
                    license_plate: formData.license_plate,
                }),
            })

            if (!transporterUpdateRes.ok) throw new Error("Failed to update transporter details")

            toast({
                title: "Success",
                description: "Profile updated successfully",
            })

            setIsEditing(false)
            router.refresh()
        } catch (error) {
            console.error("Error updating profile:", error)
            toast({
                title: "Error",
                description: "Failed to save changes. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Profile Details</CardTitle>
                    <CardDescription>Manage your personal and business information</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Avatar Section */}
                        <div className="w-full md:w-auto flex flex-col items-center gap-4 p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <div className="relative group">
                                <Avatar className="h-32 w-32 border-4 border-white dark:border-zinc-800 shadow-md">
                                    <AvatarImage src={previewImage || user?.user_metadata?.avatar_url} alt={formData.full_name || "User"} className="object-cover" />
                                    <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                                        {getInitials(formData.full_name || user?.email)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-1 right-1 bg-white dark:bg-zinc-950 rounded-full p-1 shadow-sm">
                                    <CheckCircle2 className="h-6 w-6 text-green-500 fill-green-500/20" />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                >
                                    <Upload className="h-8 w-8 text-white" />
                                </button>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-muted-foreground">Profile Photo</p>
                                <p className="text-xs text-muted-foreground mt-1">Click to change</p>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </div>
                        </div>

                        {/* Form Section */}
                        <form onSubmit={handleSubmit} className="flex-1 w-full space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="full_name"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            disabled={!isEditing}
                                            className="pl-9"
                                            placeholder="Your full name"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input id="email" type="email" value={user?.email} disabled className="bg-muted/50" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        disabled={!isEditing}
                                        placeholder="+255..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address">Base Location / Address</Label>
                                    <Input
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        disabled={!isEditing}
                                        placeholder="e.g. Dar es Salaam, Kinondoni"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="business_name">Business Name</Label>
                                    <div className="relative">
                                        <Truck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="business_name"
                                            value={formData.business_name}
                                            onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                            disabled={!isEditing}
                                            className="pl-9"
                                            placeholder="Transport Company Name"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="vehicle_type">Vehicle Type</Label>
                                    <Select
                                        disabled={!isEditing}
                                        value={formData.vehicle_type}
                                        onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select vehicle type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="motorcycle">Motorcycle (Bodaboda)</SelectItem>
                                            <SelectItem value="bajaj">Tricycle (Bajaj)</SelectItem>
                                            <SelectItem value="van">Van / Minibus</SelectItem>
                                            <SelectItem value="truck">Truck / Lorry</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="license_plate">License Plate</Label>
                                    <Input
                                        id="license_plate"
                                        value={formData.license_plate}
                                        onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                                        disabled={!isEditing}
                                        placeholder="e.g. T 123 ABC"
                                        className="uppercase"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>KYC Status</Label>
                                    <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted/50">
                                        <Badge variant={transporter.kyc_status === 'approved' ? 'default' : 'secondary'} className="capitalize">
                                            {transporter.kyc_status || 'Pending'}
                                        </Badge>
                                        {transporter.kyc_status === 'approved' && <span className="text-xs text-muted-foreground">Verified Transporter</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t">
                                {!isEditing ? (
                                    <Button type="button" onClick={() => setIsEditing(true)}>
                                        Edit Profile
                                    </Button>
                                ) : (
                                    <>
                                        <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={isLoading}>
                                            {isLoading ? "Saving..." : "Save Changes"}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </form>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
