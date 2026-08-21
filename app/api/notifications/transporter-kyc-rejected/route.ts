import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { validateRequestBody } from "@/lib/api/validate-request"
import { kycNotificationSchema } from "@/lib/schemas/api"

const log = logger.child("app.api.notifications.transporter-kyc-rejected")

export async function POST(request: Request) {
  try {
    const parsed = await validateRequestBody(request, kycNotificationSchema, "notifications.transporter-kyc-rejected")
    if (!parsed.ok) return parsed.response

    const { email, fullName, reason } = parsed.data

    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    // For now, log the notification
    console.log("[v0] Transporter KYC Rejected Email:", {
      to: email,
      subject: "TOLA Transporter Application Update",
      message: `Dear ${fullName},\n\nUnfortunately, your transporter application has been rejected for the following reason:\n\n${reason}\n\nYou can reapply by updating your information and submitting a new application.\n\nBest regards,\nTOLA Team`,
    })

    // In production, send actual email:
    // await resend.emails.send({
    //   from: 'noreply@tola.com',
    //   to: email,
    //   subject: 'TOLA Transporter Application Update',
    //   html: `<p>Dear ${fullName},</p><p>Unfortunately, your transporter application has been rejected...</p>`
    // })

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error("error sending rejection email", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
