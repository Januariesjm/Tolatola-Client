"use client"

import Link from "next/link"
import Image from "next/image"
import { Grid3x3, ChevronRight } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"
import { getCategoryTranslation } from "@/lib/i18n/translations"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id?: string | null
  image_url?: string | null
}

interface CategoriesNavProps {
  categories: Category[]
  currentCategory?: string | null
}

const categoryImages: Record<string, string> = {
  "fast-moving-consumer-goods": "/category-fmcg.jpg",
  agriculture: "/category-agriculture.jpg",
  "construction-hardware": "/category-hardware.jpg",
  handicrafts: "/category-handicrafts.jpg",
  "food-beverages": "/category-food-beverages.jpg",
  textiles: "/category-textiles.jpg",
  fashion: "/category-textiles.jpg",
  electronics: "/category-electronics.jpg",
  "home-garden": "/category-home-garden.jpg",
  "health-beauty": "/category-health-beauty.jpg",
  services: "/category-services.jpg",
  vehicles: "/category-vehicles.jpg",
  "vehicles-sub": "/category-vehicles-sub.jpg",
  "ready-to-eat": "/category-ready-to-eat.jpg",
  "spare-parts": "/category-spare-parts.jpg",
  drinks: "/category-drinks.jpg",
  "non-alcoholic": "/category-non-alcoholic.jpg",
  alcoholic: "/category-alcoholic.jpg",
  motorcycles: "/category-motorcycles.jpg",
  men: "/category-textiles.jpg",
  women: "/category-textiles.jpg",
  kids: "/category-textiles.jpg",
}

function getCatImage(cat: Category): string {
  if (cat.image_url) return cat.image_url
  if (cat.slug && categoryImages[cat.slug]) return categoryImages[cat.slug]
  return "/abstract-categories.png"
}

export function CategoriesNav({ categories, currentCategory }: CategoriesNavProps) {
  const { t } = useLanguage()
  const parentCategories = categories
    .filter(c => !c.parent_id)
    .sort((a, b) => {
      const isAService = a.slug === "services" || a.name?.toLowerCase() === "services"
      const isBService = b.slug === "services" || b.name?.toLowerCase() === "services"
      if (isAService && !isBService) return 1
      if (!isAService && isBService) return -1
      return 0
    })

  return (
    <nav className="sticky top-[108px] lg:top-[72px] z-40 bg-white/80 backdrop-blur-xl border-b border-stone-100 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-start gap-4 lg:gap-6 overflow-x-auto lg:overflow-visible scrollbar-hide py-4">
          {/* All Categories */}
          <Link
            href="/shop"
            className="flex flex-col items-center gap-2 flex-shrink-0 group"
          >
            <div className={`h-14 w-14 lg:h-16 lg:w-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-md ${!currentCategory
              ? "bg-primary text-white shadow-lg shadow-primary/20 ring-2 ring-primary/30"
              : "bg-stone-100/80 text-stone-600 border border-stone-200/60 group-hover:bg-stone-100"
              }`}>
              <Grid3x3 className="h-6 w-6 lg:h-7 lg:w-7" />
            </div>
            <span className={`text-[11px] lg:text-xs font-bold text-center leading-tight max-w-[72px] ${!currentCategory ? "text-primary font-extrabold" : "text-stone-700"}`}>
              {t("category.all")}
            </span>
          </Link>

          {/* Category Links */}
          {parentCategories.slice(0, 12).map((category) => {
            const imageUrl = getCatImage(category)
            const isActive = currentCategory === category.slug
            const subcategories = categories.filter((sub) => sub.parent_id === category.id)
            const hasSubcategories = subcategories.length > 0

            return (
              <div key={category.id} className="relative group flex-shrink-0">
                <Link
                  href={`/shop?category=${category.slug}`}
                  className="flex flex-col items-center gap-2 flex-shrink-0"
                >
                  <div className={`relative h-14 w-14 lg:h-16 lg:w-16 rounded-2xl overflow-hidden bg-stone-50 border transition-all duration-300 group-hover:scale-105 group-hover:shadow-md ${isActive
                    ? "ring-2 ring-primary border-primary shadow-lg shadow-primary/20"
                    : "border-stone-200/80 group-hover:border-primary/40"
                    }`}>
                    <Image
                      src={imageUrl || "/placeholder.svg"}
                      alt={category.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className={`text-[11px] lg:text-xs font-bold text-center leading-tight max-w-[72px] line-clamp-2 ${isActive ? "text-primary font-extrabold" : "text-stone-700"}`}>
                    {getCategoryTranslation(category.slug, category.name, t)}
                  </span>
                </Link>

                {/* Subcategories Dropdown Menu on Hover (Desktop) */}
                {hasSubcategories && (
                  <div className="hidden lg:block absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
                    <div className="w-56 p-2 rounded-2xl bg-white/95 backdrop-blur-xl border border-stone-200/90 shadow-2xl space-y-1 relative">
                      {/* Top Arrow Pointer */}
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white border-t border-l border-stone-200/90" />

                      {/* Subcategories Header */}
                      <div className="px-3 py-1.5 border-b border-stone-100 mb-1 flex items-center justify-between relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-wider text-primary truncate max-w-[140px]">
                          {getCategoryTranslation(category.slug, category.name, t)}
                        </span>
                        <span className="text-[9px] font-bold text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {subcategories.length}
                        </span>
                      </div>

                      {/* Subcategory List Items */}
                      <div className="max-h-64 overflow-y-auto space-y-0.5 relative z-10">
                        {subcategories.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/shop?category=${sub.slug}`}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50 text-stone-700 hover:text-primary transition-all group/sub"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative h-6 w-6 rounded-lg overflow-hidden bg-stone-100 border border-stone-200/60 flex-shrink-0">
                                <Image
                                  src={getCatImage(sub)}
                                  alt={sub.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <span className="text-xs font-bold truncate">
                                {getCategoryTranslation(sub.slug, sub.name, t)}
                              </span>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover/sub:opacity-100 group-hover/sub:translate-x-0.5 transition-all text-primary flex-shrink-0" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
