import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { createNotification } from "@/lib/notifications"

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            items,
            shippingAddress,
            totalAmount,
            paymentMethod,
            paymentDetails,
            transportMethodId,
            deliveryFee,
        } = await request.json()

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // 1. Create Order
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                customer_id: user.id,
                subtotal: totalAmount - deliveryFee,
                delivery_fee: deliveryFee,
                total_amount: totalAmount,
                payment_method: paymentMethod,
                payment_status: paymentMethod === 'cash-on-delivery' ? 'pending' : 'pending', // Will be updated by webhook for others
                status: "pending",
                shipping_address: shippingAddress,
                transport_method_id: transportMethodId,
                transporter_status: "unassigned" // Initialize as unassigned
            })
            .select()
            .single()

        if (orderError) {
            console.error("Error creating order:", orderError)
            return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
        }

        // 2. Create Order Items
        const orderItems = items.map((item: any) => ({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            shop_id: item.shop_id,
            delivery_fee: item.delivery_fee,
            delivery_distance_km: item.delivery_distance_km,
            pickup_latitude: item.pickup_latitude,
            pickup_longitude: item.pickup_longitude,
        }))

        const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

        if (itemsError) {
            console.error("Error creating order items:", itemsError)
            // Ideally we should rollback here, but Supabase doesn't support transactions via client easily
            return NextResponse.json({ error: "Failed to create order items" }, { status: 500 })
        }

        // 3. Notify Vendors
        // Get unique shop/vendor IDs from items
        // We need to fetch the vendor_id (user_id) given the shop_id
        // Assuming 'shops' table has 'owner_id' or similar. 
        // Let's first get the shop owner IDs

        // Group items by shop_id to send one notification per shop
        const shopIds = [...new Set(items.map((item: any) => item.shop_id))]

        for (const shopId of shopIds) {
            const { data: shop } = await supabase
                .from('shops')
                .select('owner_id, name')
                .eq('id', shopId)
                .single()

            if (shop && shop.owner_id) {
                // Create notification for the vendor
                await createNotification({
                    userId: shop.owner_id,
                    type: "order_placed",
                    title: "New Order Received! \uD83C\uDF89",
                    message: `You have a new order #${order.order_number || order.id.slice(0, 8)} for ${shop.name}.`,
                    data: {
                        orderId: order.id,
                        shopId: shopId,
                        customerName: shippingAddress.full_name
                    }
                })
            }
        }

        return NextResponse.json({ order, success: true })
    } catch (error: any) {
        console.error("Order creation error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
