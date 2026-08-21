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
 * The listings view: the posts table with search and status filter, and the categories tab.
 *
 * Sliced verbatim out of blog-management-tab.tsx, which was 766 lines holding
 * both views plus the editor toolbar in one file.
 */
export function BlogPostList({ vm }: { vm: BlogViewModel }) {
  const {
    activeSubTab,
    categories,
    categoryDesc,
    categoryName,
    editingCategory,
    handleDeleteCategory,
    handleDeletePost,
    handleOpenCreatePost,
    handleOpenEditPost,
    handleSaveCategory,
    postSearch,
    posts,
    setActiveSubTab,
    setCategoryDesc,
    setCategoryName,
    setEditingCategory,
    setPostSearch,
    setStatusFilter,
    statusFilter,
    filteredPosts,
  } = vm

  return (
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
  )
}
