"use client"

import { Loader2 } from "lucide-react"
import { useBlogEditor } from "@/hooks/use-blog-editor"
import { BlogEditorPanel } from "./blog-editor-panel"
import { BlogPostList } from "./blog-post-list"
import type { BlogViewModel } from "./blog-view-model"

/**
 * TOLA Journal admin tab.
 *
 * A shell: it owns the rich-text toolbar helpers and the post filter, and
 * switches between the editor and the listings. All data and editor state live
 * in useBlogEditor.
 */
export function BlogManagementTab() {
  const state = useBlogEditor()
  const { editorRef, posts, postSearch, statusFilter, isLoading, isEditing } = state

  const execCommand = (command: string, value: string = "") => {
    if (editorRef.current) {
      editorRef.current.focus()
      document.execCommand(command, false, value)
    }
  }

  const insertLink = () => {
    const url = prompt("Enter link URL:")
    if (url) execCommand("createLink", url)
  }

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(postSearch.toLowerCase()) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(postSearch.toLowerCase()))
    const matchesStatus = statusFilter === "all" ? true : post.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (isLoading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="font-semibold italic">Loading TOLA Journal dashboard...</p>
      </div>
    )
  }

  const vm: BlogViewModel = { ...state, execCommand, insertLink, filteredPosts }

  return <div className="space-y-6">{isEditing ? <BlogEditorPanel vm={vm} /> : <BlogPostList vm={vm} />}</div>
}
