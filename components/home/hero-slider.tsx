"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ShoppingCart, Store, ArrowRight, Sparkles } from "lucide-react"
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

interface HeroSliderProps {
  promotions: Promotion[]
}

export function HeroSlider({ promotions }: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  // Default welcome slide
  const defaultSlide = {
    id: "welcome",
    title: "Shop with Confidence",
    description:
      "Discover amazing products from verified sellers. Secure payments, fast delivery, and trusted service.",
    image_url: "https://images.unsplash.com/photo-1542361345-89e58247f2d5?q=80&w=2070&auto=format&fit=crop",
    background_color: "transparent",
    text_color: "white",
    button_text: "Start Shopping",
    button_link: "/shop",
    display_order: -1,
  }

  const allSlides = [defaultSlide, ...promotions.sort((a, b) => a.display_order - b.display_order)]

  useEffect(() => {
    if (allSlides.length <= 1) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % allSlides.length)
    }, 12000)
    return () => clearInterval(interval)
  }, [allSlides.length])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % allSlides.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + allSlides.length) % allSlides.length)

  const currentSlideData = allSlides[currentSlide]

  return (
    <section className="relative h-[320px] sm:h-[360px] md:h-[420px] w-full overflow-hidden bg-stone-950">
      {/* Background Layer */}
      {allSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          {slide.image_url ? (
            <Image
              src={slide.image_url}
              alt={slide.title}
              fill
              className="object-cover"
              priority={index === 0}
              sizes="100vw"
            />
          ) : (
            <div className="w-full h-full bg-stone-900" />
          )}
          {/* Subtle overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-950/50 to-stone-950/30" />
        </div>
      ))}

      {/* Content Layer - Optimized for mobile */}
      <div className="container mx-auto px-4 sm:px-6 h-full relative z-20 flex items-center">
        <div className="w-full max-w-2xl space-y-4 sm:space-y-5">
          {/* Badge - Shown on mobile and up */}
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm transition-all duration-500 opacity-100">
            <Sparkles className="h-3 w-3" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Special Offer</span>
          </div>

          {/* Title - Responsive sizing */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
            {currentSlideData.id === "welcome" ? (
              <>Shop with <span className="text-primary">Confidence</span></>
            ) : (
              currentSlideData.title
            )}
          </h1>

          {/* Description - Clear and concise */}
          <p className="text-white/90 text-sm sm:text-base md:text-lg font-medium leading-snug max-w-xl">
            {currentSlideData.description || "Discover amazing deals and shop from trusted sellers."}
          </p>

          {/* Action Buttons - Prominent and clear */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link href={currentSlideData.button_link || "/shop"} className="flex-1 sm:flex-none">
              <Button 
                size="lg" 
                className="w-full sm:w-auto text-base sm:text-lg font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all group bg-primary text-white hover:bg-primary/90 py-6 px-6 sm:px-8"
              >
                {currentSlideData.button_text || "Shop Now"}
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            {currentSlideData.id === "welcome" && (
              <Link href="/vendor/register" className="flex-1 sm:flex-none">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto text-base sm:text-lg font-semibold rounded-xl bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white hover:text-stone-950 transition-all py-6 px-6 sm:px-8"
                >
                  Become a Seller
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Indicators - Compact and mobile-friendly */}
      {allSlides.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30">
          <div className="flex gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
            {allSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? "bg-primary w-6 sm:w-8" 
                    : "bg-white/40 w-1.5 sm:w-2 hover:bg-white/60"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Navigation Arrows - Desktop only, smaller and more subtle */}
      {allSlides.length > 1 && (
        <div className="hidden md:flex absolute right-4 bottom-6 z-30 gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-sm border-white/20 text-white hover:bg-primary hover:border-primary transition-all"
            onClick={prevSlide}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-sm border-white/20 text-white hover:bg-primary hover:border-primary transition-all"
            onClick={nextSlide}
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}
    </section>
  )
}
