"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Briefcase, Users, CalendarDays, FileSignature, ClipboardCheck } from "lucide-react"

import { HRApplicationsSubtab } from "./hr-applications-subtab"
import { HRInterviewsSubtab } from "./hr-interviews-subtab"
import { HRStaffSubtab } from "./hr-staff-subtab"
import { HRContractsSubtab } from "./hr-contracts-subtab"
import { HRAttendanceSubtab } from "./hr-attendance-subtab"

export function HRApplicationsTab({
  applications,
  interviews,
  staff,
  contracts,
  attendance,
}: {
  applications: any[]
  interviews: any[]
  staff: any[]
  contracts: any[]
  attendance: any[]
}) {
  const [activeTab, setActiveTab] = useState("applications")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Human Resources</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage staff, candidates, and company records.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="bg-slate-100/80 p-1 w-max sm:w-full justify-start h-auto rounded-xl">
            <TabsTrigger 
              value="applications" 
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm py-2.5 px-4"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Career Applications
            </TabsTrigger>
            <TabsTrigger 
              value="interviews" 
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm py-2.5 px-4"
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Interviews
            </TabsTrigger>
            <TabsTrigger 
              value="staff" 
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm py-2.5 px-4"
            >
              <Users className="h-4 w-4 mr-2" />
              Staff Records
            </TabsTrigger>
            <TabsTrigger 
              value="contracts" 
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm py-2.5 px-4"
            >
              <FileSignature className="h-4 w-4 mr-2" />
              Contracts
            </TabsTrigger>
            <TabsTrigger 
              value="attendance" 
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm py-2.5 px-4"
            >
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Attendance
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-6">
          <TabsContent value="applications" className="m-0 border-none outline-none">
            <HRApplicationsSubtab applications={applications} />
          </TabsContent>
          <TabsContent value="interviews" className="m-0 border-none outline-none">
            <HRInterviewsSubtab interviews={interviews} />
          </TabsContent>
          <TabsContent value="staff" className="m-0 border-none outline-none">
            <HRStaffSubtab staff={staff} />
          </TabsContent>
          <TabsContent value="contracts" className="m-0 border-none outline-none">
            <HRContractsSubtab contracts={contracts} staff={staff} />
          </TabsContent>
          <TabsContent value="attendance" className="m-0 border-none outline-none">
            <HRAttendanceSubtab attendance={attendance} staff={staff} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
