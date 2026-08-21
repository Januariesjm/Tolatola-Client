import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { validateRequestBody } from "@/lib/api/validate-request"
import { kycNotificationSchema } from "@/lib/schemas/api"

const log = logger.child("app.api.notifications.transporter-kyc-approved")

export async function POST(request: Request) {
  try {
    const parsed = await validateRequestBody(request, kycNotificationSchema, "notifications.transporter-kyc-approved")
    if (!parsed.ok) return parsed.response

    const { email, fullName } = parsed.data

    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    // For now, log the notification
    console.log("[v0] Transporter KYC Approved Email:", {
      to: email,
      subject: "Your TOLA Transporter Account Has Been Approved!",
      message: `Dear ${fullName},\n\nCongratulations! Your transporter account has been approved. You can now log in to access your transporter dashboard and start accepting delivery assignments.\n\nBest regards,\nTOLA Team`,
    })

    // In production, send actual email:
    // await resend.emails.send({
    //   from: 'noreply@tola.com',
    //   to: email,
    //   subject: 'Your TOLA Transporter Account Has Been Approved!',
    //   html: `<p>Dear ${fullName},</p><p>Congratulations! Your transporter account has been approved...</p>`
    // })

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error("error sending approval email", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
