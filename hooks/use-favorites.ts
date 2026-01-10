"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function useFavorites() {
    const [favorites, setFavorites] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        const loadFavorites = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // Fetch from Supabase
                const { data, error } = await supabase
                    .from("product_likes")
                    .select("product_id")
                    .eq("user_id", user.id)

                if (!error && data) {
                    setFavorites(data.map(f => f.product_id))
                }
            } else {
                // Fetch from localStorage
                const stored = localStorage.getItem("favorites")
                if (stored) {
                    setFavorites(JSON.parse(stored))
                }
            }
            setIsLoading(false)
        }

        loadFavorites()
    }, [])

    const toggleFavorite = async (productId: string) => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const isLiked = favorites.includes(productId)

        try {
            if (user) {
                if (isLiked) {
                    await supabase
                        .from("product_likes")
                        .delete()
                        .eq("user_id", user.id)
                        .eq("product_id", productId)
                } else {
                    await (supabase.from("product_likes") as any).insert({
                        user_id: user.id,
                        product_id: productId,
                    })
                }
            }

            // Always update localStorage for guests or as a backup/quick access
            let newFavorites: string[]
            if (isLiked) {
                newFavorites = favorites.filter(id => id !== productId)
            } else {
                newFavorites = [...favorites, productId]
            }

            setFavorites(newFavorites)
            localStorage.setItem("favorites", JSON.stringify(newFavorites))

            toast({
                title: isLiked ? "Removed from favorites" : "Added to favorites",
                description: isLiked ? "Product removed from your favorites list." : "Product added to your favorites list.",
            })

            return !isLiked
        } catch (error) {
            console.error("Error toggling favorite:", error)
            toast({
                title: "Error",
                description: "Failed to update favorites. Please try again.",
                variant: "destructive",
            })
            return isLiked
        }
    }

    return { favorites, toggleFavorite, isLoading, isFavorite: (id: string) => favorites.includes(id) }
}
