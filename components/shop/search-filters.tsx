"use client"

import { useState } from "react"
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react"
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

interface SearchFiltersProps {
  categories: Category[]
  onFiltersChange?: (filters: FilterState) => void
}

export interface FilterState {
  categories: string[]
  minPrice: number
  maxPrice: number
  sortBy: "name" | "price_asc" | "price_desc" | "newest"
}

export function SearchFilters({ categories, onFiltersChange }: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  
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
  const [sortBy, setSortBy] = useState<FilterState["sortBy"]>(
    (searchParams.get("sort") as FilterState["sortBy"]) || "name"
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

  const handleSortChange = (newSort: FilterState["sortBy"]) => {
    setSortBy(newSort)
    updateFilters({ sortBy: newSort })
  }

  const updateFilters = (partial: Partial<FilterState>) => {
    const newFilters: FilterState = {
      categories: selectedCategories,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      sortBy,
      ...partial,
    }
    onFiltersChange?.(newFilters)
    
    // Update URL params
    const params = new URLSearchParams(searchParams.toString())
    if (newFilters.categories.length > 0) {
      // Find category by ID and use its slug
      const category = categories.find(c => c.id === newFilters.categories[0])
      if (category) {
        params.set("category", category.slug)
      } else {
        params.set("category", newFilters.categories[0])
      }
    } else {
      params.delete("category")
    }
    if (newFilters.minPrice > 0) {
      params.set("minPrice", newFilters.minPrice.toString())
    } else {
      params.delete("minPrice")
    }
    if (newFilters.maxPrice < 1000000) {
      params.set("maxPrice", newFilters.maxPrice.toString())
    } else {
      params.delete("maxPrice")
    }
    params.set("sort", newFilters.sortBy)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const clearFilters = () => {
    setSelectedCategories([])
    setPriceRange([0, 1000000])
    setSortBy("name")
    updateFilters({ categories: [], minPrice: 0, maxPrice: 1000000, sortBy: "name" })
  }

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Filters Panel */}
      <div
        className={`${
          isOpen ? "block" : "hidden"
        } lg:block bg-white border border-gray-200 rounded-lg p-6 space-y-6`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Filters</h3>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-sm">
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>

        {/* Categories Filter */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-left font-medium mb-2">
            <span>Categories</span>
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={() => handleCategoryToggle(category.id)}
                />
                <label
                  htmlFor={`category-${category.id}`}
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
                  id={`sort-${option.value}`}
                  name="sort"
                  value={option.value}
                  checked={sortBy === option.value}
                  onChange={() => handleSortChange(option.value as FilterState["sortBy"])}
                  className="w-4 h-4"
                />
                <label htmlFor={`sort-${option.value}`} className="text-sm cursor-pointer">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

