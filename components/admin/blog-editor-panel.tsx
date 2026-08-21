"use client"

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
import { useBlogEditor, type BlogPost } from "@/hooks/use-blog-editor"
import type { BlogViewModel } from "./blog-view-model"

/**
 * The article editor: cover image, rich-text toolbar, contenteditable body, and the settings/SEO sidebar.
 *
 * Sliced verbatim out of blog-management-tab.tsx, which was 766 lines holding
 * both views plus the editor toolbar in one file.
 */
export function BlogEditorPanel({ vm }: { vm: BlogViewModel }) {
  const {
    categories,
    editingPost,
    editorRef,
    handleAddTag,
    handleFileUpload,
    handleRemoveTag,
    handleSavePost,
    handleTagKeyDown,
    isLoading,
    setEditingPost,
    setIsEditing,
    setTagInput,
    tagInput,
    uploadingImage,
    execCommand,
    insertLink,
  } = vm

  return (
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
  )
}
