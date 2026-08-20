"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle, Loader2, Trash2, UserPlus } from "lucide-react"
import type { AgentManagementState } from "@/hooks/use-agent-management"

type AgentDialogsProps = Pick<
  AgentManagementState,
  | "isCreateOpen"
  | "setIsCreateOpen"
  | "createForm"
  | "setCreateForm"
  | "isCreating"
  | "handleCreateAgent"
  | "deleteTarget"
  | "setDeleteTarget"
  | "isActionLoading"
  | "handleDeleteAgent"
>

/**
 * The create-agent and delete-agent dialogs for the admin agent tab.
 *
 * Split out of agent-management-tab.tsx to keep that file under the 500-line
 * limit; the markup is unchanged.
 */
export function AgentDialogs({
  isCreateOpen,
  setIsCreateOpen,
  createForm,
  setCreateForm,
  isCreating,
  handleCreateAgent,
  deleteTarget,
  setDeleteTarget,
  isActionLoading,
  handleDeleteAgent,
}: AgentDialogsProps) {
  return (
    <>
      {/* ── Create Agent Dialog ── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-600" />
              Create New Agent
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Fill in the new agent's details. A secure email with an activation link will be sent so the agent can set their own password.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Full Name *</label>
              <Input
                placeholder="e.g. John Mwakasege"
                value={createForm.full_name}
                onChange={(e) => setCreateForm(f => ({ ...f, full_name: e.target.value }))}
                className="rounded-xl text-sm h-10"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Email Address *</label>
              <Input
                type="email"
                placeholder="e.g. john@tolatola.co"
                value={createForm.email}
                onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
                className="rounded-xl text-sm h-10"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Phone Number *</label>
              <Input
                type="tel"
                placeholder="e.g. +255712345678"
                value={createForm.phone}
                onChange={(e) => setCreateForm(f => ({ ...f, phone: e.target.value }))}
                className="rounded-xl text-sm h-10"
              />
            </div>

            {/* Role + Region Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Role</label>
                <select
                  value={createForm.role_name}
                  onChange={(e) => setCreateForm(f => ({ ...f, role_name: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white text-slate-700 outline-none"
                >
                  <option value="Sales Agent">Sales Agent</option>
                  <option value="Regional Supervisor">Regional Supervisor</option>
                  <option value="Sales Manager">Sales Manager</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Region</label>
                <Input
                  placeholder="e.g. Dar es Salaam"
                  value={createForm.region}
                  onChange={(e) => setCreateForm(f => ({ ...f, region: e.target.value }))}
                  className="rounded-xl text-sm h-10"
                />
              </div>
            </div>

            {/* District + Area Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">District</label>
                <Input
                  placeholder="e.g. Ilala"
                  value={createForm.district}
                  onChange={(e) => setCreateForm(f => ({ ...f, district: e.target.value }))}
                  className="rounded-xl text-sm h-10"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Area</label>
                <Input
                  placeholder="e.g. Kariakoo"
                  value={createForm.area}
                  onChange={(e) => setCreateForm(f => ({ ...f, area: e.target.value }))}
                  className="rounded-xl text-sm h-10"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isCreating}
                className="rounded-xl text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAgent}
                disabled={isCreating}
                className="rounded-xl text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                    Create Agent
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-rose-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete Agent Permanently
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              This action cannot be undone. The agent account, all registrations, commissions, and login credentials will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="space-y-4 mt-2">
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-4">
                <p className="text-sm font-bold text-slate-800">{deleteTarget.name}</p>
                <p className="text-xs font-mono text-rose-700 mt-1">{deleteTarget.code}</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isActionLoading === `delete-${deleteTarget.id}`}
                  className="rounded-xl text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteAgent(deleteTarget.id)}
                  disabled={isActionLoading === `delete-${deleteTarget.id}`}
                  className="rounded-xl text-xs h-9"
                >
                  {isActionLoading === `delete-${deleteTarget.id}` ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Delete Permanently
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
