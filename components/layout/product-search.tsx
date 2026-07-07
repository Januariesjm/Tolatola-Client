"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, Store, ShoppingBag, ArrowRight, Loader2, Sparkles, TrendingUp, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { SearchFiltersPopover } from "./search-filters-popover"

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

interface Category {
  id: string
  name: string
  slug: string
}

export function ProductSearch({ categories = [] }: { categories?: Category[] }) {
  const [query, setQuery] = useState("")
  const [productResults, setProductResults] = useState<Product[]>([])
  const [shopResults, setShopResults] = useState<Shop[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.trim().length < 2) {
        setProductResults([])
        setShopResults([])
        setIsOpen(false)
        // If no query and filters were not manually closed, keep filters open
        return
      }

      // If user is typing, show search results and hide filters
      if (query.trim().length >= 2) {
        setShowFilters(false)
      }

      setIsLoading(true)
      const supabase = createClient()

      try {
        const { data: products, error: productsError } = await supabase
          .from("products")
          .select("id, name, price, images")
          .eq("is_active", true)
          .eq("status", "approved")
          .ilike("name", `%${query}%`)
          .limit(5)

        if (!productsError && products) {
          setProductResults(products as Product[])
        }

        setIsOpen(Boolean(products && products.length > 0))
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
      // Check if click is outside the search container
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowFilters(false)
      }
    }

    // Use bubble phase (default) so input handlers fire first
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
          "absolute left-3.5 lg:left-4 top-1/2 -translate-y-1/2 transition-all duration-300",
          isLoading ? "text-primary animate-pulse" : "text-stone-400 group-focus-within:text-primary"
        )}>
          {isLoading ? <Loader2 className="h-4 w-4 lg:h-5 lg:w-5 animate-spin" /> : <Search className="h-4 w-4 lg:h-5 lg:w-5" />}
        </div>

        <Input
          ref={inputRef}
          type="text"
          placeholder="What are you looking for..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            // When user starts typing, hide filters and show search results
            if (e.target.value.trim().length >= 2) {
              setShowFilters(false)
            } else {
              // If query is cleared, show filters again
              if (categories.length > 0) {
                setShowFilters(true)
                setIsOpen(false)
              }
            }
          }}
          onMouseDown={(e) => {
            // Stop propagation to prevent click outside from firing
            e.stopPropagation()
            // When clicking the search box, ALWAYS show filters immediately if categories are available
            if (categories.length > 0) {
              setShowFilters(true)
              setIsOpen(false)
            }
          }}
          onClick={(e) => {
            // Stop propagation to prevent click outside from firing
            e.stopPropagation()
            // When clicking the search box, ALWAYS show filters immediately if categories are available
            if (categories.length > 0) {
              setShowFilters(true)
              setIsOpen(false)
            } else if (query.trim().length >= 2) {
              setShowFilters(false)
              if (productResults.length > 0) setIsOpen(true)
            }
          }}
          onFocus={() => {
            // On focus, ALWAYS show filters immediately if categories are available
            if (categories.length > 0 && query.trim().length < 2) {
              setShowFilters(true)
              setIsOpen(false)
            } else if (query.trim().length >= 2) {
              setShowFilters(false)
              if (productResults.length > 0) setIsOpen(true)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim().length >= 2) {
              setIsOpen(false)
              setShowFilters(false)
              window.location.href = `/shop?search=${encodeURIComponent(query)}`
            }
          }}
          className="pl-9 lg:pl-12 pr-9 lg:pr-12 h-9 lg:h-16 rounded-full lg:rounded-[2rem] bg-stone-50/50 border-stone-500/50 focus-visible:ring-primary/20 focus-visible:bg-white focus-visible:shadow-2xl focus-visible:shadow-primary/5 transition-all text-xs lg:text-lg font-medium placeholder:text-[11px] lg:placeholder:text-lg placeholder:text-stone-400/80 placeholder:tracking-wide border-2"
        />

        <div className="absolute right-1.5 lg:right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 lg:gap-1">
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 lg:h-10 lg:w-10 hover:bg-stone-100 rounded-full transition-colors"
              onClick={handleClear}
            >
              <X className="h-3.5 w-3.5 lg:h-5 lg:w-5 text-stone-400" />
            </Button>
          )}
          {categories.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 lg:h-10 lg:w-10 hover:bg-stone-100 rounded-full transition-colors",
                showFilters && "bg-primary text-white hover:bg-primary/90"
              )}
              onClick={(e) => {
                e.stopPropagation()
                const newShowFilters = !showFilters
                setShowFilters(newShowFilters)
                if (newShowFilters) {
                  setIsOpen(false)
                  inputRef.current?.focus()
                }
              }}
              title="Filters"
            >
              <Filter className="h-3.5 w-3.5 lg:h-5 lg:w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Filters Popover */}
      {showFilters && categories.length > 0 && (
        <div 
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[94vw] sm:w-[600px] md:w-[700px] lg:w-[800px] xl:w-[850px] bg-white border border-stone-200 rounded-3xl shadow-2xl z-[100] animate-in fade-in slide-in-from-top-2 duration-200"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <SearchFiltersPopover categories={categories} onClose={() => setShowFilters(false)} />
        </div>
      )}

      {/* Search Results Dropdown */}
      {isOpen && !showFilters && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[94vw] sm:w-[600px] md:w-[700px] lg:w-[800px] xl:w-[850px] bg-white/95 backdrop-blur-xl border-2 border-stone-100 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden z-[100] animate-in fade-in slide-in-from-top-4 duration-500">

          <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto scrollbar-hide">

            {/* Shops Section intentionally removed to protect vendor identities */}

            {/* Products Section */}
            {productResults.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Available Items</span>
                  </div>
                  <div className="h-px flex-1 bg-stone-100 mx-4" />
                </div>

                <div className="grid gap-2">
                  {productResults.map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      onClick={() => {
                        setIsOpen(false)
                        setQuery("")
                      }}
                      className="flex items-center gap-4 p-2.5 rounded-2xl hover:bg-stone-50 transition-all group/item"
                    >
                      <div className="relative w-14 h-14 md:w-16 md:h-16 flex-shrink-0 rounded-xl md:rounded-2xl overflow-hidden shadow-md border border-stone-100 bg-white">
                        {product.images?.[0] ? (
                          <Image src={product.images[0]} alt={product.name} fill className="object-cover transition-transform duration-500 group-hover/item:scale-110" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-stone-50">
                            <ShoppingBag className="h-6 w-6 text-stone-200" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="text-xs md:text-sm font-black text-stone-900 truncate tracking-tight">{product.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                            Verified Item
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm md:text-base font-black text-stone-950 tracking-tighter">
                          {product.price.toLocaleString()} <span className="text-[8px] md:text-[9px] uppercase">TZS</span>
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}


            {/* Always show "View All Results" link if there are results */}
            {(productResults.length > 0 && query.trim().length >= 2) && (
              <Link
                href={`/shop?search=${encodeURIComponent(query)}`}
                onClick={() => {
                  setIsOpen(false)
                }}
                className="flex items-center justify-center gap-3 w-full p-5 mt-4 text-sm font-black uppercase tracking-[0.2em] text-stone-400 border-2 border-dashed border-stone-100 rounded-3xl hover:bg-stone-950 hover:text-white hover:border-stone-950 transition-all group/all"
              >
                <span>View All Results</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
