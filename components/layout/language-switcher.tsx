"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Languages, Check, Globe } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"
import { cn } from "@/lib/utils"

const languages = [
  { code: "en" as const, name: "English", flag: "EN" },
  { code: "sw" as const, name: "Kiswahili", flag: "SW" },
  { code: "ar" as const, name: "العربية", flag: "AR" },
  { code: "zh" as const, name: "中文", flag: "ZH" },
]

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  const currentLanguage = languages.find((lang) => lang.code === language)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-10 px-4 rounded-xl hover:bg-stone-100 flex items-center gap-3 transition-all duration-300">
          <Globe className="h-4 w-4 text-stone-400 group-hover:text-primary transition-colors" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-900">{currentLanguage?.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-stone-100 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-500">
        <div className="px-3 py-2">
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-stone-400">Select Dialect</p>
        </div>
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={cn(
              "rounded-xl h-12 cursor-pointer flex items-center justify-between px-4 transition-colors",
              language === lang.code ? "bg-primary/5 text-primary" : "focus:bg-stone-50"
            )}
          >
            <span className="flex items-center gap-3">
              <span className="text-[10px] font-black w-6">{lang.flag}</span>
              <span className="font-bold text-sm tracking-tight">{lang.name}</span>
            </span>
            {language === lang.code && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
