"use client"

import React, { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { clientApiDelete, clientApiGet, clientApiPost, clientApiPut } from "@/lib/api-client"
import { logger, normalizeError } from "@/lib/logger"

const log = logger.child("admin.blog-management")

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  post_count?: number
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_image_url: string | null
  author_name: string
  status: "draft" | "published" | "scheduled"
  tags: string[]
  seo_title: string | null
  meta_description: string | null
  seo_keywords: string[]
  published_at: string | null
  scheduled_at: string | null
  created_at: string
  view_count: number
  reading_time_minutes: number
  is_featured: boolean
  category_id: string | null
  blog_categories?: Category | null
}

/**
 * Data layer and editor state for the admin blog tab: posts, categories, the
 * post editor, image upload, and tag editing.
 *
 * Extracted from components/admin/blog-management-tab.tsx, which mixed all of
 * this with ~690 lines of markup in a single 1022-line file. Keeping it here
 * makes the fetch/upload/delete branches testable without rendering the editor.
 */
export function useBlogEditor() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeSubTab, setActiveSubTab] = useState("posts")

  // Post Editor state
  const [isEditing, setIsEditing] = useState(false)
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Category Form state
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryName, setCategoryName] = useState("")
  const [categoryDesc, setCategoryDesc] = useState("")

  // Search & Filter state
  const [postSearch, setPostSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Tag editor input state
  const [tagInput, setTagInput] = useState("")

  // Editor ref for ContentEditable
  const editorRef = useRef<HTMLDivElement>(null)

  // Fetch initial blog data
  const fetchData = async () => {
    setIsLoading(true)
    try {
      const postsRes = await clientApiGet<{ data: BlogPost[] }>("admin/blog/posts")
      const categoriesRes = await clientApiGet<{ data: Category[] }>("blog/categories")

      setPosts(postsRes.data || [])
      setCategories(categoriesRes.data || [])
    } catch (error) {
      log.error("failed to fetch blog data", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // =============================================================================
  // IMAGE UPLOAD HELPER
  // =============================================================================
  const handleFileUpload = async (file: File, type: "cover" | "inline") => {
    try {
      setUploadingImage(true)

      // Convert file to Base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
      const base64Data = await base64Promise

      // Send to uploads/blog
      const response = await clientApiPost<{ url: string }>("uploads/blog", {
        filename: file.name,
        data: base64Data,
        contentType: file.type,
      })

      if (type === "cover") {
        setEditingPost((prev) => ({ ...prev, cover_image_url: response.url }))
      } else {
        // Insert image at cursor position in contenteditable
        if (editorRef.current) {
          editorRef.current.focus()
          document.execCommand(
            "insertHTML",
            false,
            `<img src="${response.url}" alt="${file.name}" class="my-6 rounded-2xl max-w-full h-auto shadow-md" />`,
          )
        }
      }
    } catch (error) {
      log.error("image upload failed", error)
      alert("Failed to upload image. Please try again.")
    } finally {
      setUploadingImage(false)
    }
  }

  // =============================================================================
  // POST ACTIONS
  // =============================================================================
  const handleOpenCreatePost = () => {
    setEditingPost({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      cover_image_url: null,
      author_name: "TOLA Editorial",
      status: "draft",
      tags: [],
      seo_title: "",
      meta_description: "",
      seo_keywords: [],
      is_featured: false,
      category_id: categories[0]?.id || null,
      scheduled_at: "",
    })
    setIsEditing(true)
  }

  const handleOpenEditPost = (post: BlogPost) => {
    setEditingPost({
      ...post,
      scheduled_at: post.scheduled_at ? new Date(post.scheduled_at).toISOString().slice(0, 16) : "",
    })
    setIsEditing(true)
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = post.content || ""
      }
    }, 100)
  }

  const handleDeletePost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog article? This action cannot be undone.")) return
    try {
      await clientApiDelete(`admin/blog/posts/${id}`)
      setPosts((prev) => prev.filter((p) => p.id !== id))
      alert("Article deleted successfully.")
    } catch (error) {
      log.error("failed to delete post", error)
      alert("Failed to delete article.")
    }
  }

  const handleSavePost = async () => {
    if (!editingPost?.title?.trim()) {
      alert("Please enter a title.")
      return
    }

    const htmlContent = editorRef.current?.innerHTML || ""
    const payload = {
      ...editingPost,
      content: htmlContent,
      slug: editingPost.slug || undefined,
    }

    try {
      setIsLoading(true)
      if (editingPost.id) {
        // Update
        const res = await clientApiPut<{ data: BlogPost }>(`admin/blog/posts/${editingPost.id}`, payload)
        setPosts((prev) => prev.map((p) => (p.id === res.data.id ? res.data : p)))
        alert("Article updated successfully!")
      } else {
        // Create
        const res = await clientApiPost<{ data: BlogPost }>("admin/blog/posts", payload)
        setPosts((prev) => [res.data, ...prev])
        alert("Article created successfully!")
      }
      setIsEditing(false)
      setEditingPost(null)
    } catch (error) {
      log.error("failed to save post", error)
      alert("Failed to save article.")
    } finally {
      setIsLoading(false)
    }
  }

  // =============================================================================
  // CATEGORY ACTIONS
  // =============================================================================
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryName.trim()) return

    try {
      setIsLoading(true)
      if (editingCategory) {
        // Edit
        const res = await clientApiPut<{ data: Category }>(`admin/blog/categories/${editingCategory.id}`, {
          name: categoryName,
          description: categoryDesc,
        })
        setCategories((prev) => prev.map((c) => (c.id === res.data.id ? { ...res.data, post_count: c.post_count } : c)))
        setEditingCategory(null)
        alert("Category updated successfully!")
      } else {
        // Create
        const res = await clientApiPost<{ data: Category }>("admin/blog/categories", {
          name: categoryName,
          description: categoryDesc,
        })
        setCategories((prev) => [...prev, { ...res.data, post_count: 0 }])
        alert("Category created successfully!")
      }
      setCategoryName("")
      setCategoryDesc("")
      setIsAddingCategory(false)
    } catch (error) {
      log.error("failed to save category", error)
      alert("Failed to save category.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return
    try {
      await clientApiDelete(`admin/blog/categories/${id}`)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      alert("Category deleted successfully.")
    } catch (error) {
      log.error("failed to delete category", error, { categoryId: id })
      alert(normalizeError(error).message || "Failed to delete category.")
    }
  }

  // =============================================================================
  // TAG EDITOR ACTIONS
  // =============================================================================
  const handleAddTag = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault()
    }
    const cleanTag = tagInput.trim().toLowerCase()
    if (cleanTag && editingPost) {
      const currentTags = editingPost.tags || []
      if (!currentTags.includes(cleanTag)) {
        setEditingPost({
          ...editingPost,
          tags: [...currentTags, cleanTag],
        })
      }
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    if (editingPost) {
      setEditingPost({
        ...editingPost,
        tags: (editingPost.tags || []).filter((t) => t !== tagToRemove),
      })
    }
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      handleAddTag()
    }
  }

  return {
    // data
    posts,
    categories,
    isLoading,
    // navigation
    activeSubTab,
    setActiveSubTab,
    // post editor
    isEditing,
    setIsEditing,
    editingPost,
    setEditingPost,
    uploadingImage,
    editorRef,
    // categories
    isAddingCategory,
    setIsAddingCategory,
    editingCategory,
    setEditingCategory,
    categoryName,
    setCategoryName,
    categoryDesc,
    setCategoryDesc,
    // filters
    postSearch,
    setPostSearch,
    statusFilter,
    setStatusFilter,
    // tags
    tagInput,
    setTagInput,
    handleAddTag,
    handleRemoveTag,
    handleTagKeyDown,
    // actions
    refresh: fetchData,
    handleFileUpload,
    handleOpenCreatePost,
    handleOpenEditPost,
    handleDeletePost,
    handleSavePost,
    handleSaveCategory,
    handleDeleteCategory,
  }
}

export type BlogEditorState = ReturnType<typeof useBlogEditor>
