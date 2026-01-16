"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ShoppingCart, Store, Truck } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Promotion {
  id: string
  title: string
  description: string | null
  image_url: string | null
  background_color: string
  text_color: string
  button_text: string
  button_link: string | null
  display_order: number
  product_id?: string | null
}

interface PromotionalBannerProps {
  promotions: Promotion[]
}

export function PromotionalBanner({ promotions }: PromotionalBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  // Default welcome slide
  const defaultSlide = {
    id: "welcome",
    title: "Shop with Confidence",
    description: "Discover amazing products from verified sellers.",
    image_url: "https://images.unsplash.com/photo-1542361345-89e58247f2d5?q=80&w=2070&auto=format&fit=crop",
    background_color: "#0f766e",
    text_color: "white",
    button_text: "Start Shopping",
    button_link: "/shop",
    display_order: -1,
  }

  const allSlides = promotions.length > 0 ? promotions.sort((a, b) => a.display_order - b.display_order) : [defaultSlide]

  useEffect(() => {
    if (allSlides.length <= 1) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % allSlides.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [allSlides.length])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % allSlides.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + allSlides.length) % allSlides.length)

  return (
    <section className="relative w-full overflow-hidden bg-stone-100 h-[140px] md:h-[200px]">
      {/* Slides Container */}
      {allSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          style={{ backgroundColor: slide.background_color }}
        >
          {/* Background Image only */}
          {slide.image_url && (
            <div className="absolute inset-0 w-full h-full opacity-30">
              <Image
                src={slide.image_url}
                alt=""
                fill
                className="object-cover"
                priority={index === 0}
                sizes="100vw"
              />
            </div>
          )}

          {/* Content Layer */}
          <div className="relative z-20 h-full container mx-auto px-4 md:px-5 py-3 md:py-4 flex flex-col justify-center">
            <div className="max-w-[70%]">
              {/* Headline */}
              <h2
                className="text-[20px] md:text-[24px] font-medium leading-[1.2] tracking-tight mb-1"
                style={{ color: slide.text_color }}
              >
                {slide.title}
              </h2>

              {/* Subtext - Only one short sentence */}
              {slide.description && (
                <p
                  className="text-[14px] md:text-[16px] font-normal leading-[1.3] opacity-90 line-clamp-1"
                  style={{ color: slide.text_color }}
                >
                  {slide.description}
                </p>
              )}
            </div>

            {/* CTA - Small button */}
            <div className="mt-3 md:mt-4">
              {slide.button_text && slide.button_link && (
                <Link href={slide.button_link.includes('|') ? slide.button_link.split('|')[0] : slide.button_link}>
                  <Button
                    size="sm"
                    className="h-8 md:h-9 px-4 text-xs font-semibold rounded-md shadow-sm transition-all hover:scale-105"
                    style={{
                      backgroundColor: slide.text_color === 'white' ? 'white' : 'black',
                      color: slide.text_color === 'white' ? slide.background_color : 'white'
                    }}
                  >
                    {slide.button_text.includes('|') ? slide.button_text.split('|')[0] : slide.button_text}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Navigation - Minimal */}
      {allSlides.length > 1 && (
        <>
          <div className="absolute top-1/2 left-2 -translate-y-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40"
              onClick={prevSlide}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute top-1/2 right-2 -translate-y-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40"
              onClick={nextSlide}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Indicators - Small dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
            {allSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1 rounded-full transition-all duration-300 ${index === currentSlide ? "bg-white w-4" : "bg-white/40 w-1"}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
