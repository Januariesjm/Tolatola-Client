"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-teal-800/40 border border-cyan-700/30 text-white text-xs font-semibold ${className}`}
      >
        <Sun className="h-4 w-4 text-amber-300" />
        <span>Theme</span>
      </button>
    )
  }

  const isDark = theme === "dark"

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <button
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-cyan-400/40 text-white text-xs font-bold transition-all duration-300 shadow-md hover:scale-105 active:scale-95 cursor-pointer ${className}`}
      title={`Switch to ${isDark ? "Light" : "Dark"} mode`}
      aria-label="Toggle dark/light theme"
    >
      {isDark ? (
        <>
          <Sun className="h-4 w-4 text-amber-300 animate-spin-slow" />
          <span>Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 text-cyan-200" />
          <span>Dark Mode</span>
        </>
      )}
    </button>
  )
}
