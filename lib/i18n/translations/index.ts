import { en } from "./en"
import { sw } from "./sw"
import { ar } from "./ar"
import { zh } from "./zh"

export const translations = { en, sw, ar, zh }

/**
 * Returns the translated category name for a given slug and t() function.
 * Falls back to the raw DB name if no translation exists.
 */
export function getCategoryTranslation(slug: string | undefined | null, rawName: string, t: (key: TranslationKey) => string): string {
  if (!slug) return rawName
  const key = `category.${slug}` as TranslationKey
  const translated = t(key)
  // If t() returns the key itself (no match), fall back to rawName
  return translated === key ? rawName : translated
}

export type LanguageCode = keyof typeof translations
export type TranslationKey = keyof typeof translations.en
