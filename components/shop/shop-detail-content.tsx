"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Store, MapPin, Phone, Mail, ShoppingCart, Heart } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface ShopDetailContentProps {
  shop: any
  products: any[]
}

export function ShopDetailContent({ shop, products }: ShopDetailContentProps) {
  const router = useRouter()

  const handleAddToCart = (product: any) => {
    const cartItems = JSON.parse(localStorage.getItem("cart") || "[]")
    const existingItem = cartItems.find((item: any) => item.product_id === product.id)

    if (existingItem) {
      existingItem.quantity += 1
    } else {
      cartItems.push({
        product_id: product.id,
        quantity: 1,
        product: {
          ...product,
          shops: shop,
        },
      })
    }

    localStorage.setItem("cart", JSON.stringify(cartItems))
    // Trigger cart update event
    window.dispatchEvent(new Event("cartUpdated"))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Shop Header */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {shop.logo_url ? (
                <Image src={shop.logo_url} alt={shop.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Store className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{shop.name}</h1>
              {shop.description && <p className="text-muted-foreground mb-4">{shop.description}</p>}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {shop.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{shop.address}</span>
                  </div>
                )}
                {shop.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{shop.phone}</span>
                  </div>
                )}
                {shop.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{shop.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Products ({products.length})</h2>
        </div>

        {products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">This shop has no products available yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <Link href={`/product/${product.id}`}>
                  <div className="relative aspect-square w-full overflow-hidden bg-muted">
                    {product.images && product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </Link>
                <CardHeader>
                  <Link href={`/product/${product.id}`}>
                    <CardTitle className="text-lg line-clamp-2 hover:text-primary transition-colors">
                      {product.name}
                    </CardTitle>
                  </Link>
                  <CardDescription className="text-lg font-semibold text-primary">
                    TZS {product.price?.toLocaleString() || "0"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleAddToCart(product)}
                    className="w-full"
                    size="sm"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}









