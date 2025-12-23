"use server"

import { createClient } from "@/lib/supabase/server"

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
    console.error("[v0] Error logging failed registration:", error)
  }
}
