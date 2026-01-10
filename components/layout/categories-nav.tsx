import Link from "next/link"
import Image from "next/image"
import { Grid3x3 } from "lucide-react"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
}

interface CategoriesNavProps {
  categories: Category[]
  currentCategory?: string | null
}

const categoryImages: Record<string, string> = {
  "fast-moving-consumer-goods": "/category-fmcg.jpg",
  agriculture: "/fresh-vegetables-and-farming-crops.jpg",
  "construction-hardware": "/category-hardware.jpg",
  handicrafts: "/handmade-crafts-and-artisan-products.jpg",
  "food-beverages": "/delicious-food-and-beverages.jpg",
  textiles: "/colorful-fabrics-and-textiles.jpg",
  electronics: "/modern-electronics-smartphone-and-gadgets.jpg",
  "home-garden": "/home-decor-and-garden-plants.jpg",
  "health-beauty": "/beauty-and-skincare-products.jpg",
  services: "/professional-services-and-business.jpg",
  vehicles: "/category-vehicles.jpg",
}

export function CategoriesNav({ categories, currentCategory }: CategoriesNavProps) {
  return (
    <nav className="sticky top-[140px] lg:top-[72px] z-40 bg-white/80 backdrop-blur-xl border-b border-stone-100 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-4">
          {/* All Categories */}
          <Link
            href="/shop"
            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl whitespace-nowrap transition-all font-black text-xs uppercase tracking-widest ${!currentCategory
              ? "bg-primary text-white shadow-xl shadow-primary/20"
              : "bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-100"
              }`}
          >
            <Grid3x3 className="h-4 w-4" />
            <span>All Categories</span>
          </Link>

          {/* Category Links */}
          {categories.slice(0, 12).map((category) => {
            const imageUrl = categoryImages[category.slug] || "/abstract-categories.png"
            const isActive = currentCategory === category.slug

            return (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug}`}
                className={`flex items-center gap-3 px-5 py-2 rounded-2xl whitespace-nowrap transition-all border font-bold text-xs ${isActive
                  ? "bg-primary text-white border-primary shadow-xl shadow-primary/20"
                  : "bg-white text-stone-600 border-stone-100 hover:border-primary/30 hover:bg-stone-50"
                  }`}
              >
                <div className="relative h-6 w-6 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
                  <Image src={imageUrl || "/placeholder.svg"} alt={category.name} fill className="object-cover" />
                </div>
                <span>{category.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
