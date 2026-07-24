import Link from "next/link"
import Image from "next/image"
import { Grid3x3 } from "lucide-react"

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
  const parentCategories = categories.filter(c => !c.parent_id)

  return (
    <nav className="sticky top-[108px] lg:top-[72px] z-40 bg-white/80 backdrop-blur-xl border-b border-stone-100 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-start gap-5 lg:gap-6 overflow-x-auto scrollbar-hide py-4">
          {/* All Categories */}
          <Link
            href="/shop"
            className="flex flex-col items-center gap-2 flex-shrink-0 group"
          >
            <div className={`h-12 w-12 lg:h-14 lg:w-14 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg ${!currentCategory
              ? "bg-primary text-white shadow-xl shadow-primary/20 ring-2 ring-primary/30"
              : "bg-stone-100 text-stone-500 group-hover:bg-stone-200"
              }`}>
              <Grid3x3 className="h-5 w-5 lg:h-6 lg:w-6" />
            </div>
            <span className={`text-[10px] lg:text-[11px] font-bold text-center leading-tight max-w-[64px] ${!currentCategory ? "text-primary" : "text-stone-600"}`}>
              All
            </span>
          </Link>

          {/* Category Links */}
          {parentCategories.slice(0, 12).map((category) => {
            const imageUrl = getCatImage(category)
            const isActive = currentCategory === category.slug

            return (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug}`}
                className="flex flex-col items-center gap-2 flex-shrink-0 group"
              >
                <div className={`relative h-12 w-12 lg:h-14 lg:w-14 rounded-full overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg ${isActive
                  ? "ring-2 ring-primary shadow-xl shadow-primary/20"
                  : "ring-1 ring-stone-200 group-hover:ring-primary/40"
                  }`}>
                  <Image
                    src={imageUrl || "/placeholder.svg"}
                    alt={category.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <span className={`text-[10px] lg:text-[11px] font-bold text-center leading-tight max-w-[64px] line-clamp-2 ${isActive ? "text-primary" : "text-stone-600"}`}>
                  {category.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
