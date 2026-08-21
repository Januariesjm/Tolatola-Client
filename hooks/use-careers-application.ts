"use client"

import type React from "react"
import { useCallback, useRef, useState } from "react"
import { logger, normalizeError } from "@/lib/logger"
import type { Job } from "@/lib/careers/jobs"

const log = logger.child("careers.application")

/** Documents an application must carry, and the cap on each. */
export const MAX_APPLICATION_FILE_BYTES = 10 * 1024 * 1024

/**
 * Types accepted for an application document. Images are allowed only where the
 * caller opts in (a photographed certificate is fine; a photographed CV is not).
 */
export const APPLICATION_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

/**
 * The careers application form: role selection, the three required documents,
 * client-side validation and submission.
 *
 * Extracted from app/careers/careers-page-client.tsx, which was 758 lines of
 * this plus 170 lines of job data and 410 lines of markup.
 */
export function useCareersApplication() {
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

  const docAllowedTypes = APPLICATION_DOC_TYPES

  const handleFileSelect = useCallback((file: File | undefined, setter: (f: File | null) => void, allowImages = false) => {
    if (!file) return
    if (file.size > MAX_APPLICATION_FILE_BYTES) {
      setFormError("File size must be less than 10MB")
      return
    }
    const allowed: readonly string[] = allowImages ? docAllowedTypes : docAllowedTypes.filter((t) => !t.startsWith("image/"))
    if (!allowed.includes(file.type)) {
      setFormError(allowImages ? "Please upload a PDF, Word document, or image" : "Please upload a PDF or Word document")
      return
    }
    setter(file)
    setFormError("")
  }, [])

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
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api").replace(/\/$/, "")

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
    } catch (err) {
      log.error("career application submission failed", err, { position: selectedJob?.title })
      setFormError(normalizeError(err).message || "Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const scrollToJobs = () => {
    document.getElementById("job-listings")?.scrollIntoView({ behavior: "smooth" })
  }

  return {
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
  }
}

export type CareersApplicationState = ReturnType<typeof useCareersApplication>
