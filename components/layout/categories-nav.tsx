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
  agriculture: "/fresh-vegetables-and-farming-crops.jpg",
  handicrafts: "/handmade-crafts-and-artisan-products.jpg",
  "food-beverages": "/delicious-food-and-beverages.jpg",
  textiles: "/colorful-fabrics-and-textiles.jpg",
  electronics: "/modern-electronics-smartphone-and-gadgets.jpg",
  "home-garden": "/home-decor-and-garden-plants.jpg",
  "health-beauty": "/beauty-and-skincare-products.jpg",
  services: "/professional-services-and-business.jpg",
}

export function CategoriesNav({ categories, currentCategory }: CategoriesNavProps) {
  return (
    <nav className="sticky top-[72px] z-40 bg-background/95 backdrop-blur-sm border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-3">
          {/* All Categories */}
          <Link
            href="/shop"
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              !currentCategory
                ? "bg-green-600 text-white shadow-md hover:bg-green-700"
                : "bg-blue-600 text-white hover:bg-green-600 hover:shadow-md"
            }`}
          >
            <Grid3x3 className="h-5 w-5" />
            <span className="font-medium text-sm">All Categories</span>
          </Link>

          {/* Category Links */}
          {categories.map((category) => {
            const imageUrl = categoryImages[category.slug] || "/abstract-categories.png"
            const isActive = currentCategory === category.slug

            return (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug}`}
                className={`flex items-center gap-3 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-green-600 text-white shadow-md hover:bg-green-700"
                    : "bg-blue-600 text-white hover:bg-green-600 hover:shadow-md"
                }`}
              >
                <div className="relative h-8 w-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-background shadow-sm">
                  <Image src={imageUrl || "/placeholder.svg"} alt={category.name} fill className="object-cover" />
                </div>
                <span className="font-medium text-sm">{category.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
