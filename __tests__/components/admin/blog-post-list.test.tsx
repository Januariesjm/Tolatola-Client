/**
 * Tests for BlogPostList (components/admin/blog-post-list.tsx).
 *
 * Presentational: all data and handlers come from the `vm` prop built by
 * useBlogEditor / BlogManagementTab. What matters here is the posts grid (empty
 * state, badges, per-row actions) and the categories tab (form add/edit,
 * delete-disabled-when-in-use), plus that every callback fires with the right
 * argument.
 */

import React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { BlogPostList } from "@/components/admin/blog-post-list"
import type { BlogViewModel } from "@/components/admin/blog-view-model"
import type { BlogPost } from "@/hooks/use-blog-editor"

function post(over: Partial<BlogPost> = {}): BlogPost {
  return {
    id: "p-1",
    title: "Trade in Dodoma",
    slug: "trade-in-dodoma",
    excerpt: "A quick look at regional trade.",
    content: "<p>hi</p>",
    cover_image_url: null,
    author_name: "TOLA Editorial",
    status: "draft",
    tags: [],
    seo_title: null,
    meta_description: null,
    seo_keywords: [],
    published_at: null,
    scheduled_at: null,
    created_at: "2026-02-01T00:00:00Z",
    view_count: 12,
    reading_time_minutes: 3,
    is_featured: false,
    category_id: null,
    blog_categories: null,
    ...over,
  }
}

function category(over: Record<string, unknown> = {}) {
  return {
    id: "c-1",
    name: "Announcements",
    slug: "announcements",
    description: "Platform news",
    post_count: 0,
    ...over,
  }
}

