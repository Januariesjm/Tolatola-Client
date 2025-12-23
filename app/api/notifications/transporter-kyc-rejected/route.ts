import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, fullName, reason } = await request.json()

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
    console.error("[v0] Error sending rejection email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
