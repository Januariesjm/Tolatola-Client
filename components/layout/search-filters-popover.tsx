"use client"

import { useState, useEffect } from "react"
import { X, ChevronDown, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useRouter, useSearchParams } from "next/navigation"

interface Category {
  id: string
  name: string
  slug: string
}

interface SearchFiltersPopoverProps {
  categories: Category[]
  onClose: () => void
}

export function SearchFiltersPopover({ categories, onClose }: SearchFiltersPopoverProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get category from URL - it's a slug, find the matching category ID
  const categorySlug = searchParams.get("category")
  const categoryFromSlug = categorySlug ? categories.find((c) => c.slug === categorySlug) : null

  const [selectedCategories, setSelectedCategories] = useState<string[]>(categoryFromSlug ? [categoryFromSlug.id] : [])
  const [minPriceInput, setMinPriceInput] = useState<string>(searchParams.get("minPrice") || "")
  const [maxPriceInput, setMaxPriceInput] = useState<string>(searchParams.get("maxPrice") || "")
  const [locationQuery, setLocationQuery] = useState<string>(searchParams.get("location") || "")
  const [sortBy, setSortBy] = useState<"name" | "price_asc" | "price_desc" | "newest">((searchParams.get("sort") as any) || "name")

  const handleCategoryToggle = (categoryId: string) => {
    const updated = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId]
    setSelectedCategories(updated)
    updateFilters({ categories: updated })
  }

  const handlePriceApply = () => {
    const min = minPriceInput ? parseInt(minPriceInput) : 0
    const max = maxPriceInput ? parseInt(maxPriceInput) : undefined
    updateFilters({ minPrice: min, maxPrice: max })
  }

  const handleLocationChange = (value: string) => {
    setLocationQuery(value)
  }

  const handleLocationApply = () => {
    updateFilters({ location: locationQuery })
  }

  const handleSortChange = (newSort: "name" | "price_asc" | "price_desc" | "newest") => {
    setSortBy(newSort)
    updateFilters({ sortBy: newSort })
  }

  const updateFilters = (partial: {
    categories?: string[]
    minPrice?: number
    maxPrice?: number
    location?: string
    sortBy?: "name" | "price_asc" | "price_desc" | "newest"
  }) => {
    const newCategories = partial.categories ?? selectedCategories
    const newMinPrice = partial.minPrice ?? (minPriceInput ? parseInt(minPriceInput) : 0)
    const newMaxPrice = partial.maxPrice ?? (maxPriceInput ? parseInt(maxPriceInput) : undefined)
    const newLocation = partial.location ?? locationQuery
    const newSortBy = partial.sortBy ?? sortBy

    // Update URL params
    const params = new URLSearchParams(searchParams.toString())
    if (newCategories.length > 0) {
      const category = categories.find((c) => c.id === newCategories[0])
      if (category) {
        params.set("category", category.slug)
      } else {
        params.set("category", newCategories[0])
      }
    } else {
      params.delete("category")
    }
    if (newMinPrice && newMinPrice > 0) {
      params.set("minPrice", newMinPrice.toString())
    } else {
      params.delete("minPrice")
    }
    if (newMaxPrice && newMaxPrice > 0) {
      params.set("maxPrice", newMaxPrice.toString())
    } else {
      params.delete("maxPrice")
    }
    if (newLocation.trim()) {
      params.set("location", newLocation.trim())
    } else {
      params.delete("location")
    }
    params.set("sort", newSortBy)
    router.push(`/shop?${params.toString()}`, { scroll: false })
  }

  const clearFilters = () => {
    setSelectedCategories([])
    setMinPriceInput("")
    setMaxPriceInput("")
    setLocationQuery("")
    setSortBy("name")
    updateFilters({ categories: [], minPrice: 0, maxPrice: undefined, location: "", sortBy: "name" })
  }

  return (
    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-sm">
            Clear
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Categories Filter */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-left font-medium mb-2">
          <span>Categories</span>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2 max-h-48 overflow-y-auto">
          {categories
            .filter((c: any) => !c.parent_id)
            .map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`filter-category-${category.id}`}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={() => handleCategoryToggle(category.id)}
                />
                <label htmlFor={`filter-category-${category.id}`} className="text-sm cursor-pointer flex-1">
                  {category.name}
                </label>
              </div>
            ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Location Filter */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-left font-medium mb-2">
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Location
          </span>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="e.g. Dar es Salaam, Pwani"
              value={locationQuery}
              onChange={(e) => handleLocationChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLocationApply()
              }}
              className="h-9 text-sm rounded-xl border-stone-200"
            />
            <Button size="sm" onClick={handleLocationApply} className="h-9 px-3 rounded-xl text-xs font-bold">
              Apply
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Price Range Filter */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-left font-medium mb-2">
          <span>Price Range (TZS)</span>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="e.g. 200 TZS"
              min={200}
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              className="h-9 text-sm rounded-xl"
            />
            <Input
              type="number"
              placeholder="e.g. 50,000,000 TZS"
              max={50000000}
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              className="h-9 text-sm rounded-xl"
            />
          </div>
          <Button size="sm" onClick={handlePriceApply} className="w-full h-8 rounded-xl text-xs font-bold">
            Apply Price
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {/* Sort Options */}
      <div>
        <h4 className="font-medium mb-3">Sort By</h4>
        <div className="space-y-2">
          {[
            { value: "name", label: "Name (A-Z)" },
            { value: "price_asc", label: "Price: Low to High" },
            { value: "price_desc", label: "Price: High to Low" },
            { value: "newest", label: "Newest First" },
          ].map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <input
                type="radio"
                id={`filter-sort-${option.value}`}
                name="sort"
                value={option.value}
                checked={sortBy === option.value}
                onChange={() => handleSortChange(option.value as any)}
                className="w-4 h-4"
              />
              <label htmlFor={`filter-sort-${option.value}`} className="text-sm cursor-pointer">
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