function makeVm(over: Partial<BlogViewModel> = {}): BlogViewModel {
  return {
    activeSubTab: "posts",
    categories: [],
    categoryDesc: "",
    categoryName: "",
    editingCategory: null,
    handleDeleteCategory: jest.fn(),
    handleDeletePost: jest.fn(),
    handleOpenCreatePost: jest.fn(),
    handleOpenEditPost: jest.fn(),
    handleSaveCategory: jest.fn((e: React.FormEvent) => e.preventDefault()),
    postSearch: "",
    posts: [],
    setActiveSubTab: jest.fn(),
    setCategoryDesc: jest.fn(),
    setCategoryName: jest.fn(),
    setEditingCategory: jest.fn(),
    setPostSearch: jest.fn(),
    setStatusFilter: jest.fn(),
    statusFilter: "all",
    filteredPosts: [],
    // Unused by this component but required by the type.
    isEditing: false,
    setIsEditing: jest.fn(),
    editingPost: null,
    setEditingPost: jest.fn(),
    uploadingImage: false,
    editorRef: { current: null },
    isLoading: false,
    isAddingCategory: false,
    setIsAddingCategory: jest.fn(),
    tagInput: "",
    setTagInput: jest.fn(),
    handleAddTag: jest.fn(),
    handleRemoveTag: jest.fn(),
    handleTagKeyDown: jest.fn(),
    refresh: jest.fn(),
    handleFileUpload: jest.fn(),
    execCommand: jest.fn(),
    insertLink: jest.fn(),
    ...over,
  } as BlogViewModel
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("BlogPostList", () => {
  describe("posts tab", () => {
    it("shows an empty state when no posts match the filters", () => {
      render(<BlogPostList vm={makeVm({ filteredPosts: [] })} />)

      expect(screen.getByText("No articles found matching filters.")).toBeInTheDocument()
    })

    it("renders a post's title, excerpt and stats", () => {
      render(<BlogPostList vm={makeVm({ filteredPosts: [post()] })} />)

      expect(screen.getByText("Trade in Dodoma")).toBeInTheDocument()
      expect(screen.getByText('"A quick look at regional trade."')).toBeInTheDocument()
      expect(screen.getByText("Read Time: 3 min")).toBeInTheDocument()
      expect(screen.getByText("Views: 12")).toBeInTheDocument()
    })

    it("falls back to a placeholder excerpt when none is provided", () => {
      render(<BlogPostList vm={makeVm({ filteredPosts: [post({ excerpt: null })] })} />)

      expect(screen.getByText('"No summary provided."')).toBeInTheDocument()
    })

    it("shows 'Uncategorized' when the post has no category", () => {
      render(<BlogPostList vm={makeVm({ filteredPosts: [post()] })} />)

      expect(screen.getByText("Uncategorized")).toBeInTheDocument()
    })

    it("shows the category name when the post has one", () => {
      render(
        <BlogPostList
          vm={makeVm({ filteredPosts: [post({ blog_categories: { id: "c-1", name: "News", slug: "news", description: null } })] })}
        />,
      )

      expect(screen.getByText("News")).toBeInTheDocument()
    })

    it("shows a Featured badge only when the post is featured", () => {
      render(<BlogPostList vm={makeVm({ filteredPosts: [post({ is_featured: true })] })} />)

      expect(screen.getByText("Featured")).toBeInTheDocument()
    })

    it("does not show a Featured badge for a non-featured post", () => {
      render(<BlogPostList vm={makeVm({ filteredPosts: [post({ is_featured: false })] })} />)

      expect(screen.queryByText("Featured")).not.toBeInTheDocument()
    })

    it("shows the published date for a published post", () => {
      render(<BlogPostList vm={makeVm({ filteredPosts: [post({ status: "published", published_at: "2026-02-05T00:00:00Z" })] })} />)

      expect(screen.getByText(`Published: ${new Date("2026-02-05T00:00:00Z").toLocaleDateString()}`)).toBeInTheDocument()
    })

    it("shows the scheduled date for a scheduled post", () => {
      render(<BlogPostList vm={makeVm({ filteredPosts: [post({ status: "scheduled", scheduled_at: "2026-03-01T10:00:00Z" })] })} />)

      expect(screen.getByText(`Scheduled: ${new Date("2026-03-01T10:00:00Z").toLocaleString()}`, { exact: false })).toBeInTheDocument()
    })

    it("shows a View Public Post button only for a published post", () => {
      render(<BlogPostList vm={makeVm({ filteredPosts: [post({ status: "published" })] })} />)

      expect(screen.getByTitle("View Public Post")).toBeInTheDocument()
    })

    it("hides the View Public Post button for a draft", () => {
      render(<BlogPostList vm={makeVm({ filteredPosts: [post({ status: "draft" })] })} />)

      expect(screen.queryByTitle("View Public Post")).not.toBeInTheDocument()
    })

    it("opens the public post in a new tab", async () => {
      const openSpy = jest.spyOn(window, "open").mockImplementation(() => null)
      render(<BlogPostList vm={makeVm({ filteredPosts: [post({ status: "published", slug: "trade-in-dodoma" })] })} />)

      await userEvent.click(screen.getByTitle("View Public Post"))

      expect(openSpy).toHaveBeenCalledWith("/blog/trade-in-dodoma", "_blank")
      openSpy.mockRestore()
    })

    it("calls handleOpenEditPost when the title is clicked", async () => {
      const vm = makeVm({ filteredPosts: [post()] })
      render(<BlogPostList vm={vm} />)

      await userEvent.click(screen.getByText("Trade in Dodoma"))

      expect(vm.handleOpenEditPost).toHaveBeenCalledWith(post())
    })

    it("calls handleOpenEditPost from the edit button", async () => {
      const vm = makeVm({ filteredPosts: [post()] })
      render(<BlogPostList vm={vm} />)

      await userEvent.click(screen.getByTitle("Edit Article"))

      expect(vm.handleOpenEditPost).toHaveBeenCalledWith(post())
    })

    it("calls handleDeletePost with the post's id", async () => {
      const vm = makeVm({ filteredPosts: [post()] })
      render(<BlogPostList vm={vm} />)

      await userEvent.click(screen.getByTitle("Delete"))

      expect(vm.handleDeletePost).toHaveBeenCalledWith("p-1")
    })

    it("calls handleOpenCreatePost from the Write Article button", async () => {
      const vm = makeVm()
      render(<BlogPostList vm={vm} />)

      await userEvent.click(screen.getByRole("button", { name: /write article/i }))

      expect(vm.handleOpenCreatePost).toHaveBeenCalledTimes(1)
    })

    it("reports a search keystroke", async () => {
      const vm = makeVm()
      render(<BlogPostList vm={vm} />)

      await userEvent.type(screen.getByPlaceholderText("Search articles by title or excerpt..."), "t")

      expect(vm.setPostSearch).toHaveBeenCalledWith("t")
    })

    it("reports a status filter change", async () => {
      const vm = makeVm()
      render(<BlogPostList vm={vm} />)

      await userEvent.selectOptions(screen.getByDisplayValue("All Statuses"), "published")

      expect(vm.setStatusFilter).toHaveBeenCalledWith("published")
    })

    it("shows the article and category counts in the tab triggers", () => {
      render(<BlogPostList vm={makeVm({ posts: [post(), post({ id: "p-2" })], categories: [category()] })} />)

      expect(screen.getByText("Articles (2)")).toBeInTheDocument()
      expect(screen.getByText("Categories (1)")).toBeInTheDocument()
    })

    it("reports a subtab change", async () => {
      const vm = makeVm()
      render(<BlogPostList vm={vm} />)

      await userEvent.click(screen.getByText(/Categories/))

      expect(vm.setActiveSubTab).toHaveBeenCalledWith("categories")
    })
  })

  describe("categories tab", () => {
    it("shows the add-category form by default", () => {
      render(<BlogPostList vm={makeVm({ activeSubTab: "categories" })} />)

      expect(screen.getByText("Add New Category")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /save category/i })).toBeInTheDocument()
    })

    it("switches to edit mode when a category is being edited", () => {
      render(<BlogPostList vm={makeVm({ activeSubTab: "categories", editingCategory: category(), categoryName: "Announcements" })} />)

      expect(screen.getByText("Edit Category")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /update category/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument()
    })

    it("cancels editing and clears the form", async () => {
      const vm = makeVm({ activeSubTab: "categories", editingCategory: category(), categoryName: "Announcements" })
      render(<BlogPostList vm={vm} />)

      await userEvent.click(screen.getByRole("button", { name: /cancel/i }))

      expect(vm.setEditingCategory).toHaveBeenCalledWith(null)
      expect(vm.setCategoryName).toHaveBeenCalledWith("")
      expect(vm.setCategoryDesc).toHaveBeenCalledWith("")
    })

    it("reports name and description keystrokes", async () => {
      const vm = makeVm({ activeSubTab: "categories" })
      render(<BlogPostList vm={vm} />)

      await userEvent.type(screen.getByLabelText(/category name/i), "N")
      await userEvent.type(screen.getByLabelText(/description/i), "D")

      expect(vm.setCategoryName).toHaveBeenCalledWith("N")
      expect(vm.setCategoryDesc).toHaveBeenCalledWith("D")
    })

    it("submits the category form", async () => {
      const vm = makeVm({ activeSubTab: "categories", categoryName: "News" })
      render(<BlogPostList vm={vm} />)

      await userEvent.click(screen.getByRole("button", { name: /save category/i }))

      expect(vm.handleSaveCategory).toHaveBeenCalledTimes(1)
    })

    it("shows an empty state when there are no categories", () => {
      render(<BlogPostList vm={makeVm({ activeSubTab: "categories", categories: [] })} />)

      expect(screen.getByText("No categories found.")).toBeInTheDocument()
    })

    it("lists a category with its post count and slug", () => {
      render(<BlogPostList vm={makeVm({ activeSubTab: "categories", categories: [category({ post_count: 4 })] })} />)

      expect(screen.getByText("Announcements")).toBeInTheDocument()
      expect(screen.getByText("4 posts")).toBeInTheDocument()
      expect(screen.getByText("Slug: announcements")).toBeInTheDocument()
      expect(screen.getByText('"Platform news"')).toBeInTheDocument()
    })

    it("loads the category into the form for editing", async () => {
      const vm = makeVm({ activeSubTab: "categories", categories: [category()] })
      render(<BlogPostList vm={vm} />)

      const row = screen.getByText("Announcements").closest("div.flex.items-center.justify-between") as HTMLElement
      const [editButton] = within(row).getAllByRole("button")
      await userEvent.click(editButton)

      expect(vm.setEditingCategory).toHaveBeenCalledWith(category())
      expect(vm.setCategoryName).toHaveBeenCalledWith("Announcements")
      expect(vm.setCategoryDesc).toHaveBeenCalledWith("Platform news")
    })

    it("calls handleDeleteCategory with the category's id", async () => {
      const vm = makeVm({ activeSubTab: "categories", categories: [category({ post_count: 0 })] })
      render(<BlogPostList vm={vm} />)

      const row = screen.getByText("Announcements").closest("div.flex.items-center.justify-between") as HTMLElement
      const [, deleteButton] = within(row).getAllByRole("button")
      await userEvent.click(deleteButton)

      expect(vm.handleDeleteCategory).toHaveBeenCalledWith("c-1")
    })

    it("disables delete for a category that still has posts", () => {
      render(<BlogPostList vm={makeVm({ activeSubTab: "categories", categories: [category({ post_count: 2 })] })} />)

      const row = screen.getByText("Announcements").closest("div.flex.items-center.justify-between") as HTMLElement
      const [, deleteButton] = within(row).getAllByRole("button")
      expect(deleteButton).toBeDisabled()
    })
  })
})
