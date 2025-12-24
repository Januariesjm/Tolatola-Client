"use server"

import { createClient } from "@/lib/supabase/server"

export async function getOrCreateConversation(shopId?: string, productId?: string, receiverId?: string, orderId?: string) {
  try {
    const supabase = await createClient()
    console.log("[Messaging] Supabase client initialized")

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("[Messaging] Auth error:", authError)
      return { error: `Authentication failed: ${authError.message}` }
    }

    if (!user) {
      console.log("[Messaging] User not authenticated - session might be expired")
      return { error: "Please log in to chat with the seller" }
    }

    console.log("[Messaging] getOrCreateConversation:", { shopId, productId, receiverId, orderId, userId: user.id })

    // Case 1: Traditional Customer-Shop/Vendor conversation
    if (shopId) {
      console.log("[Messaging] Fetching shop and vendor details for shopId:", shopId)
      // Get shop and its vendor's user_id
      // @ts-ignore
      const { data: shop, error: shopError } = await (supabase as any)
        .from("shops")
        .select("vendor_id, vendors(user_id)")
        .eq("id", shopId)
        .single()

      if (shopError) {
        console.error("[Messaging] Error fetching shop:", shopError)
        return { error: `Could not find shop: ${shopError.message}` }
      }

      const vendorUserId = shop?.vendors?.user_id

      if (!vendorUserId) {
        console.error("[Messaging] Vendor user not found for shop ID:", shopId)
        return { error: "Shop owner not found" }
      }

      console.log("[Messaging] Shop and vendor user found:", vendorUserId)

      // Check if conversation already exists
      const { data: existingConversation } = await (supabase as any)
        .from("conversations")
        .select("*")
        .eq("customer_id", user.id)
        .eq("shop_id", shopId)
        .maybeSingle()

      if (existingConversation) {
        console.log("[Messaging] Found existing shop conversation:", existingConversation.id)
        return { conversation: existingConversation }
      }

      // Create new conversation
      console.log("[Messaging] Creating new shop conversation with vendorUserId:", vendorUserId)
      // @ts-ignore
      const { data: newConversation, error } = await (supabase as any)
        .from("conversations")
        .insert({
          customer_id: user.id,
          vendor_id: vendorUserId,
          shop_id: shopId,
          product_id: productId,
        })
        .select()
        .single()

      if (error) {
        console.error("[Messaging] Error creating shop conversation:", error)
        return { error: `Failed to start conversation: ${error.message}` }
      }

      console.log("[Messaging] Created new shop conversation:", newConversation.id)
      return { conversation: newConversation }
    }

    // Case 2: Transporter-Customer conversation (based on receiverId and orderId)
    if (receiverId) {
      console.log("[Messaging] Handling direct conversation for receiverId:", receiverId)
      // Check if conversation already exists between these two users
      const { data: existingConversation } = await (supabase as any)
        .from("conversations")
        .select("*")
        .or(`and(customer_id.eq.${user.id},vendor_id.eq.${receiverId}),and(customer_id.eq.${receiverId},vendor_id.eq.${user.id})`)
        .is("shop_id", null) // Distinguish from shop chats
        .maybeSingle()

      if (existingConversation) {
        console.log("[Messaging] Found existing direct conversation:", existingConversation.id)
        return { conversation: existingConversation }
      }

      // Create new conversation
      console.log("[Messaging] Creating new direct conversation...")
      // @ts-ignore
      const { data: newConversation, error } = await (supabase as any)
        .from("conversations")
        .insert({
          customer_id: user.id, // Current user (could be transporter)
          vendor_id: receiverId, // Target user (could be customer)
          order_id: orderId,
        })
        .select()
        .single()

      if (error) {
        console.error("[Messaging] Error creating direct conversation:", error)
        return { error: `Failed to create direct conversation: ${error.message}` }
      }

      console.log("[Messaging] Created new direct conversation:", newConversation.id)
      return { conversation: newConversation }
    }

    return { error: "Missing parameters for conversation" }
  } catch (err: any) {
    console.error("[Messaging] Panic in getOrCreateConversation:", err)
    return { error: err.message || "An unexpected error occurred" }
  }
}

export async function sendMessage(conversationId: string, message: string, attachmentUrl?: string, attachmentType?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // @ts-ignore
  const { data, error } = await (supabase as any)
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      message,
      attachment_url: attachmentUrl,
      attachment_type: attachmentType,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { message: data }
}

export async function uploadChatFile(formData: FormData) {
  try {
    const supabase = await createClient()
    const file = formData.get("file") as File
    if (!file) return { error: "No file provided" }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    const { data, error } = await supabase.storage.from("messaging").upload(filePath, file)

    if (error) {
      console.error("[Messaging] Upload error:", error)
      return { error: error.message }
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("messaging").getPublicUrl(filePath)

    return { url: publicUrl, type: file.type }
  } catch (err: any) {
    console.error("[Messaging] Panic in uploadChatFile:", err)
    return { error: err.message || "Upload failed" }
  }
}

export async function getConversationMessages(conversationId: string) {
  const supabase = await createClient()

  // @ts-ignore
  const { data, error } = await (supabase as any)
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

  // @ts-ignore
  const { data, error } = await (supabase as any)
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

  // @ts-ignore
  const { error } = await (supabase as any)
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

  const { data, error } = await (supabase as any)
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
