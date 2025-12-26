"use client"

import { useState, useEffect } from "react"
import { X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
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
  const categoryFromSlug = categorySlug 
    ? categories.find(c => c.slug === categorySlug)
    : null
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryFromSlug ? [categoryFromSlug.id] : []
  )
  const [priceRange, setPriceRange] = useState<[number, number]>([
    searchParams.get("minPrice") ? parseInt(searchParams.get("minPrice")!) : 0,
    searchParams.get("maxPrice") ? parseInt(searchParams.get("maxPrice")!) : 1000000
  ])
  const [sortBy, setSortBy] = useState<"name" | "price_asc" | "price_desc" | "newest">(
    (searchParams.get("sort") as any) || "name"
  )

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId]
    setSelectedCategories(newCategories)
    updateFilters({ categories: newCategories })
  }

  const handlePriceChange = (values: number[]) => {
    setPriceRange([values[0], values[1]])
    updateFilters({ minPrice: values[0], maxPrice: values[1] })
  }

  const handleSortChange = (newSort: "name" | "price_asc" | "price_desc" | "newest") => {
    setSortBy(newSort)
    updateFilters({ sortBy: newSort })
  }

  const updateFilters = (partial: {
    categories?: string[]
    minPrice?: number
    maxPrice?: number
    sortBy?: "name" | "price_asc" | "price_desc" | "newest"
  }) => {
    const newCategories = partial.categories ?? selectedCategories
    const newMinPrice = partial.minPrice ?? priceRange[0]
    const newMaxPrice = partial.maxPrice ?? priceRange[1]
    const newSortBy = partial.sortBy ?? sortBy
    
    // Update URL params
    const params = new URLSearchParams(searchParams.toString())
    if (newCategories.length > 0) {
      // Find category by ID and use its slug
      const category = categories.find(c => c.id === newCategories[0])
      if (category) {
        params.set("category", category.slug)
      } else {
        params.set("category", newCategories[0])
      }
    } else {
      params.delete("category")
    }
    if (newMinPrice > 0) {
      params.set("minPrice", newMinPrice.toString())
    } else {
      params.delete("minPrice")
    }
    if (newMaxPrice < 1000000) {
      params.set("maxPrice", newMaxPrice.toString())
    } else {
      params.delete("maxPrice")
    }
    params.set("sort", newSortBy)
    router.push(`/shop?${params.toString()}`, { scroll: false })
  }

  const clearFilters = () => {
    setSelectedCategories([])
    setPriceRange([0, 1000000])
    setSortBy("name")
    updateFilters({ categories: [], minPrice: 0, maxPrice: 1000000, sortBy: "name" })
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
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={`filter-category-${category.id}`}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => handleCategoryToggle(category.id)}
              />
              <label
                htmlFor={`filter-category-${category.id}`}
                className="text-sm cursor-pointer flex-1"
              >
                {category.name}
              </label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Price Range Filter */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-left font-medium mb-2">
          <span>Price Range</span>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <Slider
            value={priceRange}
            onValueChange={handlePriceChange}
            min={0}
            max={1000000}
            step={1000}
            className="mb-4"
          />
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>TZS {priceRange[0].toLocaleString()}</span>
            <span>TZS {priceRange[1].toLocaleString()}</span>
          </div>
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

