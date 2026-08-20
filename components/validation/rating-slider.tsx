"use client"

interface RatingSliderProps {
  label: string
  value: number
  onChange: (v: number) => void
  questionNum: string
}

/** 1-10 slider used for the survey's rating questions. */
export function RatingSlider({ label, value, onChange, questionNum }: RatingSliderProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700">
        <span className="text-primary font-bold mr-1">{questionNum}.</span>
        {label}
      </label>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-primary bg-slate-200"
        />
        <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-lg">{value}</span>
      </div>
      <div className="flex justify-between text-xs text-slate-400 px-1">
        <span>1 — Low</span>
        <span>10 — High</span>
      </div>
    </div>
  )
}
