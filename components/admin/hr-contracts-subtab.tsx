"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileSignature, Plus, Search, Trash2, Loader2, Download, CheckCircle2, Clock } from "lucide-react"
import { clientApiPost, clientApiDelete } from "@/lib/api-client"
import { createClient } from "@/lib/supabase/client"

interface HRContract {
  id: string
  staff_id: string
  contract_type: string
  start_date: string
  end_date?: string
  salary?: number
  document_url?: string
  hr_staff_records?: { full_name: string; employee_id: string }
}

export function HRContractsSubtab({ contracts: initialContracts, staff }: { contracts: HRContract[], staff: any[] }) {
  const [contracts, setContracts] = useState<HRContract[]>(initialContracts)
  const [search, setSearch] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    staff_id: "",
    contract_type: "full-time",
    start_date: "",
    end_date: "",
    salary: "",
  })

  const filtered = contracts.filter((c) =>
    !search ||
    c.hr_staff_records?.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.contract_type.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      let documentUrl = null
      
      // Upload document if provided
      if (file) {
        const supabase = createClient()
        const fileExt = file.name.split('.').pop()
        const fileName = `contracts/${formData.staff_id}-${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from("uploads")
          .upload(fileName, file)
          
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(fileName)
          documentUrl = urlData.publicUrl
        } else {
          console.error("File upload error:", uploadError)
        }
      }
      
      const payload = {
        ...formData,
        end_date: formData.end_date || null,
        salary: formData.salary ? Number(formData.salary) : null,
        document_url: documentUrl,
      }
      
      const res = await clientApiPost("admin/hr/contracts", payload)
      if (res.data) {
        // Find staff details to attach to state
        const staffObj = staff.find(s => s.id === formData.staff_id)
        const newContract = { ...res.data, hr_staff_records: staffObj }
        setContracts([newContract, ...contracts])
        setIsAddOpen(false)
        setFile(null)
        setFormData({
          staff_id: "",
          contract_type: "full-time",
          start_date: "",
          end_date: "",
          salary: "",
        })
      }
    } catch (err) {
      console.error("Failed to add contract:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contract record?")) return
    try {
      await clientApiDelete(`admin/hr/contracts/${id}`)
      setContracts(contracts.filter((c) => c.id !== id))
    } catch (err) {
      console.error("Failed to delete:", err)
    }
  }

  // Active status logic: currently active if start date is in past and end date is in future (or no end date)
  const getContractStatus = (contract: HRContract) => {
    const now = new Date()
    const start = new Date(contract.start_date)
    const end = contract.end_date ? new Date(contract.end_date) : null
    
    if (start > now) return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><Clock className="h-3 w-3 mr-1"/> Pending Start</Badge>
    if (end && end < now) return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Expired</Badge>
    return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1"/> Active</Badge>
  }

  return (
    <Card className="shadow-sm rounded-xl">
      <CardHeader className="pb-3 flex flex-row items-center justify-between border-b bg-slate-50/50">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <FileSignature className="h-5 w-5 text-primary" />
          Contracts & Agreements
        </CardTitle>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Upload Contract
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Contract</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Employee</Label>
                <Select required value={formData.staff_id} onValueChange={(val) => setFormData({...formData, staff_id: val})}>
                  <SelectTrigger><SelectValue placeholder="Select staff member"/></SelectTrigger>
                  <SelectContent>
                    {staff.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.employee_id})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contract Type</Label>
                  <Select value={formData.contract_type} onValueChange={(val) => setFormData({...formData, contract_type: val})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-Time</SelectItem>
                      <SelectItem value="part-time">Part-Time</SelectItem>
                      <SelectItem value="contractor">Contractor</SelectItem>
                      <SelectItem value="intern">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Salary/Compensation</Label>
                  <Input type="number" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} placeholder="Amount in TZS" />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" required value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <Input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Signed Contract Document (PDF/Image)</Label>
                <Input type="file" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
              
              <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Contract
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by staff name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl bg-slate-50 border-slate-200"
            />
          </div>
        </div>
        
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No contracts found.
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Contract Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Document / Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(contract => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">
                    {contract.hr_staff_records?.full_name || "Unknown"}
                  </TableCell>
                  <TableCell className="capitalize">{contract.contract_type.replace("-", " ")}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(contract.start_date).toLocaleDateString()}</div>
                      <div className="text-muted-foreground text-xs">to {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : "Indefinite"}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {contract.salary ? `TZS ${Number(contract.salary).toLocaleString()}` : "-"}
                  </TableCell>
                  <TableCell>
                    {getContractStatus(contract)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {contract.document_url && (
                        <Button variant="outline" size="sm" className="h-8" onClick={() => window.open(contract.document_url, "_blank")}>
                          <Download className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(contract.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
