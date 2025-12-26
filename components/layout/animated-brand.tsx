"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

export default function AnimatedBrand() {
  const words = ["TOLA"]
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [displayedWords, setDisplayedWords] = useState<string[]>([])
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (currentWordIndex < words.length) {
      const timer = setTimeout(() => {
        setDisplayedWords((prev) => [...prev, words[currentWordIndex]])
        setCurrentWordIndex((prev) => prev + 1)
      }, 500)

      return () => clearTimeout(timer)
    } else {
      setIsComplete(true)
      const resetTimer = setTimeout(() => {
        setDisplayedWords([])
        setCurrentWordIndex(0)
        setIsComplete(false)
      }, 2000)

      return () => clearTimeout(resetTimer)
    }
  }, [currentWordIndex, words.length])

  return (
    <div className="flex items-center justify-center gap-6 mb-8">
      <div className="relative w-32 h-32 md:w-40 md:h-40 animate-fade-in">
        <Image src="/tolalogo.jpg" alt="TOLA Logo" fill className="object-contain" priority />
      </div>

      <div className="flex flex-col items-start">
        <div className="flex flex-wrap gap-3 text-4xl md:text-6xl font-bold">
          {displayedWords.map((word, index) => (
            <span
              key={`${word}-${index}`}
              className="inline-block animate-fade-in-up text-primary"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {word}
            </span>
          ))}
          {!isComplete && displayedWords.length < words.length && (
            <span className="inline-block w-1 h-12 md:h-16 bg-primary animate-pulse ml-1" />
          )}
        </div>
        <p className="text-sm md:text-base text-muted-foreground mt-2 animate-fade-in animation-delay-400">
          Tanzania's Trusted Digital trade and Supply Chain Ecosystem
        </p>
      </div>
    </div>
  )
}
