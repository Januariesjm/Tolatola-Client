"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { translations, type LanguageCode, type TranslationKey } from "./translations"

interface LanguageContextType {
  language: LanguageCode
  setLanguage: (lang: LanguageCode) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en")

  /**
   * Load saved language ON CLIENT
   */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tola-language") as LanguageCode | null
      if (saved && translations[saved]) {
        setLanguageState(saved)
      }
    } catch (err) {
      console.error("Failed to load language", err)
    }
  }, [])

  /**
   * Sync language to DOM + localStorage
   * Runs EVERY time language changes
   */
  useEffect(() => {
    try {
      localStorage.setItem("tola-language", language)
      document.documentElement.lang = language
      document.documentElement.dir = language === "ar" ? "rtl" : "ltr"
    } catch (err) {
      console.error("Failed to persist language", err)
    }
  }, [language])

  /**
   * Public setter
   */
  const setLanguage = (lang: LanguageCode) => {
    if (translations[lang]) {
      setLanguageState(lang)
    }
  }

  /**
   * Translation function
   */
  const t = (key: TranslationKey): string => {
    return (
      translations[language]?.[key] ??
      translations.en[key] ??
      key
    )
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
