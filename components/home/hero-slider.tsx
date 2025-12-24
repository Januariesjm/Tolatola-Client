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
    title: "The Future of Trade in Tanzania",
    description:
      "TOLA is the premier multivendor marketplace connecting local artisans, verified vendors, and customers through a secure escrow-backed ecosystem.",
    image_url: "https://images.unsplash.com/photo-1542361345-89e58247f2d5?q=80&w=2070&auto=format&fit=crop",
    background_color: "transparent",
    text_color: "white",
    button_text: "Shop the Collection",
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
    <section className="relative h-[650px] md:h-[750px] w-full overflow-hidden bg-stone-950">
      {/* Background Layer */}
      {allSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-[2000ms] ease-in-out ${index === currentSlide ? "opacity-100 scale-110" : "opacity-0 scale-100"
            }`}
        >
          {slide.image_url ? (
            <Image
              src={slide.image_url}
              alt={slide.title}
              fill
              className="object-cover"
              priority={index === 0}
            />
          ) : (
            <div className="w-full h-full bg-stone-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent" />
        </div>
      ))}

      {/* Content Layer */}
      <div className="container mx-auto px-4 h-full relative z-20 flex flex-col justify-center">
        <div className="max-w-3xl space-y-8">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur-md transition-all duration-700 delay-300 ${currentSlide === currentSlide ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-black uppercase tracking-widest">TOLA Global Marketplace</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black text-white leading-[1.1] tracking-tighter">
            {currentSlideData.id === "welcome" ? (
              <>Tanzania's <span className="text-primary italic">Vivid</span> Commerce</>
            ) : (
              currentSlideData.title
            )}
          </h1>

          <p className="text-stone-300 text-lg md:text-2xl font-medium leading-relaxed italic max-w-2xl opacity-90 transition-all duration-700 delay-500">
            {currentSlideData.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 transition-all duration-700 delay-700">
            <Link href={currentSlideData.button_link || "/shop"}>
              <Button size="lg" className="w-full sm:w-auto text-lg font-black rounded-2xl shadow-2xl hover:scale-105 transition-all group py-8 px-10">
                {currentSlideData.button_text}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/vendor/register">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg font-bold rounded-2xl bg-white/5 backdrop-blur-xl border-white/20 text-white hover:bg-white hover:text-stone-950 transition-all py-8 px-10">
                Sell on Tola
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Indicators */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4">
        <div className="flex gap-2 p-2 bg-white/5 backdrop-blur-2xl rounded-full border border-white/10">
          {allSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-500 ${index === currentSlide ? "bg-primary w-12" : "bg-white/20 w-2 hover:bg-white/40"
                }`}
            />
          ))}
        </div>
      </div>

      {/* Side Navigation */}
      <div className="hidden md:flex absolute right-12 bottom-12 z-30 gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-2xl bg-white/5 backdrop-blur-xl border-white/10 text-white hover:bg-primary transition-all"
          onClick={prevSlide}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-2xl bg-white/5 backdrop-blur-xl border-white/10 text-white hover:bg-primary transition-all"
          onClick={nextSlide}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </section>
  )
}
