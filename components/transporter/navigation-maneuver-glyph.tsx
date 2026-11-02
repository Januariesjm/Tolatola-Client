import { ArrowLeft, ArrowRight, ArrowUp, Flag, GitMerge, Navigation, RotateCw, Undo2 } from "lucide-react"
import type { ManeuverKind } from "@/lib/maps/navigation"

/** Icon for a Mapbox manoeuvre type, used by the turn-by-turn card. */
export function NavigationManeuverGlyph({ kind }: { kind: ManeuverKind }) {
  const className = "h-6 w-6"
  switch (kind) {
    case "left":
      return <ArrowLeft className={className} />
    case "right":
      return <ArrowRight className={className} />
    case "slight-left":
      return <ArrowLeft className={`${className} -rotate-45`} />
    case "slight-right":
      return <ArrowRight className={`${className} rotate-45`} />
    case "uturn":
      return <Undo2 className={className} />
    case "roundabout":
      return <RotateCw className={className} />
    case "merge":
      return <GitMerge className={className} />
    case "arrive":
      return <Flag className={className} />
    case "depart":
      return <Navigation className={className} />
    default:
      return <ArrowUp className={className} />
  }
}
