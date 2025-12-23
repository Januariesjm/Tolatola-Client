"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ShoppingCart, Store } from "lucide-react"
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
    title: "Welcome to TOLA",
    description:
      "Tanzania's trusted multivendor marketplace connecting local producers with customers. Buy and sell with confidence using our secure escrow system and mobile money payments.",
    image_url: null,
    background_color: "transparent",
    text_color: "inherit",
    button_text: "Start Shopping",
    button_link: "/shop",
    display_order: -1,
  }

  // Combine default slide with promotions
  const allSlides = [defaultSlide, ...promotions.sort((a, b) => a.display_order - b.display_order)]

  useEffect(() => {
    if (allSlides.length <= 1) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % allSlides.length)
    }, 15000)

    return () => clearInterval(interval)
  }, [allSlides.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % allSlides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + allSlides.length) % allSlides.length)
  }

  const currentSlideData = allSlides[currentSlide]

  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[200px] md:h-[240px]">
        {currentSlideData.id === "welcome" ? (
          // Welcome slide - Keep original design
          <>
            <div
              className="absolute inset-0 z-0"
              style={{
                backgroundColor: currentSlideData.background_color || "transparent",
              }}
            />
            <div className="container mx-auto px-4 h-full relative z-10 flex items-center">
              <div className="text-center w-full space-y-4 sm:space-y-6">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-balance animate-fade-in-up animation-delay-200">
                  Welcome to <span className="text-primary">TOLA</span>
                </h1>

                {currentSlideData.description && (
                  <p className="text-sm sm:text-base md:text-lg mb-4 sm:mb-5 max-w-2xl mx-auto text-pretty animate-fade-in-up animation-delay-400 px-2 opacity-90">
                    {currentSlideData.description}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-fade-in-up animation-delay-600 px-4 sm:px-0">
                  <Link href="/shop" className="w-full sm:w-auto">
                    <Button size="default" className="w-full sm:w-auto text-base sm:text-lg">
                      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Start Shopping
                    </Button>
                  </Link>
                  <Link href="/vendor/register" className="w-full sm:w-auto">
                    <Button
                      size="default"
                      variant="outline"
                      className="w-full sm:w-auto text-base sm:text-lg bg-background/80 backdrop-blur-sm"
                    >
                      <Store className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Become a Vendor
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Promotional ads - Professional ecommerce style
          <div
            className="relative w-full h-[200px] md:h-[240px] overflow-hidden"
            style={{
              backgroundColor: currentSlideData.background_color || "#f8f9fa",
            }}
          >
            <div className="container mx-auto h-full px-4 relative z-10">
              <div className="grid grid-cols-3 gap-4 md:gap-6 h-full items-center">
                {/* Image Section */}
                <div className="col-span-1 h-full flex items-center justify-center">
                  <div className="relative w-full h-[180px] md:h-[200px] rounded-lg overflow-hidden shadow-md">
                    {currentSlideData.image_url ? (
                      <Image
                        src={currentSlideData.image_url || "/placeholder.svg"}
                        alt={currentSlideData.title || "Promotion"}
                        fill
                        className="object-cover"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Section */}
                <div className="col-span-2 h-full flex flex-col justify-center space-y-3">
                  {/* Description */}
                  {currentSlideData.description && (
                    <p
                      className="text-sm md:text-base leading-snug line-clamp-2 md:line-clamp-3"
                      style={{ color: currentSlideData.text_color || "#1f2937" }}
                    >
                      {currentSlideData.description}
                    </p>
                  )}

                  {/* Order Now Button */}
                  {(currentSlideData.button_link || currentSlideData.product_id) && (
                    <Link 
                      href={currentSlideData.button_link || `/product/${currentSlideData.product_id}`} 
                      className="w-fit"
                    >
                      <Button
                        size="default"
                        className="text-sm md:text-base px-6 py-2 shadow-sm hover:shadow-md transition-all duration-200"
                        style={{
                          backgroundColor: currentSlideData.text_color || "#3b82f6",
                          color: currentSlideData.background_color || "#ffffff",
                        }}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Order Now
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      {allSlides.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-background/80 backdrop-blur-sm hover:bg-background/90 shadow-lg"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-background/80 backdrop-blur-sm hover:bg-background/90 shadow-lg"
            onClick={nextSlide}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Slide Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {allSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide ? "bg-primary w-8" : "bg-muted-foreground/50 w-2 hover:bg-muted-foreground/70"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

