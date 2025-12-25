"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, Store, ShoppingBag, ArrowRight, Loader2, Sparkles, TrendingUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

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
          .limit(5)

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
    <div ref={searchRef} className="relative w-full max-w-2xl group">
      <div className="relative">
        <div className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300",
          isLoading ? "text-primary animate-pulse" : "text-stone-400 group-focus-within:text-primary"
        )}>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
        </div>

        <Input
          ref={inputRef}
          type="text"
          placeholder="what are you looking for..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (productResults.length > 0 || shopResults.length > 0) setIsOpen(true)
          }}
          className="pl-12 pr-12 h-14 md:h-16 rounded-[2rem] bg-stone-50/50 border-stone-500/50 focus-visible:ring-primary/20 focus-visible:bg-white focus-visible:shadow-2xl focus-visible:shadow-primary/5 transition-all text-lg font-medium placeholder:text-stone-500 border-2"
        />

        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-stone-100 rounded-full transition-colors"
            onClick={handleClear}
          >
            <X className="h-5 w-5 text-stone-400" />
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full mt-4 w-full bg-white/95 backdrop-blur-xl border-2 border-stone-100 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden z-[100] animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto scrollbar-hide">

            {/* Shops Section */}
            {shopResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Elite Vendors</span>
                  </div>
                  <div className="h-px flex-1 bg-stone-100 mx-4" />
                </div>

                <div className="grid gap-3">
                  {shopResults.map((shop) => (
                    <Link
                      key={shop.id}
                      href={`/shop/${shop.id}`}
                      onClick={() => {
                        setIsOpen(false)
                        setQuery("")
                      }}
                      className="flex items-center gap-4 p-4 rounded-2xl hover:bg-stone-50 transition-all group/shop"
                    >
                      <div className="relative w-14 h-14 flex-shrink-0 rounded-2xl overflow-hidden shadow-sm border border-stone-100 bg-white">
                        {shop.logo_url ? (
                          <Image src={shop.logo_url} alt={shop.name} fill className="object-cover transition-transform duration-500 group-hover/shop:scale-110" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-stone-50 text-stone-300">
                            <Store className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-black text-stone-900 truncate tracking-tight">{shop.name}</p>
                        <p className="text-xs font-bold text-stone-400 truncate italic">
                          {shop.address || "Verified Tola Vendor"}
                        </p>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 group-hover/shop:bg-primary group-hover/shop:text-white transition-all">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Products Section */}
            {productResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Curated Items</span>
                  </div>
                  <div className="h-px flex-1 bg-stone-100 mx-4" />
                </div>

                <div className="grid gap-4">
                  {productResults.map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      onClick={() => {
                        setIsOpen(false)
                        setQuery("")
                      }}
                      className="flex items-center gap-5 p-4 rounded-2xl hover:bg-stone-50 transition-all group/item"
                    >
                      <div className="relative w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden shadow-md border border-stone-100 bg-white">
                        {product.images?.[0] ? (
                          <Image src={product.images[0]} alt={product.name} fill className="object-cover transition-transform duration-500 group-hover/item:scale-110" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-stone-50">
                            <ShoppingBag className="h-8 w-8 text-stone-200" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-base font-black text-stone-900 truncate tracking-tight">{product.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                            {product.shops?.name}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-stone-950 tracking-tighter">
                          {product.price.toLocaleString()} <span className="text-[10px] uppercase">TZS</span>
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {(productResults.length >= 4 || shopResults.length >= 3) && (
              <Link
                href={`/shop?search=${encodeURIComponent(query)}`}
                onClick={() => {
                  setIsOpen(false)
                  setQuery("")
                }}
                className="flex items-center justify-center gap-3 w-full p-5 mt-4 text-sm font-black uppercase tracking-[0.2em] text-stone-400 border-2 border-dashed border-stone-100 rounded-3xl hover:bg-stone-950 hover:text-white hover:border-stone-950 transition-all group/all"
              >
                <span>Reveal All Findings</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
