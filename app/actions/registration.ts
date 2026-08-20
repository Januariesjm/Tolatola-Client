"use server"

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"

const log = logger.child("app.actions.registration")

export async function logFailedRegistration(data: {
  email: string
  fullName?: string
  userType?: string
  phone?: string
  errorMessage: string
  registrationStep: string
}) {
  const supabase = await createClient()

  const { error } = await supabase.from("failed_registrations").insert({
    email: data.email,
    full_name: data.fullName,
    user_type: data.userType,
    phone: data.phone,
    error_message: data.errorMessage,
    registration_step: data.registrationStep,
  })

  if (error) {
    log.error("error logging failed registration", error)
  }
}
