/**
 * Display config for career application statuses: label, badge color and icon.
 *
 * Extracted from components/admin/hr-applications-subtab.tsx, where it was a
 * module-level object shared (by closure) between the table row and the detail
 * dialog. Living outside the component means both places that need it --
 * career-application-detail-dialog.tsx and the table -- import the same
 * definition rather than one of them silently drifting.
 */

import { Clock, Eye, Star, XCircle } from "lucide-react"
import type { CareerApplication } from "@/lib/admin/career-applications"

export const APPLICATION_STATUS_CONFIG: Record<CareerApplication["status"], { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="h-3 w-3" /> },
  reviewed: { label: "Reviewed", color: "bg-blue-50 text-blue-700 border-blue-200", icon: <Eye className="h-3 w-3" /> },
  shortlisted: { label: "Shortlisted", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <Star className="h-3 w-3" /> },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-700 border-red-200", icon: <XCircle className="h-3 w-3" /> },
}
