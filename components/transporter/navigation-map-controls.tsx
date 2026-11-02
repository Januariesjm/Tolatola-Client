"use client"

import { Crosshair, Maximize2 } from "lucide-react"

interface NavigationMapControlsProps {
  onRecenter: () => void
  onFitRoute: () => void
}

/** Floating camera controls: heading-up recenter and whole-route overview. */
export function NavigationMapControls({ onRecenter, onFitRoute }: NavigationMapControlsProps) {
  return (
    <div className="absolute right-4 z-20 flex flex-col gap-2.5 bottom-[340px] lg:bottom-6">
      <button
        type="button"
        onClick={onRecenter}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-800 shadow-lg hover:bg-slate-50"
        aria-label="Recenter on me"
      >
        <Crosshair className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onFitRoute}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-800 shadow-lg hover:bg-slate-50"
        aria-label="Show the whole route"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
    </div>
  )
}
