"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Calendar,
  Heading1,
  Heading2,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  Check,
  AlertCircle,
  FileText,
  Search,
  Globe,
  Settings2,
  Tag,
  ArrowLeft,
  Loader2,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useBlogEditor, type BlogPost } from "@/hooks/use-blog-editor"

export function BlogManagementTab() {
  const {
    posts,
    categories,
    isLoading,
    activeSubTab,
    setActiveSubTab,
    isEditing,
    setIsEditing,
    editingPost,
    setEditingPost,
    uploadingImage,
    editorRef,
    isAddingCategory,
    setIsAddingCategory,
    editingCategory,
    setEditingCategory,
    categoryName,
    setCategoryName,
    categoryDesc,
    setCategoryDesc,
    postSearch,
    setPostSearch,
    statusFilter,
    setStatusFilter,
    tagInput,
    setTagInput,
    handleAddTag,
    handleRemoveTag,
    handleTagKeyDown,
    handleFileUpload,
    handleOpenCreatePost,
    handleOpenEditPost,
    handleDeletePost,
    handleSavePost,
    handleSaveCategory,
    handleDeleteCategory,
  } = useBlogEditor()

  // =============================================================================
  // EDITOR FORMATTING HELPERS
  // =============================================================================
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

  // Filter posts based on search/status
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

  return (
    <div className="space-y-6">
      {isEditing ? (
        // =============================================================================
        // ARTICLE EDITOR INTERFACE
        // =============================================================================
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-2xl font-black tracking-tight">{editingPost?.id ? "Edit Article" : "Create New Article"}</h2>
                <p className="text-sm text-muted-foreground">Draft and design premium content for the TOLA platform</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePost} disabled={isLoading} className="bg-primary text-white hover:bg-primary/90">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Save Article
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Editor Content Area */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-sm bg-white rounded-3xl p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="post-title" className="text-sm font-black uppercase tracking-wider text-slate-500">
                    Title
                  </Label>
                  <Input
                    id="post-title"
                    placeholder="Enter article title..."
                    value={editingPost?.title || ""}
                    onChange={(e) =>
                      setEditingPost((prev) => ({
                        ...prev,
                        title: e.target.value,
                        slug: prev?.id
                          ? prev.slug
                          : e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9\s-]/g, "")
                              .replace(/\s+/g, "-"),
                      }))
                    }
                    className="text-xl font-bold h-12 rounded-xl focus-visible:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="post-excerpt" className="text-sm font-black uppercase tracking-wider text-slate-500">
                    Excerpt / Brief Summary
                  </Label>
                  <Textarea
                    id="post-excerpt"
                    placeholder="Provide a short hook or description (will appear on listing grid)..."
                    value={editingPost?.excerpt || ""}
                    onChange={(e) => setEditingPost((prev) => ({ ...prev, excerpt: e.target.value }))}
                    rows={3}
                    className="rounded-xl resize-none italic"
                  />
                </div>

                {/* Cover Image Upload */}
                <div className="space-y-2">
                  <Label className="text-sm font-black uppercase tracking-wider text-slate-500">Cover Image</Label>
                  <div className="flex gap-4 items-center">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "cover")}
                      disabled={uploadingImage}
                      className="rounded-xl border border-stone-200"
                    />
                    {editingPost?.cover_image_url && (
                      <div className="relative h-20 w-32 rounded-xl overflow-hidden border">
                        <img src={editingPost.cover_image_url} alt="Cover" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                  {uploadingImage && <p className="text-xs text-muted-foreground animate-pulse">Uploading cover image...</p>}
                </div>

                {/* ContentEditor Toolbar */}
                <div className="space-y-2">
                  <Label className="text-sm font-black uppercase tracking-wider text-slate-500">Body Content</Label>
                  <div className="border border-stone-200 rounded-3xl overflow-hidden">
                    <div className="bg-stone-50 border-b border-stone-200 p-2 flex flex-wrap gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => execCommand("formatBlock", "<h2>")}
                        title="Heading 2"
                        className="h-8 w-8"
                      >
                        <Heading1 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => execCommand("formatBlock", "<h3>")}
                        title="Heading 3"
                        className="h-8 w-8"
                      >
                        <Heading2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => execCommand("bold")}
                        title="Bold"
                        className="h-8 w-8 font-bold"
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => execCommand("italic")}
                        title="Italic"
                        className="h-8 w-8 italic"
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => execCommand("insertUnorderedList")}
                        title="Bullet List"
                        className="h-8 w-8"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => execCommand("insertOrderedList")}
                        title="Numbered List"
                        className="h-8 w-8"
                      >
                        <ListOrdered className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" type="button" onClick={insertLink} title="Insert Link" className="h-8 w-8">
                        <Link2 className="h-4 w-4" />
                      </Button>
                      <div className="relative">
                        <Button variant="ghost" size="icon" type="button" title="Insert Image" className="h-8 w-8 relative">
                          <ImageIcon className="h-4 w-4" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "inline")}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </Button>
                      </div>
                    </div>
                    {/* Contenteditable area */}
                    <div
                      ref={editorRef}
                      contentEditable="true"
                      suppressContentEditableWarning
                      className="min-h-[400px] p-6 focus:outline-none overflow-y-auto prose max-w-none text-slate-800"
                      data-placeholder="Start writing your announcements, AI innovations, success stories..."
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Editor Sidebar Settings */}
            <div className="space-y-6">
              <Card className="border-none shadow-sm bg-white rounded-3xl p-6 space-y-6">
                <h3 className="font-bold text-lg flex items-center gap-2 border-b pb-3">
                  <Settings2 className="h-5 w-5 text-primary" /> Publishing Settings
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="post-status" className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Publishing Status
                  </Label>
                  <select
                    id="post-status"
                    value={editingPost?.status || "draft"}
                    onChange={(e) => setEditingPost((prev) => ({ ...prev, status: e.target.value as any }))}
                    className="w-full h-10 px-3 rounded-xl border border-stone-200 bg-transparent text-sm focus:outline-none"
                  >
                    <option value="draft">Save as Draft</option>
                    <option value="published">Publish Immediately</option>
                    <option value="scheduled">Schedule Post</option>
                  </select>
                </div>

                {editingPost?.status === "scheduled" && (
                  <div className="space-y-2 animate-in fade-in duration-300">
                    <Label htmlFor="post-scheduled-at" className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Schedule Date & Time
                    </Label>
                    <Input
                      id="post-scheduled-at"
                      type="datetime-local"
                      value={editingPost.scheduled_at || ""}
                      onChange={(e) => setEditingPost((prev) => ({ ...prev, scheduled_at: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="post-category" className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Category
                  </Label>
                  <select
                    id="post-category"
                    value={editingPost?.category_id || ""}
                    onChange={(e) => setEditingPost((prev) => ({ ...prev, category_id: e.target.value || null }))}
                    className="w-full h-10 px-3 rounded-xl border border-stone-200 bg-transparent text-sm focus:outline-none"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="post-author" className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Author Name
                  </Label>
                  <Input
                    id="post-author"
                    value={editingPost?.author_name || ""}
                    onChange={(e) => setEditingPost((prev) => ({ ...prev, author_name: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="post-tags" className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Tags
                  </Label>
                  <div className="flex flex-wrap gap-1.5 mb-2 min-h-6">
                    {(editingPost?.tags || []).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 bg-stone-100 text-stone-700 hover:bg-stone-200 border-none"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-stone-400 hover:text-stone-600 rounded-full focus:outline-none shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {(editingPost?.tags || []).length === 0 && <span className="text-xs text-stone-400 italic">No tags added yet.</span>}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="post-tags"
                      placeholder="Type tag & press Enter or comma..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      className="rounded-xl flex-1 h-9 text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleAddTag()}
                      className="rounded-xl px-4 h-9 text-xs font-bold shrink-0"
                    >
                      Add
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="is-featured" className="text-sm font-bold">
                      Featured Article
                    </Label>
                    <p className="text-xs text-muted-foreground">Highlight on blog home page banner</p>
                  </div>
                  <Switch
                    id="is-featured"
                    checked={editingPost?.is_featured || false}
                    onCheckedChange={(checked) => setEditingPost((prev) => ({ ...prev, is_featured: checked }))}
                  />
                </div>
              </Card>

              {/* SEO Collapsible Settings */}
              <Card className="border-none shadow-sm bg-white rounded-3xl p-6 space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2 border-b pb-3">
                  <Globe className="h-5 w-5 text-indigo-500" /> SEO Configuration
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="seo-title" className="text-xs font-black uppercase tracking-wider text-slate-500">
                    SEO Meta Title
                  </Label>
                  <Input
                    id="seo-title"
                    placeholder="Custom page title for google search..."
                    value={editingPost?.seo_title || ""}
                    onChange={(e) => setEditingPost((prev) => ({ ...prev, seo_title: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="meta-desc" className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Meta Description
                    </Label>
                    <span className="text-[10px] text-muted-foreground">{(editingPost?.meta_description || "").length}/160 chars</span>
                  </div>
                  <Textarea
                    id="meta-desc"
                    placeholder="Hook users on Google search results page (150-160 characters)..."
                    value={editingPost?.meta_description || ""}
                    onChange={(e) => setEditingPost((prev) => ({ ...prev, meta_description: e.target.value }))}
                    rows={4}
                    className="rounded-xl resize-none text-xs"
                    maxLength={160}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seo-keywords" className="text-xs font-black uppercase tracking-wider text-slate-500">
                    SEO Keywords (comma separated)
                  </Label>
                  <Input
                    id="seo-keywords"
                    placeholder="tola updates, marketplace announcements"
                    value={editingPost?.seo_keywords?.join(", ") || ""}
                    onChange={(e) =>
                      setEditingPost((prev) => ({
                        ...prev,
                        seo_keywords: e.target.value
                          .split(",")
                          .map((k) => k.trim())
                          .filter(Boolean),
                      }))
                    }
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="post-slug" className="text-xs font-black uppercase tracking-wider text-slate-500">
                    URL Slug
                  </Label>
                  <Input
                    id="post-slug"
                    value={editingPost?.slug || ""}
                    onChange={(e) => setEditingPost((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                    placeholder="my-custom-slug"
                    className="rounded-xl text-xs font-mono"
                  />
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        // =============================================================================
        // MAIN LISTINGS TAB VIEW
        // =============================================================================
        <div className="space-y-6">
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
              <div>
                <h2 className="text-3xl font-black tracking-tight">TOLA Journal</h2>
                <p className="text-muted-foreground italic">Announcements, innovations, news, and marketplace growth tips</p>
              </div>

              <div className="flex gap-2">
                <TabsList className="bg-white border rounded-full px-1 py-1 h-auto shadow-sm">
                  <TabsTrigger value="posts" className="px-5 rounded-full text-xs font-bold">
                    Articles ({posts.length})
                  </TabsTrigger>
                  <TabsTrigger value="categories" className="px-5 rounded-full text-xs font-bold">
                    Categories ({categories.length})
                  </TabsTrigger>
                </TabsList>
                <Button onClick={handleOpenCreatePost} className="bg-primary text-white hover:bg-primary/90 rounded-full px-6">
                  <Plus className="h-4 w-4 mr-2" /> Write Article
                </Button>
              </div>
            </div>

            {/* POSTS TAB CONTENT */}
            <TabsContent value="posts" className="space-y-6 outline-none border-none p-0">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                  <Input
                    placeholder="Search articles by title or excerpt..."
                    value={postSearch}
                    onChange={(e) => setPostSearch(e.target.value)}
                    className="pl-10 rounded-full h-10 border-stone-200 bg-white"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 px-4 rounded-full border border-stone-200 bg-white text-sm focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Drafts</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>

              <div className="grid gap-4">
                {filteredPosts.map((post) => (
                  <Card
                    key={post.id}
                    className="border-none shadow-sm hover:shadow-md transition-all duration-300 rounded-3xl bg-white overflow-hidden p-6"
                  >
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      {post.cover_image_url && (
                        <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden shrink-0 border relative">
                          <img src={post.cover_image_url} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                            {post.blog_categories?.name || "Uncategorized"}
                          </Badge>
                          {post.is_featured && (
                            <Badge className="bg-amber-500 text-white text-[10px] uppercase font-bold tracking-wider">Featured</Badge>
                          )}
                          <Badge
                            className={
                              post.status === "published"
                                ? "bg-green-500 text-white"
                                : post.status === "scheduled"
                                  ? "bg-indigo-500 text-white"
                                  : "bg-stone-400 text-white"
                            }
                          >
                            {post.status}
                          </Badge>
                        </div>

                        <h3
                          className="text-xl font-bold text-slate-900 leading-tight mb-2 hover:text-primary cursor-pointer truncate"
                          onClick={() => handleOpenEditPost(post)}
                        >
                          {post.title}
                        </h3>

                        <p className="text-sm text-stone-500 line-clamp-2 italic mb-4">"{post.excerpt || "No summary provided."}"</p>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-stone-400">
                          <span className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5" /> Read Time: {post.reading_time_minutes} min
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5" /> Views: {post.view_count}
                          </span>
                          {post.published_at && (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" /> Published: {new Date(post.published_at).toLocaleDateString()}
                            </span>
                          )}
                          {post.scheduled_at && post.status === "scheduled" && (
                            <span className="flex items-center gap-1.5 text-indigo-500 font-bold">
                              <Calendar className="h-3.5 w-3.5" /> Scheduled: {new Date(post.scheduled_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 self-stretch md:self-auto justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full h-9 w-9 p-0"
                          title="Edit Article"
                          onClick={() => handleOpenEditPost(post)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {post.status === "published" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full h-9 w-9 p-0"
                            title="View Public Post"
                            onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          className="rounded-full h-9 w-9 p-0"
                          title="Delete"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

                {filteredPosts.length === 0 && (
                  <Card className="border-dashed border-2">
                    <CardContent className="py-12 text-center text-stone-400 flex flex-col items-center gap-2">
                      <AlertCircle className="h-10 w-10 opacity-30" />
                      <p className="font-semibold italic">No articles found matching filters.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* CATEGORIES TAB CONTENT */}
            <TabsContent value="categories" className="space-y-6 outline-none border-none p-0">
              <div className="grid md:grid-cols-3 gap-8">
                {/* Category Creation Form */}
                <div className="md:col-span-1">
                  <Card className="border-none shadow-sm bg-white rounded-3xl p-6">
                    <CardHeader className="p-0 pb-4 border-b mb-4">
                      <CardTitle className="text-lg font-bold">{editingCategory ? "Edit Category" : "Add New Category"}</CardTitle>
                      <CardDescription>Organize articles with tags and slugs</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSaveCategory} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cat-name">Category Name *</Label>
                        <Input
                          id="cat-name"
                          placeholder="e.g. Tips & Guides"
                          value={categoryName}
                          onChange={(e) => setCategoryName(e.target.value)}
                          required
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cat-desc">Description</Label>
                        <Textarea
                          id="cat-desc"
                          placeholder="Short description of this category topic..."
                          value={categoryDesc}
                          onChange={(e) => setCategoryDesc(e.target.value)}
                          rows={4}
                          className="rounded-xl resize-none text-xs"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1 bg-primary text-white rounded-xl">
                          {editingCategory ? "Update" : "Save"} Category
                        </Button>
                        {editingCategory && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setEditingCategory(null)
                              setCategoryName("")
                              setCategoryDesc("")
                            }}
                            className="rounded-xl"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </form>
                  </Card>
                </div>

                {/* Categories List */}
                <div className="md:col-span-2 space-y-4">
                  {categories.map((cat) => (
                    <Card key={cat.id} className="border-none shadow-sm rounded-3xl bg-white p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-slate-900">{cat.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {cat.post_count || 0} posts
                            </Badge>
                          </div>
                          <p className="text-xs font-mono text-stone-400 mt-1">Slug: {cat.slug}</p>
                          {cat.description && <p className="text-sm text-stone-500 italic mt-2">"{cat.description}"</p>}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full h-9 w-9 p-0"
                            onClick={() => {
                              setEditingCategory(cat)
                              setCategoryName(cat.name)
                              setCategoryDesc(cat.description || "")
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="rounded-full h-9 w-9 p-0"
                            onClick={() => handleDeleteCategory(cat.id)}
                            disabled={cat.post_count !== undefined && cat.post_count > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {categories.length === 0 && (
                    <Card className="py-12 text-center text-stone-400">
                      <p>No categories found.</p>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
