"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, X, ShoppingBag, ArrowRight, Loader2, Sparkles, SlidersHorizontal, MapPin, DollarSign, Camera } from "lucide-react"
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
  location?: string
  shops: {
    name: string
    region?: string
    district?: string
  }
}

interface Category {
  id: string
  name: string
  slug: string
}

const compressImageForSearch = (file: File, maxDim = 800, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = document.createElement("img")
      img.onload = () => {
        let width = img.width
        let height = img.height
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL("image/jpeg", quality))
        } else {
          resolve(e.target?.result as string)
        }
      }
      img.onerror = () => resolve(e.target?.result as string)
      img.src = e.target?.result as string
    }
    reader.onerror = () => resolve("")
    reader.readAsDataURL(file)
  })
}

export function ProductSearch({ categories = [] }: { categories?: Category[] }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [productResults, setProductResults] = useState<Product[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isImageSearching, setIsImageSearching] = useState(false)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("")
  const [hasSearched, setHasSearched] = useState(false)
  const [imageAnalysis, setImageAnalysis] = useState<string>("")
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.trim().length < 2) {
        setProductResults([])
        setHasSearched(false)
        if (query.trim().length === 0 && !showFilters && !isImageSearching) {
          setIsOpen(false)
        }
        return
      }

      setIsLoading(true)
      setHasSearched(true)
      const supabase = createClient()

      try {
        let dbQuery = supabase
          .from("products")
          .select("id, name, price, images, location, shops (name, region, district)")
          .eq("is_active", true)
          .eq("status", "approved")
          .or(`name.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`)
          .limit(8)

        const { data: products, error } = await dbQuery
        if (!error && products) {
          setProductResults(products as Product[])
        }
        setIsOpen(true)
        setShowFilters(true) // Show filters alongside results
      } catch (err) {
        console.error("[Search error]:", err)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowFilters(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const [minPrice, setMinPrice] = useState<string>("")
  const [maxPrice, setMaxPrice] = useState<string>("")

  const handleClear = () => {
    setQuery("")
    setLocationFilter("")
    setMinPrice("")
    setMaxPrice("")
    setProductResults([])
    setImagePreviewUrl("")
    setIsImageSearching(false)
    setImageAnalysis("")
    setIsOpen(false)
    setShowFilters(false)
    setHasSearched(false)
    inputRef.current?.focus()
  }

  // Build the full search URL with all active filters
  const buildSearchUrl = () => {
    const params = new URLSearchParams()
    if (query.trim()) params.set("search", query.trim())
    if (locationFilter.trim()) params.set("location", locationFilter.trim())
    if (minPrice.trim()) params.set("minPrice", minPrice.trim())
    if (maxPrice.trim()) params.set("maxPrice", maxPrice.trim())
    return `/shop?${params.toString()}`
  }

  const handleFullSearch = () => {
    setIsOpen(false)
    setShowFilters(false)
    window.location.href = buildSearchUrl()
  }

  const handleImageSearch = async (file: File) => {
    // Immediately show a loading indicator while compressing
    setIsImageSearching(true)
    setIsLoading(true)
    setIsOpen(false)
    setShowFilters(false)

    try {
      // Compress image client-side before storing (shrinks size to ~80KB)
      const compressedBase64 = await compressImageForSearch(file)
      // Store compressed image in sessionStorage for the shop page to pick up
      sessionStorage.setItem("tolatola_image_search", compressedBase64)
      // Navigate to shop page with imageSearch flag — results load there
      router.push("/shop?imageSearch=pending")
    } catch (err) {
      console.error("[Image Search Error]", err)
      setIsImageSearching(false)
      setIsLoading(false)
    }
  }

  const activeFilterCount =
    (locationFilter.trim() ? 1 : 0) +
    (minPrice.trim() ? 1 : 0) +
    (maxPrice.trim() ? 1 : 0)

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
          placeholder="Search products, locations..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setShowFilters(true)
            setIsOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim().length >= 2) {
              handleFullSearch()
            }
          }}
          className="pl-9 lg:pl-12 pr-24 lg:pr-32 h-11 lg:h-16 rounded-full lg:rounded-[2rem] bg-stone-50/50 border-stone-500/50 focus-visible:ring-primary/20 focus-visible:bg-white focus-visible:shadow-2xl focus-visible:shadow-primary/5 transition-all text-xs lg:text-lg font-medium placeholder:text-xs lg:placeholder:text-lg placeholder:text-stone-400/80 placeholder:tracking-wide border-2"
        />

        {/* Action buttons */}
        <div className="absolute right-1.5 lg:right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 lg:gap-1">
          {(query || imagePreviewUrl) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 lg:h-10 lg:w-10 hover:bg-stone-100 rounded-full transition-colors"
              onClick={handleClear}
            >
              <X className="h-3.5 w-3.5 lg:h-5 lg:w-5 text-stone-400" />
            </Button>
          )}
          {/* Image search */}
          <input
            type="file"
            id="image-search-input"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImageSearch(file)
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 lg:h-10 lg:w-10 hover:bg-amber-50 rounded-full transition-colors relative"
            onClick={(e) => {
              e.stopPropagation()
              document.getElementById("image-search-input")?.click()
            }}
            title="Search by Image"
          >
            <Camera className="h-3.5 w-3.5 lg:h-5 lg:w-5 text-amber-500" />
            {isImageSearching && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </Button>
          {/* Filter toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7 lg:h-10 lg:w-10 rounded-full transition-all duration-200 relative flex items-center justify-center",
              showFilters
                ? "bg-primary text-white shadow-md shadow-primary/25 scale-105"
                : "hover:bg-stone-100 text-stone-600 hover:text-stone-900"
            )}
            onClick={(e) => {
              e.stopPropagation()
              setShowFilters(!showFilters)
              if (!showFilters) setIsOpen(true)
            }}
            title="Filters"
          >
            <SlidersHorizontal className="h-4 w-4 lg:h-5 lg:w-5 transition-transform duration-200" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[8px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Combined Dropdown: Inline Filters + Search Results */}
      {(isOpen || showFilters) && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[94vw] sm:w-[600px] md:w-[700px] lg:w-[800px] xl:w-[850px] bg-white border border-stone-200 rounded-3xl shadow-2xl z-[100] animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-h-[75vh] overflow-y-auto">

            {/* Inline Filter Controls */}
            {showFilters && !isImageSearching && (
              <div className="p-4 lg:p-5 border-b border-stone-100 bg-stone-50/50 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Location Filter */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-primary" /> Location
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Dar es Salaam, Pwani"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleFullSearch()
                      }}
                      className="h-9 text-xs rounded-xl border-stone-200 bg-white"
                    />
                  </div>

                  {/* Min Price */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-600 flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-emerald-600" /> Min Price (TZS)
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 200 TZS"
                      min={200}
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleFullSearch()
                      }}
                      className="h-9 text-xs rounded-xl border-stone-200 bg-white"
                    />
                  </div>

                  {/* Max Price */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-600 flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-emerald-600" /> Max Price (TZS)
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 50,000,000 TZS"
                      max={50000000}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleFullSearch()
                      }}
                      className="h-9 text-xs rounded-xl border-stone-200 bg-white"
                    />
                  </div>
                </div>

                {/* Apply Button */}
                {(locationFilter.trim() || minPrice.trim() || maxPrice.trim()) && (
                  <Button
                    onClick={handleFullSearch}
                    className="w-full h-9 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 transition-all"
                  >
                    <Search className="h-3.5 w-3.5 mr-1.5" />
                    Apply Filters
                  </Button>
                )}
              </div>
            )}

            {/* Search Results */}
            {hasSearched && productResults.length > 0 && (
              <div className="p-4 lg:p-6 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
                      {productResults.length} Results Found
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-stone-100 mx-4" />
                </div>

                <div className="grid gap-1.5">
                  {productResults.map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      onClick={() => {
                        setIsOpen(false)
                        setShowFilters(false)
                        setQuery("")
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-stone-50 transition-all group/item"
                    >
                      <div className="relative w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-xl overflow-hidden shadow-md border border-stone-100 bg-white">
                        {product.images?.[0] ? (
                          <Image src={product.images[0]} alt={product.name} fill className="object-cover transition-transform duration-500 group-hover/item:scale-110" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-stone-50">
                            <ShoppingBag className="h-5 w-5 text-stone-200" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="text-xs md:text-sm font-black text-stone-900 truncate tracking-tight">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-2">
                          {(product.shops?.region || product.shops?.district || product.location) && (
                            <span className="text-[9px] font-bold text-stone-400 flex items-center gap-0.5 truncate max-w-[150px]">
                              <MapPin className="h-2.5 w-2.5 text-stone-300 flex-shrink-0" />
                              {product.shops?.district || product.shops?.region || product.location}
                            </span>
                          )}
                          <span className="text-[8px] font-black uppercase tracking-widest text-primary px-1.5 py-0.5 bg-primary/10 rounded-full">
                            Verified
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm md:text-base font-black text-stone-950 tracking-tighter">
                          {product.price?.toLocaleString()} <span className="text-[8px] uppercase">TZS</span>
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* No results message */}
            {hasSearched && productResults.length === 0 && !isLoading && (
              <div className="p-8 text-center">
                <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                  <Search className="h-5 w-5 text-stone-300" />
                </div>
                <p className="text-sm font-bold text-stone-400">
                  {`No products found for "${query}"`}
                </p>
                <p className="text-xs text-stone-300 mt-1">
                  Try a different search term or adjust your filters
                </p>
              </div>
            )}

            {/* Quick start hint when no query yet */}
            {!hasSearched && showFilters && (
              <div className="p-5 text-center">
                <p className="text-sm font-bold text-stone-400">
                  Type a product name above to search
                </p>
                <p className="text-xs text-stone-300 mt-1">
                  Use the location and price filters to narrow results
                </p>
              </div>
            )}

            {/* View All Results CTA */}
            {hasSearched && productResults.length > 0 && query.trim().length >= 2 && (
              <div className="p-4 lg:p-5 border-t border-stone-100">
                <Link
                  href={buildSearchUrl()}
                  onClick={() => {
                    setIsOpen(false)
                    setShowFilters(false)
                  }}
                  className="flex items-center justify-center gap-3 w-full p-4 text-xs font-black uppercase tracking-[0.2em] text-stone-400 border-2 border-dashed border-stone-100 rounded-2xl hover:bg-stone-950 hover:text-white hover:border-stone-950 transition-all group/all"
                >
                  <span>View All Results</span>
                  <ArrowRight className="h-4 w-4 group-hover/all:translate-x-2 transition-transform" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
