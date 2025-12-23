// <NEW FILE> Admin system verification endpoint
import { verifyAdminSetup, getAdminStatistics } from "@/lib/admin/initialization"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("Admin verification endpoint called")

    const setupStatus = await verifyAdminSetup()
    const statistics = await getAdminStatistics()

    return NextResponse.json({
      setup: setupStatus,
      statistics,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Error in verify endpoint:", error)
    return NextResponse.json(
      { error: "Failed to verify admin setup", details: String(error) },
      { status: 500 }
    )
  }
}
