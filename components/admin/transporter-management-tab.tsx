"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, XCircle, Search, Mail, Phone, Calendar, User, Eye, Truck, ShieldCheck } from "lucide-react"
import { clientApiGet, clientApiPost } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import Image from "next/image"

interface Transporter {
    id: string
    user_id: string
    vehicle_type: string
    vehicle_registration: string
    license_number: string
    kyc_status: string
    availability_status: string
    is_active?: boolean | null
    created_at: string
    updated_at: string
    total_deliveries: number
    users?: {
        email: string
        full_name: string
        phone?: string
    }
}

export function TransporterManagementTab() {
    const [transporters, setTransporters] = useState<Transporter[]>([])
    const [filteredTransporters, setFilteredTransporters] = useState<Transporter[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [selectedTransporter, setSelectedTransporter] = useState<Transporter | null>(null)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const { toast } = useToast()
    const router = useRouter()

    useEffect(() => {
        fetchTransporters()
    }, [])

    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredTransporters(transporters)
        } else {
            const query = searchQuery.toLowerCase()
            setFilteredTransporters(
                transporters.filter(
                    (t) =>
                        t.users?.full_name?.toLowerCase().includes(query) ||
                        t.users?.email?.toLowerCase().includes(query) ||
                        t.vehicle_registration?.toLowerCase().includes(query) ||
                        t.license_number?.toLowerCase().includes(query)
                )
            )
        }
    }, [searchQuery, transporters])

    const fetchTransporters = async () => {
        try {
            setIsLoading(true)
            const response = await clientApiGet<{ data: Transporter[] }>("admin/transporters")
            setTransporters(response.data || [])
            setFilteredTransporters(response.data || [])
        } catch (error) {
            console.error("Error fetching transporters:", error)
            toast({
                title: "Error",
                description: "Failed to load transporters",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggleActive = async (transporter: Transporter) => {
        try {
            const currentStatus = transporter.is_active ?? true
            const newStatus = !currentStatus
            await clientApiPost(`admin/transporters/${transporter.id}/${newStatus ? "activate" : "deactivate"}`)

            toast({
                title: newStatus ? "Transporter Activated" : "Transporter Deactivated",
                description: `${transporter.users?.full_name || 'Transporter'} has been ${newStatus ? "activated" : "deactivated"}`,
            })

            // Update local state
            setTransporters(transporters.map((t) => (t.id === transporter.id ? { ...t, is_active: newStatus } : t)))
            setFilteredTransporters(filteredTransporters.map((t) => (t.id === transporter.id ? { ...t, is_active: newStatus } : t)))
            if (selectedTransporter?.id === transporter.id) {
                setSelectedTransporter({ ...selectedTransporter, is_active: newStatus })
            }
        } catch (error) {
            console.error("Error toggling transporter status:", error)
            toast({
                title: "Error",
                description: "Failed to update transporter status",
                variant: "destructive",
            })
        }
    }

    const handleViewDetails = (transporter: Transporter) => {
        setSelectedTransporter(transporter)
        setViewDialogOpen(true)
    }

    const getVehicleTypeBadge = (vehicleType: string) => {
        const colors: Record<string, string> = {
            bodaboda: "bg-blue-500",
            bajaj: "bg-green-500",
            car: "bg-purple-500",
            canter: "bg-orange-500",
            semi_trailer: "bg-red-500",
            flight: "bg-indigo-500",
        }
        return colors[vehicleType] || "bg-gray-500"
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Transporter Management</h2>
                    <p className="text-muted-foreground">View and manage all transporter accounts</p>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                    {transporters.length} Total Transporters
                </Badge>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Search transporters by name, email, or plate number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{transporters.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-green-600">
                            {transporters.filter((t) => t.availability_status === "available").length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Approved KYC</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-blue-600">
                            {transporters.filter((t) => t.kyc_status === "approved").length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Deliveries</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">
                            {transporters.reduce((sum, t) => sum + (t.total_deliveries || 0), 0)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Transporters List */}
            {filteredTransporters.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">
                            {searchQuery ? "No transporters found matching your search" : "No transporters found"}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTransporters.map((transporter) => (
                        <Card key={transporter.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="flex items-center gap-2">
                                            <Truck className="h-5 w-5 text-primary" />
                                            {transporter.users?.full_name || "Unnamed"}
                                        </CardTitle>
                                        <CardDescription className="mt-1">{transporter.users?.email}</CardDescription>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Badge
                                            variant={(transporter.is_active ?? true) ? "default" : "secondary"}
                                            className={(transporter.is_active ?? true) ? "bg-green-600" : "bg-gray-500"}
                                        >
                                            {(transporter.is_active ?? true) ? "Active" : "Inactive"}
                                        </Badge>
                                        <Badge className={getVehicleTypeBadge(transporter.vehicle_type)}>
                                            {transporter.vehicle_type?.replace("_", " ").toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="h-4 w-4" />
                                        <span>{transporter.users?.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="h-4 w-4" />
                                        <span>{transporter.users?.phone || "N/A"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <ShieldCheck className="h-4 w-4" />
                                        <span>KYC: {transporter.kyc_status}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Truck className="h-4 w-4" />
                                        <span>Plate: {transporter.vehicle_registration}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>Joined {new Date(transporter.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => handleViewDetails(transporter)}
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        View Details
                                    </Button>
                                    <Button
                                        size="sm"
                                        className={`flex-1 ${(transporter.is_active ?? true) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
                                        onClick={() => handleToggleActive(transporter)}
                                    >
                                        {(transporter.is_active ?? true) ? (
                                            <>
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Deactivate
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                                Activate
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Details Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Transporter Details</DialogTitle>
                        <DialogDescription>Full information for {selectedTransporter?.users?.full_name}</DialogDescription>
                    </DialogHeader>
                    {selectedTransporter && (
                        <div className="grid md:grid-cols-2 gap-4 py-4">
                            <div>
                                <Label className="text-muted-foreground">Full Name</Label>
                                <p className="font-medium">{selectedTransporter.users?.full_name}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Email</Label>
                                <p className="font-medium">{selectedTransporter.users?.email}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Phone</Label>
                                <p className="font-medium">{selectedTransporter.users?.phone || "N/A"}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Vehicle Type</Label>
                                <p className="font-medium">{selectedTransporter.vehicle_type}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Vehicle Registration</Label>
                                <p className="font-medium">{selectedTransporter.vehicle_registration}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">License Number</Label>
                                <p className="font-medium">{selectedTransporter.license_number}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">KYC Status</Label>
                                <Badge variant="outline">{selectedTransporter.kyc_status}</Badge>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Availability</Label>
                                <Badge variant="outline">{selectedTransporter.availability_status}</Badge>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Total Deliveries</Label>
                                <p className="font-medium">{selectedTransporter.total_deliveries || 0}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Member Since</Label>
                                <p className="font-medium">{new Date(selectedTransporter.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
