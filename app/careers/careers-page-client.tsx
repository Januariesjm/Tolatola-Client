"use client"

import { useState, useRef, useCallback } from "react"
import SiteHeader from "@/components/layout/site-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

interface Job {
  title: string
  type: string
  mode: string
  location: string
  desc: string
  dept: string
}

const jobs: Job[] = [
  {
    title: "Senior Software Engineer",
    type: "FULL-TIME",
    mode: "HYBRID",
    location: "Dar es Salaam",
    desc: "Help build and scale our digital trade and logistics platform.",
    dept: "Engineering",
  },
  {
    title: "Mobile App Developer (Android / iOS)",
    type: "FULL-TIME",
    mode: "HYBRID",
    location: "Dar es Salaam",
    desc: "Develop and maintain high-performance mobile applications.",
    dept: "Engineering",
  },
  {
    title: "UI/UX Designer",
    type: "FULL-TIME",
    mode: "HYBRID",
    location: "Dar es Salaam",
    desc: "Design intuitive and user-friendly digital experiences.",
    dept: "Design",
  },
  {
    title: "QA / Software Tester",
    type: "FULL-TIME",
    mode: "ON-SITE",
    location: "Dar es Salaam",
    desc: "Ensure system quality through testing and performance checks.",
    dept: "Engineering",
  },
  {
    title: "Brand Marketing Lead",
    type: "FULL-TIME",
    mode: "ON-SITE",
    location: "Dar es Salaam",
    desc: "Drive brand growth and digital marketing strategies.",
    dept: "Marketing",
  },
  {
    title: "Sales Executive",
    type: "FULL-TIME",
    mode: "ON-SITE",
    location: "Dar es Salaam",
    desc: "Acquire customers and grow platform usage.",
    dept: "Sales",
  },
  {
    title: "Business Development Officer",
    type: "FULL-TIME",
    mode: "ON-SITE",
    location: "Dar es Salaam",
    desc: "Build partnerships and expand business opportunities.",
    dept: "Business",
  },
  {
    title: "Customer Success Manager",
    type: "FULL-TIME",
    mode: "ON-SITE",
    location: "Dar es Salaam",
    desc: "Manage customer relationships and improve retention.",
    dept: "Operations",
  },
  {
    title: "Customer Support Officer",
    type: "FULL-TIME",
    mode: "ON-SITE",
    location: "Dar es Salaam",
    desc: "Handle user support and resolve issues efficiently.",
    dept: "Operations",
  },
  {
    title: "Operations Officer",
    type: "FULL-TIME",
    mode: "ON-SITE",
    location: "Dar es Salaam",
    desc: "Coordinate daily logistics and platform operations.",
    dept: "Operations",
  },
  {
    title: "Logistics Coordinator",
    type: "FULL-TIME",
    mode: "ON-SITE",
    location: "Dar es Salaam",
    desc: "Manage deliveries, fleet, and supply chain flow.",
    dept: "Logistics",
  },
  {
    title: "Data Analyst",
    type: "FULL-TIME",
    mode: "HYBRID",
    location: "Dar es Salaam",
    desc: "Analyze data to support business decisions.",
    dept: "Data",
  },
  {
    title: "Finance & Admin Officer",
    type: "FULL-TIME",
    mode: "ON-SITE",
    location: "Dar es Salaam",
    desc: "Handle financial records and administrative tasks.",
    dept: "Finance",
  },
  {
    title: "HR Officer",
    type: "FULL-TIME",
    mode: "ON-SITE",
    location: "Dar es Salaam",
    desc: "Manage recruitment and employee relations.",
    dept: "Human Resources",
  },
  {
    title: "Compliance Officer",
    type: "FULL-TIME",
    mode: "ON-SITE",
    location: "Dar es Salaam",
    desc: "Ensure regulatory and legal compliance.",
    dept: "Legal",
  },
  {
    title: "Internship Program",
    type: "INTERNSHIP",
    mode: "ON-SITE",
    location: "Dar es Salaam",
    desc: "Opportunities for students and fresh graduates.",
    dept: "Various",
  },
  {
    title: "Open Talent Pool (Always Hiring)",
    type: "OPEN",
    mode: "FLEXIBLE",
    location: "Dar es Salaam",
    desc: "Apply anytime—Engineering, Sales, Operations, or Support.",
    dept: "Various",
  },
]

