"use client"

/**
 * Application detail dialog for the admin HR applications list.
 *
 * Extracted verbatim from components/admin/hr-applications-subtab.tsx.
 */

import { ExternalLink, FileSignature, FileText, GraduationCap, Loader2, Paperclip, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { APPLICATION_STATUS_CONFIG } from "@/components/admin/career-application-status"
import type { CareerApplication } from "@/lib/admin/career-applications"

export interface CareerApplicationDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  application: CareerApplication | null
  loadingId: string | null
  onStatusChange: (id: string, status: string) => void
  onDelete: (id: string) => void
}

export function CareerApplicationDetailDialog({
  open,
  onOpenChange,
  application: selectedApp,
  loadingId,
  onStatusChange,
  onDelete,
}: CareerApplicationDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {selectedApp && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-black">{selectedApp.full_name}</DialogTitle>
              <DialogDescription className="space-y-1">
                <span className="block">{selectedApp.email}</span>
                {selectedApp.phone && <span className="block">{selectedApp.phone}</span>}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Position</p>
                  <p className="font-semibold">{selectedApp.position}</p>
                </div>
                <Badge
                  variant="outline"
                  className={`${APPLICATION_STATUS_CONFIG[selectedApp.status].color} gap-1 text-xs font-bold uppercase tracking-wider`}
                >
                  {APPLICATION_STATUS_CONFIG[selectedApp.status].icon}
                  {APPLICATION_STATUS_CONFIG[selectedApp.status].label}
                </Badge>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Applied On</p>
                <p className="text-sm">
                  {new Date(selectedApp.created_at).toLocaleString("en-US", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </p>
              </div>

              {selectedApp.cover_letter && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Cover Letter</p>
                  <p className="text-sm text-muted-foreground bg-muted/30 rounded-xl p-4 whitespace-pre-wrap">{selectedApp.cover_letter}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  <Paperclip className="h-3.5 w-3.5 inline mr-1" />
                  Uploaded Documents
                </p>
                <div className="space-y-2">
                  <a
                    href={selectedApp.cv_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 text-primary font-semibold text-sm hover:bg-primary/10 transition-colors"
                  >
                    <FileText className="h-5 w-5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{selectedApp.cv_filename || "CV / Resume"}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-primary/60">CV / Resume</p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                  {selectedApp.certificates_url && (
                    <a
                      href={selectedApp.certificates_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-sm hover:bg-emerald-100 transition-colors"
                    >
                      <GraduationCap className="h-5 w-5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{selectedApp.certificates_filename || "Certificates & IDs"}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/60">Academic Certificates & IDs</p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  )}
                  {selectedApp.application_letter_url && (
                    <a
                      href={selectedApp.application_letter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 font-semibold text-sm hover:bg-violet-100 transition-colors"
                    >
                      <FileSignature className="h-5 w-5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{selectedApp.application_letter_filename || "Application Letter"}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600/60">Letter of Application</p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  )}
                </div>
              </div>

              <div className="border-t pt-4 flex flex-wrap gap-2">
                <p className="w-full text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Update Status</p>
                {(["pending", "reviewed", "shortlisted", "rejected"] as const).map((s) => (
                  <Button
                    key={s}
                    variant={selectedApp.status === s ? "default" : "outline"}
                    size="sm"
                    className="rounded-full text-xs capitalize"
                    disabled={loadingId === selectedApp.id || selectedApp.status === s}
                    onClick={() => onStatusChange(selectedApp.id, s)}
                  >
                    {loadingId === selectedApp.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : APPLICATION_STATUS_CONFIG[s].icon}
                    <span className="ml-1">{APPLICATION_STATUS_CONFIG[s].label}</span>
                  </Button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button
                  variant="destructive"
                  className="rounded-xl"
                  disabled={loadingId === selectedApp.id}
                  onClick={() => onDelete(selectedApp.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
