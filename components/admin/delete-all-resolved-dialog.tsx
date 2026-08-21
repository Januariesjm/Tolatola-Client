"use client"

/**
 * Confirmation dialog for permanently deleting every resolved support ticket.
 *
 * Extracted verbatim from components/admin/support-tickets-tab.tsx.
 */

import { Loader2, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export interface DeleteAllResolvedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resolvedCount: number
  deleting: boolean
  onConfirm: () => void
}

export function DeleteAllResolvedDialog({
  open,
  onOpenChange,
  resolvedCount,
  deleting: deletingAllResolved,
  onConfirm: handleDeleteAllResolved,
}: DeleteAllResolvedDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-9 px-3.5 gap-1.5 shadow-sm"
        >
          <Trash2 className="h-4 w-4" />
          Delete All Resolved ({resolvedCount})
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
            <Trash2 className="h-5 w-5" /> Delete All Resolved Tickets?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action will <strong>permanently delete all {resolvedCount} resolved and completed tickets</strong> along with all
            associated chat messages and conversation records.
            <br />
            <br />
            <span className="text-rose-500 font-semibold">This action cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletingAllResolved}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAllResolved}
            disabled={deletingAllResolved}
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
          >
            {deletingAllResolved ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...
              </>
            ) : (
              "Yes, Delete Permanently"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
