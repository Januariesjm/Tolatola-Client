"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Mail, Phone, Calendar, User, Eye, MapPin } from "lucide-react"
import { clientApiGet } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface Customer {
    id: string
    email: string
    full_name: string
    phone?: string
    created_at: string
    // Add other fields as needed
}

export function CustomerManagementTab() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        fetchCustomers()
    }, [])

    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredCustomers(customers)
        } else {
            const query = searchQuery.toLowerCase()
            setFilteredCustomers(
                customers.filter(
                    (c) =>
                        c.full_name?.toLowerCase().includes(query) ||
                        c.email?.toLowerCase().includes(query) ||
                        c.phone?.toLowerCase().includes(query)
                )
            )
        }
    }, [searchQuery, customers])

    const fetchCustomers = async () => {
        try {
            setIsLoading(true)
            const response = await clientApiGet<{ data: Customer[] }>("admin/customers")
            setCustomers(response.data || [])
            setFilteredCustomers(response.data || [])
        } catch (error) {
            console.error("Error fetching customers:", error)
            toast({
                title: "Error",
                description: "Failed to load customers",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleViewDetails = (customer: Customer) => {
        setSelectedCustomer(customer)
        setViewDialogOpen(true)
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
                    <h2 className="text-2xl font-bold">Customer Management</h2>
                    <p className="text-muted-foreground">View all registered customers</p>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                    {customers.length} Total Customers
                </Badge>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Customers List */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCustomers.map((customer) => (
                    <Card key={customer.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                {customer.full_name || "Unnamed"}
                            </CardTitle>
                            <CardDescription>{customer.email}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-4 w-4" />
                                    <span>{customer.phone || "N/A"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>Joined {new Date(customer.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full mt-4"
                                onClick={() => handleViewDetails(customer)}
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Details Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Customer Details</DialogTitle>
                        <DialogDescription>Full information for {selectedCustomer?.full_name}</DialogDescription>
                    </DialogHeader>
                    {selectedCustomer && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Full Name</Label>
                                    <p className="font-medium">{selectedCustomer.full_name}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Email</Label>
                                    <p className="font-medium">{selectedCustomer.email}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Phone</Label>
                                    <p className="font-medium">{selectedCustomer.phone || "N/A"}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Joined At</Label>
                                    <p className="font-medium">{new Date(selectedCustomer.created_at).toLocaleString()}</p>
                                </div>
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
