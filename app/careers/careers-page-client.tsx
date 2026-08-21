"use client"

import { useState, useRef, useCallback } from "react"
import SiteHeader from "@/components/layout/site-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Briefcase,
  Users,
  TrendingUp,
  Heart,
  Sparkles,
  MapPin,
  ArrowRight,
  Zap,
  Mail,
  Upload,
  CheckCircle2,
  Loader2,
  FileText,
  Clock,
  Building2,
  X,
} from "lucide-react"
import { JOBS, departmentColor, workModeIcon, type Job } from "@/lib/careers/jobs"
import { useCareersApplication } from "@/hooks/use-careers-application"

/** The signed-in viewer, as the careers server component passes it down. */
interface CareersViewer {
  id: string
  email?: string | null
}

/** The viewer's profile row, only used to prefill the form. */
interface CareersProfile {
  full_name?: string | null
  phone?: string | null
}

export default function CareersPageClient({
  user,
  profile,
  kycStatus,
}: {
  user: CareersViewer | null
  profile: CareersProfile | null
  kycStatus: string | null
}) {
  const {
    selectedJob,
    isDialogOpen,
    setIsDialogOpen,
    isSubmitting,
    isSuccess,
    cvFile,
    setCvFile,
    certificatesFile,
    setCertificatesFile,
    applicationLetterFile,
    setApplicationLetterFile,
    formError,
    formData,
    setFormData,
    fileInputRef,
    certificatesInputRef,
    applicationLetterInputRef,
    handleApply,
    handleFileSelect,
    handleFileChange,
    handleSubmit,
    scrollToJobs,
  } = useCareersApplication()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />

      <main className="flex-1">
        {/* Animated Hero Section */}
        <section className="relative h-[500px] flex items-center justify-center overflow-hidden bg-stone-950">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-widest">We&apos;re Growing Fast</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
              Careers at <span className="text-primary italic">TOLA</span>
            </h1>
            <p className="text-stone-400 text-xl max-w-2xl mx-auto leading-relaxed">
              We&apos;re building the infrastructure of East African commerce. Join our mission to empower local entrepreneurs.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button size="lg" className="rounded-full px-8 h-12 font-bold group" onClick={scrollToJobs}>
                View Openings
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8 h-12 font-bold text-white border-white/20 bg-white/5 backdrop-blur-md hover:bg-white/10"
              >
                Our Culture
              </Button>
            </div>
          </div>
        </section>

        {/* Perks Section */}
        <section className="py-24 container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: <TrendingUp />,
                title: "Hyper Growth",
                desc: "Plentiful paths for career advancement.",
              },
              {
                icon: <Users />,
                title: "True Diversity",
                desc: "Collaborate with top talent globally.",
              },
              {
                icon: <Heart />,
                title: "Mission Driven",
                desc: "Impact thousands of local businesses.",
              },
              {
                icon: <Zap />,
                title: "Modern Tech",
                desc: "Ship fast with the latest technologies.",
              },
            ].map((perk, i) => (
              <div key={i} className="space-y-4 text-center md:text-left">
                <div className="inline-flex p-3 rounded-2xl bg-primary/5 text-primary">{perk.icon}</div>
                <h3 className="text-xl font-bold tracking-tight">{perk.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{perk.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Job Listings */}
        <section id="job-listings" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
              <div>
                <h2 className="text-4xl font-bold tracking-tighter mb-4">Open Positions</h2>
                <p className="text-muted-foreground text-lg">
                  Help us shape the future of African e-commerce. <span className="font-semibold text-primary">{JOBS.length} roles</span>{" "}
                  available.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {JOBS.map((job, i) => (
                <div
                  key={i}
                  className="group p-6 md:p-8 rounded-2xl bg-white border shadow-sm hover:shadow-xl transition-all duration-300 hover:border-primary/30 flex flex-col md:flex-row items-start md:items-center gap-6"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-wider ${departmentColor(
                          job.dept,
                        )}`}
                      >
                        {job.dept}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-muted text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        {job.type}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-muted text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        {workModeIcon(job.mode)} {job.mode}
                      </span>
                    </div>
                    <h3 className="text-xl font-black mb-1.5 group-hover:text-primary transition-colors">{job.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium mb-2">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{job.desc}</p>
                  </div>
                  <Button
                    className="rounded-full px-8 py-5 font-black h-auto group-hover:scale-105 transition-transform shrink-0"
                    onClick={() => handleApply(job)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Apply
                  </Button>
                </div>
              ))}
            </div>

            {/* General Inquiry */}
            <div className="mt-20 p-12 rounded-[3rem] bg-primary text-primary-foreground text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-3xl font-black mb-4">Don&apos;t see the right role?</h3>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
                We&apos;re always on the lookout for exceptional talent. If you&apos;re passionate about Digital trade and Supply Chain
                Ecosystems, send us your resume.
              </p>
              <a
                href="mailto:careers@tolatola.co"
                className="inline-flex h-14 items-center gap-3 px-10 bg-white text-primary rounded-2xl font-black shadow-xl hover:scale-105 transition-all"
              >
                <Mail className="h-5 w-5" />
                careers@tolatola.co
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Application Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {isSuccess ? (
            <div className="py-12 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black">Application Submitted!</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Thank you for applying for <span className="font-semibold text-foreground">{selectedJob?.title}</span>. We&apos;ll review
                your application and get back to you soon.
              </p>
              <Button variant="outline" className="mt-4 rounded-full" onClick={() => setIsDialogOpen(false)}>
                Close
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-black">Apply for {selectedJob?.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {selectedJob?.type}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {selectedJob?.mode}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {selectedJob?.location}
                  </span>
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="font-semibold">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="font-semibold">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-semibold">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+255 xxx xxx xxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cover_letter" className="font-semibold">
                    Cover Letter <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="cover_letter"
                    placeholder="Tell us why you'd be a great fit..."
                    rows={4}
                    value={formData.cover_letter}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cover_letter: e.target.value,
                      })
                    }
                    className="rounded-xl resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold">
                    Upload CV <span className="text-destructive">*</span>
                  </Label>
                  <div
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      cvFile ? "border-primary/40 bg-primary/5" : "border-muted-foreground/20 hover:border-primary/30 hover:bg-muted/30"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
                    {cvFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div className="text-left">
                          <p className="font-semibold text-sm">{cvFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(cvFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            setCvFile(null)
                            if (fileInputRef.current) fileInputRef.current.value = ""
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-medium">Click to upload your CV</p>
                        <p className="text-xs text-muted-foreground mt-1">PDF or Word document (max 10MB)</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold">
                    Academic Certificates &amp; IDs <span className="text-destructive">*</span>
                  </Label>
                  <div
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      certificatesFile
                        ? "border-primary/40 bg-primary/5"
                        : "border-muted-foreground/20 hover:border-primary/30 hover:bg-muted/30"
                    }`}
                    onClick={() => certificatesInputRef.current?.click()}
                  >
                    <input
                      ref={certificatesInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => handleFileSelect(e.target.files?.[0], setCertificatesFile, true)}
                      className="hidden"
                    />
                    {certificatesFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div className="text-left">
                          <p className="font-semibold text-sm">{certificatesFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(certificatesFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            setCertificatesFile(null)
                            if (certificatesInputRef.current) certificatesInputRef.current.value = ""
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-medium">Click to upload Certificates &amp; IDs</p>
                        <p className="text-xs text-muted-foreground mt-1">PDF, Word document, or image (max 10MB)</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold">
                    Letter of Application <span className="text-destructive">*</span>
                  </Label>
                  <div
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      applicationLetterFile
                        ? "border-primary/40 bg-primary/5"
                        : "border-muted-foreground/20 hover:border-primary/30 hover:bg-muted/30"
                    }`}
                    onClick={() => applicationLetterInputRef.current?.click()}
                  >
                    <input
                      ref={applicationLetterInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileSelect(e.target.files?.[0], setApplicationLetterFile)}
                      className="hidden"
                    />
                    {applicationLetterFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div className="text-left">
                          <p className="font-semibold text-sm">{applicationLetterFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(applicationLetterFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            setApplicationLetterFile(null)
                            if (applicationLetterInputRef.current) applicationLetterInputRef.current.value = ""
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-medium">Click to upload Letter of Application</p>
                        <p className="text-xs text-muted-foreground mt-1">PDF or Word document (max 10MB)</p>
                      </>
                    )}
                  </div>
                </div>

                {formError && (
                  <div className="text-destructive text-sm font-medium bg-destructive/10 px-4 py-2.5 rounded-xl">{formError}</div>
                )}

                <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl font-bold text-base">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Application
                    </>
                  )}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