// Department color mapping
const deptColors: Record<string, string> = {
  Engineering: "bg-blue-50 text-blue-700 border-blue-200",
  Design: "bg-violet-50 text-violet-700 border-violet-200",
  Marketing: "bg-pink-50 text-pink-700 border-pink-200",
  Sales: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Business: "bg-amber-50 text-amber-700 border-amber-200",
  Operations: "bg-slate-50 text-slate-700 border-slate-200",
  Logistics: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Data: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Finance: "bg-green-50 text-green-700 border-green-200",
  "Human Resources": "bg-rose-50 text-rose-700 border-rose-200",
  Legal: "bg-orange-50 text-orange-700 border-orange-200",
  Various: "bg-purple-50 text-purple-700 border-purple-200",
}

const modeIcons: Record<string, string> = {
  HYBRID: "🏠",
  "ON-SITE": "🏢",
  FLEXIBLE: "🌍",
}

export default function CareersPageClient({
  user,
  profile,
  kycStatus,
}: {
  user: any
  profile: any
  kycStatus: any
}) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [certificatesFile, setCertificatesFile] = useState<File | null>(null)
  const [applicationLetterFile, setApplicationLetterFile] = useState<File | null>(null)
  const [formError, setFormError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const certificatesInputRef = useRef<HTMLInputElement>(null)
  const applicationLetterInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    cover_letter: "",
  })

  const handleApply = (job: Job) => {
    setSelectedJob(job)
    setIsDialogOpen(true)
    setIsSuccess(false)
    setFormError("")
    setCvFile(null)
    setCertificatesFile(null)
    setApplicationLetterFile(null)
    setFormData({ full_name: "", email: "", phone: "", cover_letter: "" })
  }

  const docAllowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/webp",
  ]

  const handleFileSelect = useCallback(
    (file: File | undefined, setter: (f: File | null) => void, allowImages = false) => {
      if (!file) return
      if (file.size > 10 * 1024 * 1024) {
        setFormError("File size must be less than 10MB")
        return
      }
      const allowed = allowImages
        ? docAllowedTypes
        : docAllowedTypes.filter((t) => !t.startsWith("image/"))
      if (!allowed.includes(file.type)) {
        setFormError(allowImages ? "Please upload a PDF, Word document, or image" : "Please upload a PDF or Word document")
        return
      }
      setter(file)
      setFormError("")
    },
    [],
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0], setCvFile)
  }

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedJob || !cvFile) {
      setFormError("Please upload your CV")
      return
    }
    if (!certificatesFile) {
      setFormError("Please upload your Academic Certificates & IDs")
      return
    }
    if (!applicationLetterFile) {
      setFormError("Please upload your Letter of Application")
      return
    }
    if (!formData.full_name.trim() || !formData.email.trim()) {
      setFormError("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    setFormError("")

    try {
      const baseUrl = (
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"
      ).replace(/\/$/, "")

      // Helper to upload a file
      const uploadFile = async (file: File, endpoint: string) => {
        const b64 = await fileToBase64(file)
        const res = await fetch(`${baseUrl}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, data: b64, contentType: file.type }),
        })
        if (!res.ok) throw new Error(`Failed to upload ${file.name}`)
        return res.json()
      }

      // Upload all documents
      const [cvData, certsData, letterData] = await Promise.all([
        uploadFile(cvFile, "/uploads/careers"),
        uploadFile(certificatesFile, "/uploads/career-documents"),
        uploadFile(applicationLetterFile, "/uploads/career-documents"),
      ])

      // Submit application
      const appRes = await fetch(`${baseUrl}/career-applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          position: selectedJob.title,
          cover_letter: formData.cover_letter.trim() || undefined,
          cv_url: cvData.url,
          cv_filename: cvFile.name,
          certificates_url: certsData.url,
          certificates_filename: certificatesFile.name,
          application_letter_url: letterData.url,
          application_letter_filename: applicationLetterFile.name,
        }),
      })

      if (!appRes.ok) {
        const err = await appRes.json().catch(() => ({}))
        throw new Error(err.error || "Failed to submit application")
      }

      setIsSuccess(true)
    } catch (err: any) {
      setFormError(err.message || "Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const scrollToJobs = () => {
    document
      .getElementById("job-listings")
      ?.scrollIntoView({ behavior: "smooth" })
  }

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
              <span className="text-xs font-bold uppercase tracking-widest">
                We&apos;re Growing Fast
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
              Careers at{" "}
              <span className="text-primary italic">TOLA</span>
            </h1>
            <p className="text-stone-400 text-xl max-w-2xl mx-auto leading-relaxed">
              We&apos;re building the infrastructure of East African commerce.
              Join our mission to empower local entrepreneurs.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                className="rounded-full px-8 h-12 font-bold group"
                onClick={scrollToJobs}
              >
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
                <div className="inline-flex p-3 rounded-2xl bg-primary/5 text-primary">
                  {perk.icon}
                </div>
                <h3 className="text-xl font-bold tracking-tight">
                  {perk.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {perk.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Job Listings */}
        <section id="job-listings" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
              <div>
                <h2 className="text-4xl font-bold tracking-tighter mb-4">
                  Open Positions
                </h2>
                <p className="text-muted-foreground text-lg">
                  Help us shape the future of African e-commerce.{" "}
                  <span className="font-semibold text-primary">
                    {jobs.length} roles
                  </span>{" "}
                  available.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {jobs.map((job, i) => (
                <div
                  key={i}
                  className="group p-6 md:p-8 rounded-2xl bg-white border shadow-sm hover:shadow-xl transition-all duration-300 hover:border-primary/30 flex flex-col md:flex-row items-start md:items-center gap-6"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-wider ${
                          deptColors[job.dept] ||
                          "bg-muted text-muted-foreground"
                        }`}
                      >
                        {job.dept}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-muted text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        {job.type}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-muted text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        {modeIcons[job.mode] || ""} {job.mode}
                      </span>
                    </div>
                    <h3 className="text-xl font-black mb-1.5 group-hover:text-primary transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium mb-2">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {job.desc}
                    </p>
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
              <h3 className="text-3xl font-black mb-4">
                Don&apos;t see the right role?
              </h3>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
                We&apos;re always on the lookout for exceptional talent. If
                you&apos;re passionate about Digital trade and Supply Chain
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
              <h3 className="text-2xl font-black">
                Application Submitted!
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Thank you for applying for{" "}
                <span className="font-semibold text-foreground">
                  {selectedJob?.title}
                </span>
                . We&apos;ll review your application and get back to you
                soon.
              </p>
              <Button
                variant="outline"
                className="mt-4 rounded-full"
                onClick={() => setIsDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-black">
                  Apply for {selectedJob?.title}
                </DialogTitle>
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
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cover_letter" className="font-semibold">
                    Cover Letter{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
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
                      cvFile
                        ? "border-primary/40 bg-primary/5"
                        : "border-muted-foreground/20 hover:border-primary/30 hover:bg-muted/30"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {cvFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div className="text-left">
                          <p className="font-semibold text-sm">
                            {cvFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(cvFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            setCvFile(null)
                            if (fileInputRef.current)
                              fileInputRef.current.value = ""
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-medium">
                          Click to upload your CV
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF or Word document (max 10MB)
                        </p>
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
                          <p className="text-xs text-muted-foreground">
                            {(certificatesFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
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
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, Word document, or image (max 10MB)
                        </p>
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
                          <p className="text-xs text-muted-foreground">
                            {(applicationLetterFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
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
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF or Word document (max 10MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {formError && (
                  <div className="text-destructive text-sm font-medium bg-destructive/10 px-4 py-2.5 rounded-xl">
                    {formError}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl font-bold text-base"
                >
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
