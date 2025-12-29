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
    <section className="relative w-full overflow-hidden bg-stone-950">
      {/* Slides Container */}
      {allSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`transition-all duration-1000 ease-in-out ${index === currentSlide ? "opacity-100 block" : "opacity-0 hidden"
            }`}
        >
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 md:py-12">
            <div className="flex flex-row gap-4 sm:gap-6 md:gap-8 lg:gap-12 items-center">
              {/* Image Section - Left Side */}
              <div className="w-[35%] md:w-1/2 lg:w-2/5 h-[160px] sm:h-[280px] md:h-[360px] lg:h-[400px] relative rounded-xl md:rounded-2xl overflow-hidden shadow-xl md:shadow-2xl flex-shrink-0">
                {slide.image_url ? (
                  <Image
                    src={slide.image_url}
                    alt={slide.title}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-stone-800 to-stone-900" />
                )}
              </div>

              {/* Content Section - Right Side */}
              <div className="flex-1 min-w-0 flex flex-col justify-center space-y-2 sm:space-y-5 md:space-y-6">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm w-fit">
                  <Sparkles className="h-3 w-3" />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Special Offer</span>
                </div>

                {/* Title */}
                <h1 className="text-lg sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-tight tracking-tight line-clamp-2 md:line-clamp-none">
                  {slide.id === "welcome" ? (
                    <>Shop with <span className="text-primary">Confidence</span></>
                  ) : (
                    slide.title
                  )}
                </h1>

                {/* Description */}
                <p className="text-white/90 text-xs sm:text-base md:text-lg lg:text-xl font-medium leading-relaxed max-w-2xl line-clamp-2 md:line-clamp-none">
                  {slide.description || "Discover amazing deals and shop from trusted sellers."}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-1 md:pt-2">
                  <Link href={slide.button_link || "/shop"} className="flex-none">
                    <Button
                      size="sm"
                      className="w-auto h-8 md:h-12 text-xs md:text-base sm:text-lg font-bold rounded-lg md:rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all group bg-primary text-white hover:bg-primary/90 px-3 md:px-8"
                    >
                      {slide.button_text || "Shop Now"}
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  {slide.id === "welcome" && (
                    <>
                      <Link href="/auth/sign-up?userType=vendor" className="flex-1 sm:flex-none">
                        <Button
                          size="lg"
                          variant="outline"
                          className="w-full sm:w-auto text-base sm:text-lg font-semibold rounded-xl bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white hover:text-stone-950 transition-all py-6 px-6 sm:px-8"
                        >
                          Become a Seller
                        </Button>
                      </Link>
                      <Link href="/auth/sign-up?userType=transporter" className="flex-none">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-auto h-8 md:h-12 text-xs md:text-base sm:text-lg font-semibold rounded-lg md:rounded-xl bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white hover:text-stone-950 transition-all px-3 md:px-8"
                        >
                          Become a Transporter
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Indicators and Navigation */}
      {allSlides.length > 1 && (
        <div className="container mx-auto px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="flex items-center justify-between">
            {/* Navigation Arrows */}
            <div className="flex gap-2">
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

            {/* Indicators */}
            <div className="flex gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
              {allSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${index === currentSlide
                      ? "bg-primary w-6 sm:w-8"
                      : "bg-white/40 w-1.5 sm:w-2 hover:bg-white/60"
                    }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
