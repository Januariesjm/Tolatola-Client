"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, Store, Plus, LogOut, Edit, Trash2, PackageX, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { clientApiPost, clientApiGet } from "@/lib/api-client"
import Image from "next/image"
import { CreateShopDialog } from "./create-shop-dialog"
import { AddProductDialog } from "./add-product-dialog"
import { EditProductDialog } from "./edit-product-dialog"
import { VendorOrdersTab } from "./vendor-orders-tab"
import { VendorWalletTab } from "./vendor-wallet-tab"
import { VendorSubscriptionTab } from "./vendor-subscription-tab"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EditShopDialog } from "./edit-shop-dialog"
import { NotificationPopover } from "../layout/notification-popover"

interface VendorDashboardContentProps {
  vendor: any
  shop: any
  products: any[]
}

// Helper function to check if shop has location
const hasShopLocation = (shop: any): boolean => {
  return !!(shop?.region && shop?.district)
}

export function VendorDashboardContent({ vendor, shop, products }: VendorDashboardContentProps) {
  const router = useRouter()
  const [showCreateShop, setShowCreateShop] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showEditProduct, setShowEditProduct] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [productToDelete, setProductToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showEditShop, setShowEditShop] = useState(false)
  // State for location warning dialog
  const [showLocationWarning, setShowLocationWarning] = useState(false)

  const handleLogout = async () => {
    try {
      // Clear Supabase session on client side first
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      await supabase.auth.signOut()

      // Also call backend logout (optional, but good for consistency)
      try {
        await clientApiPost("auth/logout")
      } catch (apiError) {
        // Backend logout failed, but we've already cleared local session
        console.error("Backend logout error:", apiError)
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Force redirect to home page
      window.location.href = "/"
    }
  }

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product)
    setShowEditProduct(true)
  }

  const handleDeleteProduct = (product: any) => {
    setProductToDelete(product)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!productToDelete) return

    setIsDeleting(true)

    try {
      await clientApiPost(`products/delete`, { productId: productToDelete.id })
      setShowDeleteDialog(false)
      setProductToDelete(null)
      router.refresh()
    } catch (error) {
      console.error("Error deleting product:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleOutOfStock = async (product: any) => {
    try {
      const newStockQuantity = product.stock_quantity > 0 ? 0 : 1

      await clientApiPost("products/update-stock", { productId: product.id, quantity: newStockQuantity })
      router.refresh()
    } catch (error) {
      console.error("Error updating stock:", error)
    }
  }

  // Handler to check location before adding product
  const handleAddProductClick = () => {
    if (!hasShopLocation(shop)) {
      setShowLocationWarning(true)
    } else {
      setShowAddProduct(true)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/tolalogo.jpg" alt="TOLA" width={150} height={50} className="h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Vendor Dashboard</span>
            <NotificationPopover />
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome, {vendor.business_name}</h1>
          <p className="text-muted-foreground">Manage your shop and products</p>
        </div>

        {!shop ? (
          <Card>
            <CardHeader>
              <CardTitle>Create Your Shop</CardTitle>
              <CardDescription>Set up your shop to start selling products</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowCreateShop(true)}>
                <Store className="h-4 w-4 mr-2" />
                Create Shop
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {!hasShopLocation(shop) && (
              <Card className="mb-6 border-amber-500 bg-amber-50">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="font-medium text-amber-800">Shop Location Required</p>
                        <p className="text-sm text-amber-700">
                          Please add your shop location to enable delivery fee calculations and start adding products.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowEditShop(true)}
                      variant="outline"
                      className="border-amber-500 text-amber-700 hover:bg-amber-100"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Add Location
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="products" className="space-y-6">
              <TabsList>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="wallet">Wallet</TabsTrigger>
                <TabsTrigger value="subscription">Subscription</TabsTrigger>
                <TabsTrigger value="shop">Shop Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="products" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Your Products</h2>
                  <Button onClick={handleAddProductClick}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>

                {products.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">No products yet</p>
                      <Button onClick={handleAddProductClick}>Add Your First Product</Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        {product.images && product.images.length > 0 ? (
                          <div className="aspect-square relative bg-muted">
                            <Image
                              src={product.images[0] || "/placeholder.svg"}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                            {product.stock_quantity === 0 && (
                              <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2 py-1 rounded text-xs font-semibold">
                                Out of Stock
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="aspect-square bg-muted flex items-center justify-center">
                            <Package className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <CardHeader>
                          <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {product.description || "No description"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-semibold">TZS {product.price.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Stock:</span>
                              <span className="font-medium">{product.stock_quantity}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Status:</span>
                              <span
                                className={
                                  product.status === "approved"
                                    ? "text-green-600 font-medium"
                                    : product.status === "rejected"
                                      ? "text-red-600 font-medium"
                                      : "text-yellow-600 font-medium"
                                }
                              >
                                {product.status}
                              </span>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 bg-transparent"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 bg-transparent"
                                onClick={() => handleToggleOutOfStock(product)}
                              >
                                <PackageX className="h-4 w-4 mr-1" />
                                {product.stock_quantity > 0 ? "Out of Stock" : "In Stock"}
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="orders">
                <VendorOrdersTab shopId={shop.id} />
              </TabsContent>

              <TabsContent value="wallet">
                <VendorWalletTab vendorId={vendor.id} />
              </TabsContent>

              <TabsContent value="subscription">
                <VendorSubscriptionTab vendorId={vendor.id} />
              </TabsContent>

              <TabsContent value="shop">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Shop Settings</CardTitle>
                      <CardDescription>Manage your shop information and location</CardDescription>
                    </div>
                    <Button onClick={() => setShowEditShop(true)} variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Shop
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium">Shop Name</p>
                        <p className="text-sm text-muted-foreground">{shop.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Description</p>
                        <p className="text-sm text-muted-foreground">{shop.description || "No description"}</p>
                      </div>
                      <div className="border-t pt-4">
                        <p className="text-sm font-semibold mb-2">Shop Location</p>
                        {shop.address ? (
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">Address:</span>
                              <span className="text-muted-foreground ml-2">{shop.address}</span>
                            </div>
                            <div>
                              <span className="font-medium">Region:</span>
                              <span className="text-muted-foreground ml-2">{shop.region}</span>
                            </div>
                            <div>
                              <span className="font-medium">District:</span>
                              <span className="text-muted-foreground ml-2">{shop.district}</span>
                            </div>
                            {shop.ward && (
                              <div>
                                <span className="font-medium">Ward:</span>
                                <span className="text-muted-foreground ml-2">{shop.ward}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded">
                            <AlertCircle className="h-4 w-4" />
                            <span>Please add your shop location for accurate delivery fees</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      <CreateShopDialog
        open={showCreateShop}
        onOpenChange={setShowCreateShop}
        vendorId={vendor.id}
        onSuccess={() => router.refresh()}
      />
      <AddProductDialog
        open={showAddProduct}
        onOpenChange={setShowAddProduct}
        shopId={shop?.id}
        onSuccess={() => router.refresh()}
      />
      <EditProductDialog
        open={showEditProduct}
        onOpenChange={setShowEditProduct}
        product={selectedProduct}
        onSuccess={() => router.refresh()}
      />
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showLocationWarning} onOpenChange={setShowLocationWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Shop Location Required
            </AlertDialogTitle>
            <AlertDialogDescription>
              You need to add your shop location before you can add products. The location is required to calculate
              accurate delivery fees for your customers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowLocationWarning(false)
                setShowEditShop(true)
              }}
            >
              Add Shop Location
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <EditShopDialog
        open={showEditShop}
        onOpenChange={setShowEditShop}
        shop={shop}
        onSuccess={() => router.refresh()}
      />
    </div>
  )
}
