"use client"

import { useEffect, useState } from "react"

export function HeaderAnimatedText() {
  const words = ["TOLA"]
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [displayedWords, setDisplayedWords] = useState<string[]>([])

  useEffect(() => {
    if (currentWordIndex < words.length) {
      const timer = setTimeout(() => {
        setDisplayedWords((prev) => [...prev, words[currentWordIndex]])
        setCurrentWordIndex((prev) => prev + 1)
      }, 400)

      return () => clearTimeout(timer)
    } else {
      const resetTimer = setTimeout(() => {
        setDisplayedWords([])
        setCurrentWordIndex(0)
      }, 2000)

      return () => clearTimeout(resetTimer)
    }
  }, [currentWordIndex, words.length])

  return (
    <div className="flex items-center gap-1.5 md:gap-2 text-sm sm:text-base md:text-xl lg:text-2xl font-semibold">
      {displayedWords.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="inline-block animate-fade-in-up text-primary"
          style={{
            animationDelay: `${index * 50}ms`,
          }}
        >
          {word}
        </span>
      ))}
      {displayedWords.length < words.length && (
        <span className="inline-block w-0.5 h-4 md:h-5 lg:h-6 bg-primary animate-pulse" />
      )}
    </div>
  )
}
