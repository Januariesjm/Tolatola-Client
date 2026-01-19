import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { createNotification } from "@/lib/notifications"

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const { transporterId } = await request.json()
        const orderId = params.id

        if (!transporterId) {
            return NextResponse.json({ error: "Transporter ID is required" }, { status: 400 })
        }

        // 1. Verify access (Admin only generally, or maybe a vendor assigning local helper)
        // For now, assuming authenticated user check is enough, ideally check role
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // 2. Update Order
        const { error: updateError } = await supabase
            .from("orders")
            .update({
                transporter_id: transporterId,
                transporter_status: "assigned",
                updated_at: new Date().toISOString()
            })
            .eq("id", orderId)

        if (updateError) {
            console.error("Error assigning transporter:", updateError)
            return NextResponse.json({ error: "Failed to assign transporter" }, { status: 500 })
        }

        // 3. Notify Transporter (Severally as requested)

        // Notification 1: Standard
        await createNotification({
            userId: transporterId,
            type: "order_assigned",
            title: "New Delivery Assigned \uD83D\uDE9A",
            message: `You have been assigned order #${orderId.slice(0, 8)}. Please review the details.`,
            data: { orderId, status: "assigned" }
        })

        // Notification 2: Urgent Follow-up (Simulating "severally" / multiple channels attention)
        // In a real app this might be SMS/Email. Here we add another high-vis notification.
        await createNotification({
            userId: transporterId,
            type: "order_assigned",
            title: "ACTION REQUIRED: Acknowledge Assignment",
            message: `Order #${orderId.slice(0, 8)} requires immediate pickup. Confirm availability now.`,
            data: { orderId, urgent: true }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Assignment error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
