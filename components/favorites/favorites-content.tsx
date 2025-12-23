"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, ShoppingCart, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface FavoritesContentProps {
  likes: any[]
}

export function FavoritesContent({ likes }: FavoritesContentProps) {
  const router = useRouter()

  const handleRemove = async (likeId: string) => {
    const supabase = createClient()
    await supabase.from("product_likes").delete().eq("id", likeId)
    router.refresh()
  }

  const handleAddToCart = (product: any) => {
    const cartItems = JSON.parse(localStorage.getItem("cart") || "[]")
    const existingItem = cartItems.find((item: any) => item.product_id === product.id)

    if (existingItem) {
      existingItem.quantity += 1
    } else {
      cartItems.push({
        product_id: product.id,
        quantity: 1,
        product,
      })
    }

    localStorage.setItem("cart", JSON.stringify(cartItems))
    router.push("/cart")
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Favorites</h1>
          <p className="text-muted-foreground">Products you've saved for later</p>
        </div>

        {likes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No favorites yet</p>
              <Link href="/shop">
                <Button>Browse Products</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {likes.map((like) => {
              const product = like.products
              return (
                <Card key={like.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-muted relative">
                    <img
                      src={`/.jpg?key=0e9uc&height=300&width=300&query=${encodeURIComponent(product.name)}`}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">TZS {product.price.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        by {product.shops?.vendors?.business_name || "Unknown"}
                      </p>
                      <div className="flex gap-2">
                        <Button className="flex-1" size="sm" onClick={() => handleAddToCart(product)}>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleRemove(like.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
