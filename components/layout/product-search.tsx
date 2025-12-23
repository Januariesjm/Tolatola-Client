"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, Store } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import Image from "next/image"

interface Product {
  id: string
  name: string
  price: number
  images: string[]
  shops: {
    name: string
  }
}

interface Shop {
  id: string
  name: string
  description: string
  logo_url: string
  address: string
}

export function ProductSearch() {
  const [query, setQuery] = useState("")
  const [productResults, setProductResults] = useState<Product[]>([])
  const [shopResults, setShopResults] = useState<Shop[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.trim().length < 2) {
        setProductResults([])
        setShopResults([])
        setIsOpen(false)
        return
      }

      setIsLoading(true)
      const supabase = createClient()

      try {
        const { data: products, error: productsError } = await supabase
          .from("products")
          .select("id, name, price, images, shops!inner(name)")
          .eq("is_active", true)
          .eq("status", "approved")
          .ilike("name", `%${query}%`)
          .limit(4)

        const { data: shops, error: shopsError } = await supabase
          .from("shops")
          .select("id, name, description, logo_url, address")
          .eq("is_active", true)
          .ilike("name", `%${query}%`)
          .limit(3)

        if (!productsError && products) {
          setProductResults(products as Product[])
        }

        if (!shopsError && shops) {
          setShopResults(shops as Shop[])
        }

        setIsOpen((products && products.length > 0) || (shops && shops.length > 0))
      } catch (err) {
        console.error("[v0] Search error:", err)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleClear = () => {
    setQuery("")
    setProductResults([])
    setShopResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search products and vendors..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (productResults.length > 0 || shopResults.length > 0) setIsOpen(true)
          }}
          className="pl-9 pr-9 h-10 bg-muted/50 border-muted-foreground/20 focus-visible:ring-primary"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-background border rounded-lg shadow-lg overflow-hidden z-50 max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
          ) : (
            <>
              {shopResults.length > 0 && (
                <div className="border-b">
                  <div className="px-3 py-2 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase">
                    Vendors
                  </div>
                  {shopResults.map((shop) => {
                    const shopUrl = `/shop/${shop.id}`
                    return (
                      <Link
                        key={shop.id}
                        href={shopUrl}
                        onClick={() => {
                          setIsOpen(false)
                          setQuery("")
                        }}
                        className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                      >
                      <div className="relative w-12 h-12 flex-shrink-0 rounded-full overflow-hidden bg-muted">
                        {shop.logo_url ? (
                          <Image
                            src={shop.logo_url || "/placeholder.svg"}
                            alt={shop.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Store className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{shop.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {shop.description || shop.address || "Vendor"}
                        </p>
                      </div>
                      <Store className="h-4 w-4 text-primary" />
                      </Link>
                    )
                  })}
                </div>
              )}

              {productResults.length > 0 && (
                <div>
                  <div className="px-3 py-2 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase">
                    Products
                  </div>
                  {productResults.map((product) => {
                    const productUrl = `/product/${product.id}`
                    return (
                      <Link
                        key={product.id}
                        href={productUrl}
                        onClick={() => {
                          setIsOpen(false)
                          setQuery("")
                        }}
                        className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                      >
                      <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-muted">
                        {product.images && product.images[0] ? (
                          <Image
                            src={product.images[0] || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Search className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{product.shops?.name}</p>
                      </div>
                      <div className="text-sm font-semibold text-primary">TZS {product.price.toLocaleString()}</div>
                      </Link>
                    )
                  })}
                </div>
              )}

              {(productResults.length === 4 || shopResults.length === 3) && (
                <Link
                  href={`/shop?search=${encodeURIComponent(query)}`}
                  onClick={() => {
                    setIsOpen(false)
                    setQuery("")
                  }}
                  className="block p-3 text-center text-sm text-primary hover:bg-muted/50 transition-colors border-t"
                >
                  View all results
                </Link>
              )}

              {productResults.length === 0 && shopResults.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No products or vendors found for "{query}"
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
