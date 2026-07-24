"use client"

import Image from "next/image"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n/language-context"
import { getCategoryTranslation } from "@/lib/i18n/translations"

interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string | null
  image_url?: string | null
}

interface CategoriesGridProps {
  categories: Category[]
  categoryImages: Record<string, string>
}

export function CategoriesGrid({ categories, categoryImages }: CategoriesGridProps) {
  const { t } = useLanguage()

  const getCategoryImage = (cat: Category): string => {
    if (cat.image_url) return cat.image_url
    if (cat.slug && categoryImages[cat.slug?.toLowerCase()]) return categoryImages[cat.slug.toLowerCase()]
    const categoryName = (cat.name || "").toLowerCase().replace(/\s+/g, "-")
    if (categoryImages[categoryName]) return categoryImages[categoryName]
    const nameLower = (cat.name || "").toLowerCase()
    if (nameLower.includes("agriculture") || nameLower.includes("farm")) return categoryImages.agriculture
    if (nameLower.includes("handicraft") || nameLower.includes("craft")) return categoryImages.handicrafts
    if (nameLower.includes("food") || nameLower.includes("beverage")) return categoryImages.food
    if (nameLower.includes("textile") || nameLower.includes("fabric") || nameLower.includes("cloth") || nameLower.includes("fashion")) return categoryImages.textiles
    if (nameLower.includes("electronic") || nameLower.includes("gadget")) return categoryImages.electronics
    if (nameLower.includes("home") || nameLower.includes("garden")) return categoryImages["home-garden"]
    if (nameLower.includes("health") || nameLower.includes("beauty")) return categoryImages["health-beauty"]
    if (nameLower.includes("service") || nameLower.includes("business")) return categoryImages.services
    if (nameLower.includes("construction") || nameLower.includes("hardware")) return categoryImages["construction-hardware"]
    if (nameLower.includes("fast moving") || nameLower.includes("consumer goods") || nameLower.includes("fmcg")) return categoryImages["fast-moving-consumer-goods"]
    if (nameLower.includes("ready to eat") || nameLower.includes("ready-to-eat")) return categoryImages["ready-to-eat"]
    if (nameLower.includes("spare") || nameLower.includes("part")) return categoryImages["spare-parts"]
    if (nameLower.includes("drink") || nameLower.includes("alcohol")) return categoryImages.drinks
    return categoryImages.default || "/abstract-categories.png"
  }

  const parentCategories = categories
    .filter((c: any) => !c.parent_id)
    .sort((a: any, b: any) => {
      const isAService = a.slug === "services" || a.name?.toLowerCase() === "services"
      const isBService = b.slug === "services" || b.name?.toLowerCase() === "services"
      if (isAService && !isBService) return 1
      if (!isAService && isBService) return -1
      return 0
    })

  return (
    <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-5 md:gap-x-6 md:gap-y-6">
      {parentCategories.slice(0, 12).map((cat: any) => (
        <Link
          key={cat.id}
          href={`/shop?category=${cat.slug || cat.id}`}
          className="group flex flex-col items-center gap-2.5"
        >
          <div className="relative w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-2xl md:rounded-[22px] overflow-hidden bg-stone-50 border border-stone-200/80 group-hover:border-primary/50 group-hover:shadow-xl group-hover:shadow-primary/10 transition-all duration-300 group-hover:scale-105">
            <Image
              src={getCategoryImage(cat)}
              alt={cat.name}
              fill
              className="object-cover"
            />
          </div>
          <h3 className="text-xs md:text-sm font-bold text-stone-800 text-center leading-tight line-clamp-2 max-w-[96px] md:max-w-[112px]">
            {getCategoryTranslation(cat.slug, cat.name, t)}
          </h3>
        </Link>
      ))}
    </div>
  )
}
