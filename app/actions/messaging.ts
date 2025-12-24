"use server"

import { createClient } from "@/lib/supabase/server"

export async function getOrCreateConversation(shopId?: string, productId?: string, receiverId?: string, orderId?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Case 1: Traditional Customer-Shop/Vendor conversation
  if (shopId) {
    // Get shop vendor_id
    const { data: shop } = await supabase.from("shops").select("vendor_id").eq("id", shopId).single()

    if (!shop) {
      return { error: "Shop not found" }
    }

    // Check if conversation already exists
    const { data: existingConversation } = await supabase
      .from("conversations")
      .select("*")
      .eq("customer_id", user.id)
      .eq("shop_id", shopId)
      .maybeSingle()

    if (existingConversation) {
      return { conversation: existingConversation }
    }

    // Create new conversation
    const { data: newConversation, error } = await supabase
      .from("conversations")
      .insert({
        customer_id: user.id,
        vendor_id: shop.vendor_id,
        shop_id: shopId,
        product_id: productId,
      })
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    return { conversation: newConversation }
  }

  // Case 2: Transporter-Customer conversation (based on receiverId and orderId)
  if (receiverId) {
    // Check if conversation already exists between these two users
    const { data: existingConversation } = await supabase
      .from("conversations")
      .select("*")
      .or(`and(customer_id.eq.${user.id},vendor_id.eq.${receiverId}),and(customer_id.eq.${receiverId},vendor_id.eq.${user.id})`)
      .is("shop_id", null) // Distinguish from shop chats
      .maybeSingle()

    if (existingConversation) {
      return { conversation: existingConversation }
    }

    // Create new conversation
    // Note: We use customer_id and vendor_id fields as generic participant fields for now
    // as the schema seems to be built around them. In a real scenario, we might want
    // a more generic participants table.
    const { data: newConversation, error } = await supabase
      .from("conversations")
      .insert({
        customer_id: user.id, // Current user (could be transporter)
        vendor_id: receiverId, // Target user (could be customer)
        order_id: orderId,
      })
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    return { conversation: newConversation }
  }

  return { error: "Missing parameters for conversation" }
}
}

export async function sendMessage(conversationId: string, message: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      message,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { message: data }
}

export async function getConversationMessages(conversationId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("messages")
    .select(`
      *,
      sender:users!messages_sender_id_fkey(id, full_name, profile_image_url)
    `)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (error) {
    return { error: error.message }
  }

  return { messages: data }
}

export async function getUserConversations() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("conversations")
    .select(`
      *,
      customer:users!conversations_customer_id_fkey(id, full_name, profile_image_url),
      vendor:users!conversations_vendor_id_fkey(id, full_name, profile_image_url),
      shop:shops(id, name, logo_url, phone)
    `)
    .or(`customer_id.eq.${user.id},vendor_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { conversations: data }
}

export async function markMessagesAsRead(conversationId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .eq("is_read", false)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function logCall(
  conversationId: string,
  receiverId: string,
  callType: "voice" | "video",
  status: "completed" | "missed" | "rejected" | "failed",
  duration?: number,
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("call_logs")
    .insert({
      conversation_id: conversationId,
      caller_id: user.id,
      receiver_id: receiverId,
      call_type: callType,
      status,
      duration,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { callLog: data }
}
