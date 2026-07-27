"use client"

import React, { useRef } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Handshake } from "lucide-react"

interface Partner {
  name: string
  logo: string
}

const partners: Partner[] = [
  { name: "CLICKPESA", logo: "/partners/clickpesa.png" },
  { name: "AIRTEL", logo: "/partners/airtel.svg" },
  { name: "VODACOM", logo: "/partners/vodacom.png" },
  { name: "MIX BY YAS", logo: "/partners/mix-by-yas.svg" },
  { name: "HALOTEL", logo: "/partners/halotel.png" },
  { name: "CRDB BANK", logo: "/partners/crdb.png" },
  { name: "EQUITY BANK", logo: "/partners/equity.png" },
  { name: "NMB BANK", logo: "/partners/nmb.png" },
  { name: "ABSA BANK", logo: "/partners/absa.svg" },
  { name: "DAN'G GROUP", logo: "/partners/dang-group.png" },
]

export function PartnersSection() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -320 : 320
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  return (
    <section className="py-8 md:py-12 bg-white border-b border-stone-200/60 overflow-hidden relative">
      <div className="container mx-auto px-4">
        {/* Header with Navigation Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-8 gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              <Handshake className="h-3.5 w-3.5" />
              <span>Ecosystem Partners</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-stone-900">
              Our Strategic <span className="text-primary italic">Partners</span>
            </h2>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center justify-center md:justify-end gap-2">
            <button
              onClick={() => handleScroll("left")}
              aria-label="Scroll left"
              className="p-2.5 rounded-full border border-stone-200 bg-white text-stone-700 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-xs active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleScroll("right")}
              aria-label="Scroll right"
              className="p-2.5 rounded-full border border-stone-200 bg-white text-stone-700 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-xs active:scale-95"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex items-center gap-4 md:gap-6 overflow-x-auto scrollbar-none py-2 scroll-smooth select-none snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {partners.map((partner, index) => (
            <div
              key={index}
              className="flex-none snap-start w-48 md:w-56 p-4 rounded-2xl bg-white border border-stone-200/80 hover:border-primary/40 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center justify-between text-center group cursor-pointer"
            >
              <div className="relative w-full h-20 flex items-center justify-center p-3 rounded-xl bg-stone-50/80 border border-stone-100 group-hover:bg-white group-hover:border-primary/20 transition-all duration-300 overflow-hidden">
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  width={140}
                  height={60}
                  className="object-contain max-h-14 w-auto group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="mt-3">
                <h3 className="text-xs font-black tracking-wider text-stone-900 uppercase group-hover:text-primary transition-colors">
                  {partner.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
