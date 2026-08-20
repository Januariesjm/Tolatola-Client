"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Search,
  Trash2,
  AlertTriangle,
  RefreshCw,
  LayoutGrid,
  List,
  Package,
  Store,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  Filter,
} from "lucide-react"
import { clientApiDelete, clientApiGet } from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { logger } from "@/lib/logger"

const log = logger.child("admin.product-management-tab")

interface ProductManagementTabProps {
  initialProducts?: any[]
}

export function ProductManagementTab({ initialProducts = [] }: ProductManagementTabProps) {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>(initialProducts)
  const [loading, setLoading] = useState(false)

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")

  // Delete Modal State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null)

  // Sync initialProducts if parent updates
  useEffect(() => {
    if (initialProducts.length > 0) {
      setProducts(initialProducts)
    }
  }, [initialProducts])

  // Reload products from API
  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await clientApiGet<{ data: any[] }>("admin/products")
      if (res && Array.isArray(res.data)) {
        setProducts(res.data)
      }
    } catch (err) {
      log.error("failed to refresh products", err)
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Status filter
        if (statusFilter !== "all" && (product.status || "").toLowerCase() !== statusFilter.toLowerCase()) {
          return false
        }

        // Search query filter
        if (!searchQuery.trim()) return true

        const q = searchQuery.toLowerCase()
        const name = (product.name || "").toLowerCase()
        const desc = (product.description || "").toLowerCase()
        const id = (product.id || "").toLowerCase()
        const shopName = (product.shops?.name || "").toLowerCase()
        const vendorName = (product.shops?.vendors?.business_name || "").toLowerCase()
        const categoryName = (product.categories?.name || "").toLowerCase()

        return (
          name.includes(q) ||
          desc.includes(q) ||
          id.includes(q) ||
          shopName.includes(q) ||
          vendorName.includes(q) ||
          categoryName.includes(q)
        )
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        }
        if (sortBy === "oldest") {
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        }
        if (sortBy === "price_high") {
          return (b.price || 0) - (a.price || 0)
        }
        if (sortBy === "price_low") {
          return (a.price || 0) - (b.price || 0)
        }
        if (sortBy === "name_asc") {
          return (a.name || "").localeCompare(b.name || "")
        }
        return 0
      })
  }, [products, searchQuery, statusFilter, sortBy])

  // Count stats
  const stats = useMemo(() => {
    return {
      total: products.length,
      approved: products.filter((p) => (p.status || "").toLowerCase() === "approved").length,
      pending: products.filter((p) => (p.status || "").toLowerCase() === "pending").length,
      rejected: products.filter((p) => (p.status || "").toLowerCase() === "rejected").length,
    }
  }, [products])

  // Initiate Delete
  const handleOpenDeleteDialog = (product: any) => {
    setProductToDelete(product)
    setDeleteError(null)
    setDeleteDialogOpen(true)
  }

  // Execute Permanent Delete
  const handleConfirmDelete = async () => {
    if (!productToDelete) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await clientApiDelete(`admin/products/${productToDelete.id}`)
      
      // Update local state immediately
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id))
      setDeleteSuccess(`Product "${productToDelete.name}" was permanently deleted.`)
      setDeleteDialogOpen(false)
      setProductToDelete(null)
      router.refresh()

      setTimeout(() => {
        setDeleteSuccess(null)
      }, 5000)
    } catch (err: any) {
      log.error("error", err)
      setDeleteError(err?.message || "Failed to delete product. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase()
    switch (s) {
      case "approved":
        return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200">Approved</Badge>
      case "pending":
        return <Badge className="bg-amber-500/15 text-amber-700 border-amber-200">Pending</Badge>
      case "rejected":
        return <Badge className="bg-rose-500/15 text-rose-700 border-rose-200">Rejected</Badge>
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Success Notification */}
      {deleteSuccess && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-medium">{deleteSuccess}</p>
          <button
            onClick={() => setDeleteSuccess(null)}
            className="ml-auto text-emerald-600 hover:text-emerald-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Search & Delete Products
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Search across all marketplace products and permanently delete any product from the system.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchProducts}
          disabled={loading}
          className="self-start md:self-auto gap-2 rounded-xl"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Catalog
        </Button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 shadow-sm rounded-xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Products</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm rounded-xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Approved</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.approved}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm rounded-xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Pending Review</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm rounded-xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Rejected</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{stats.rejected}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200/80 shadow-sm rounded-2xl">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search products by title, vendor, shop, category, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 rounded-xl border-slate-200 focus-visible:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-44">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Dropdown */}
            <div className="w-full md:w-44">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="name_asc">Name: A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-slate-200 rounded-xl p-1 bg-slate-50 self-start md:self-auto">
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-8 px-2.5 rounded-lg"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 px-2.5 rounded-lg"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active Filter Indicators */}
          {(searchQuery || statusFilter !== "all") && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
              <span>Showing {filteredProducts.length} of {products.length} products</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1 rounded-md text-[11px]">
                  Query: "{searchQuery}"
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="gap-1 rounded-md text-[11px] capitalize">
                  Status: {statusFilter}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter("all")} />
                </Badge>
              )}
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                }}
                className="text-xs text-primary p-0 h-auto ml-auto"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Area */}
      {filteredProducts.length === 0 ? (
        <Card className="border-slate-200/80 shadow-sm rounded-2xl">
          <CardContent className="py-16 text-center">
            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Package className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No products found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
              {searchQuery || statusFilter !== "all"
                ? "No products matched your search parameters. Try adjusting your query or filters."
                : "There are currently no products in the system catalog."}
            </p>
            {(searchQuery || statusFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                }}
                className="rounded-xl"
              >
                Reset All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        /* Table View */
        <Card className="border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="w-[80px]">Product</TableHead>
                  <TableHead>Product Details</TableHead>
                  <TableHead>Shop / Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price & Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell>
                      <div className="h-12 w-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative">
                        <img
                          src={product.image_url || "/placeholder.svg"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            ;(e.target as HTMLElement).setAttribute("src", "/placeholder.svg")
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-900 text-sm line-clamp-1">{product.name}</p>
                        <p className="text-xs text-slate-400 font-mono">ID: {product.id.substring(0, 8)}...</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800">
                          <Store className="h-3.5 w-3.5 text-slate-400" />
                          <span>{product.shops?.name || "No Shop"}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {product.shops?.vendors?.business_name || "Independent Vendor"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md inline-block">
                        {product.categories?.name || "Uncategorized"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-slate-900">
                          TZS {Number(product.price || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">
                          Stock: <span className="font-medium text-slate-700">{product.stock_quantity ?? 0}</span>
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDeleteDialog(product)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl gap-1.5 font-medium"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        /* Grid View */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="border-slate-200/80 shadow-sm rounded-2xl overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="aspect-video bg-slate-100 relative overflow-hidden">
                <img
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLElement).setAttribute("src", "/placeholder.svg")
                  }}
                />
                <div className="absolute top-3 right-3">{getStatusBadge(product.status)}</div>
              </div>

              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-bold text-slate-900 line-clamp-1">
                  {product.name}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <Store className="h-3.5 w-3.5 text-slate-400" />
                  <span>{product.shops?.name || "No Shop"}</span>
                  {product.shops?.vendors?.business_name && (
                    <span>• {product.shops.vendors.business_name}</span>
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 pt-2 flex-1 flex flex-col justify-between space-y-4">
                {product.description && (
                  <p className="text-xs text-slate-600 line-clamp-2">{product.description}</p>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">PRICE</span>
                    <span className="text-sm font-bold text-slate-900">
                      TZS {Number(product.price || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">STOCK</span>
                    <span className="font-semibold text-slate-700">{product.stock_quantity ?? 0} units</span>
                  </div>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleOpenDeleteDialog(product)}
                  className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 gap-2 font-medium"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Permanently
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 font-bold text-xl">
              <AlertTriangle className="h-5 w-5" />
              Delete Product Permanently?
            </DialogTitle>
            <DialogDescription className="text-slate-600 pt-1 text-sm">
              This action cannot be undone. The product and all related marketplace data will be permanently purged from the system database.
            </DialogDescription>
          </DialogHeader>

          {productToDelete && (
            <div className="space-y-4 py-3">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="h-14 w-14 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0">
                  <img
                    src={productToDelete.image_url || "/placeholder.svg"}
                    alt={productToDelete.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-sm truncate">{productToDelete.name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    Shop: {productToDelete.shops?.name || "No Shop"} ({productToDelete.shops?.vendors?.business_name || "Vendor"})
                  </p>
                  <p className="text-xs font-semibold text-slate-700">
                    TZS {Number(productToDelete.price || 0).toLocaleString()} • ID: {productToDelete.id}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                <p className="font-semibold">Items that will be deleted:</p>
                <ul className="list-disc list-inside space-y-0.5 text-rose-700">
                  <li>Product images & media files</li>
                  <li>Customer shopping cart entries containing this item</li>
                  <li>User wishlist & product likes</li>
                  <li>Customer product reviews and ratings</li>
                </ul>
              </div>

              {deleteError && (
                <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-xl text-xs">
                  {deleteError}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="rounded-xl border-slate-200"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 gap-2 font-medium"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Yes, Delete Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
