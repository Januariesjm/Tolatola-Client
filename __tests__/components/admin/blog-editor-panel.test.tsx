/**
 * Tests for BlogEditorPanel (components/admin/blog-editor-panel.tsx).
 *
 * Presentational: all editor state and persistence live in useBlogEditor /
 * BlogManagementTab, reaching this component through the `vm` prop. What
 * matters here is that every field reports through setEditingPost with the
 * right shape (including the title -> slug derivation, which lives only in
 * this component), the toolbar wires to execCommand/insertLink, tag and image
 * upload handlers fire with the right arguments, and the save/cancel actions
 * and loading state behave.
 */

import React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { BlogEditorPanel } from "@/components/admin/blog-editor-panel"
import type { BlogViewModel } from "@/components/admin/blog-view-model"

function editingPost(over: Record<string, unknown> = {}) {
  return {
    id: undefined as string | undefined,
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image_url: null,
    author_name: "TOLA Editorial",
    status: "draft" as const,
    tags: [] as string[],
    seo_title: "",
    meta_description: "",
    seo_keywords: [] as string[],
    scheduled_at: "",
    category_id: null as string | null,
    is_featured: false,
    ...over,
  }
}

function makeVm(over: Partial<BlogViewModel> = {}): BlogViewModel {
  return {
    categories: [],
    editingPost: editingPost(),
    editorRef: { current: null },
    handleAddTag: jest.fn(),
    handleFileUpload: jest.fn(),
    handleRemoveTag: jest.fn(),
    handleSavePost: jest.fn(),
    handleTagKeyDown: jest.fn(),
    isLoading: false,
    setEditingPost: jest.fn(),
    setIsEditing: jest.fn(),
    setTagInput: jest.fn(),
    tagInput: "",
    uploadingImage: false,
    execCommand: jest.fn(),
    insertLink: jest.fn(),
    // Unused by this component but required by the type.
    posts: [],
    activeSubTab: "posts",
    setActiveSubTab: jest.fn(),
    isEditing: true,
    isAddingCategory: false,
    setIsAddingCategory: jest.fn(),
    editingCategory: null,
    setEditingCategory: jest.fn(),
    categoryName: "",
    setCategoryName: jest.fn(),
    categoryDesc: "",
    setCategoryDesc: jest.fn(),
    postSearch: "",
    setPostSearch: jest.fn(),
    statusFilter: "all",
    setStatusFilter: jest.fn(),
    handleSaveCategory: jest.fn(),
    handleDeleteCategory: jest.fn(),
    handleDeletePost: jest.fn(),
    handleOpenCreatePost: jest.fn(),
    handleOpenEditPost: jest.fn(),
    refresh: jest.fn(),
    filteredPosts: [],
    ...over,
  } as BlogViewModel
}

/**
 * A setEditingPost double that resolves each call's updater against `prev`
 * immediately, at call time.
 *
 * setEditingPost is always called with an updater function, and every field
 * handler closes over the change event to read `e.target.value`. Reading that
 * lazily -- after `userEvent`/`fireEvent` returns -- comes back empty: React
 * restores a controlled input's real DOM value once it sees the update didn't
 * change props (which it never does here, since this mock doesn't feed back
 * into `editingPost`). Resolving inside the mock's own implementation runs
 * synchronously as part of the same event dispatch, before that restoration.
 */
function trackedSetter(prev: Record<string, unknown> = {}) {
  let latest: Record<string, unknown> | undefined
  const setEditingPost = jest.fn((updater: unknown) => {
    latest =
      typeof updater === "function" ? (updater as (p: unknown) => Record<string, unknown>)(prev) : (updater as Record<string, unknown>)
  })
  return { setEditingPost, latest: () => latest }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("BlogEditorPanel", () => {
  it("titles itself 'Create New Article' for a new post", () => {
    render(<BlogEditorPanel vm={makeVm({ editingPost: editingPost({ id: undefined }) })} />)

    expect(screen.getByText("Create New Article")).toBeInTheDocument()
  })

  it("titles itself 'Edit Article' when editing an existing post", () => {
    render(<BlogEditorPanel vm={makeVm({ editingPost: editingPost({ id: "p-1" }) })} />)

    expect(screen.getByText("Edit Article")).toBeInTheDocument()
  })

  describe("title field", () => {
    it("derives a slug from the title for a new post", async () => {
      const { setEditingPost, latest } = trackedSetter({})
      render(<BlogEditorPanel vm={makeVm({ setEditingPost, editingPost: editingPost({ id: undefined }) })} />)

      // A single fireEvent.change sets the full string in one dispatch --
      // userEvent.type's per-keystroke events would each read back "" before
      // the next keystroke, since nothing here feeds the typed value back
      // into the controlled `value` prop (see trackedSetter above).
      const { fireEvent } = await import("@testing-library/react")
      fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Trade & Growth!" } })

      expect(latest()).toMatchObject({ title: "Trade & Growth!", slug: "trade-growth" })
    })

    it("keeps the existing slug untouched when editing an existing post", async () => {
      const { setEditingPost, latest } = trackedSetter({ id: "p-1", slug: "original-slug" })
      render(<BlogEditorPanel vm={makeVm({ setEditingPost, editingPost: editingPost({ id: "p-1", slug: "original-slug" }) })} />)

      const { fireEvent } = await import("@testing-library/react")
      fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Trade Update" } })

      expect(latest()).toMatchObject({ slug: "original-slug" })
    })
  })

  it("reports excerpt keystrokes", async () => {
    const { setEditingPost, latest } = trackedSetter({})
    render(<BlogEditorPanel vm={makeVm({ setEditingPost })} />)

    await userEvent.type(screen.getByLabelText(/excerpt/i), "x")

    expect(latest()).toEqual({ excerpt: "x" })
  })

  describe("cover image", () => {
    it("uploads a selected file as the cover image", async () => {
      const handleFileUpload = jest.fn()
      render(<BlogEditorPanel vm={makeVm({ handleFileUpload })} />)

      const file = new File(["x"], "cover.png", { type: "image/png" })
      const coverInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement

      await userEvent.upload(coverInput, file)

      expect(handleFileUpload).toHaveBeenCalledWith(file, "cover")
    })

    it("shows the current cover image when one is set", () => {
      render(<BlogEditorPanel vm={makeVm({ editingPost: editingPost({ cover_image_url: "https://cdn.test/a.png" }) })} />)

      expect(screen.getByAltText("Cover")).toHaveAttribute("src", "https://cdn.test/a.png")
    })

    it("shows an uploading indicator while an image is uploading", () => {
      render(<BlogEditorPanel vm={makeVm({ uploadingImage: true })} />)

      expect(screen.getByText("Uploading cover image...")).toBeInTheDocument()
    })
  })

  describe("rich-text toolbar", () => {
    it.each([
      ["Heading 2", "formatBlock", "<h2>"],
      ["Heading 3", "formatBlock", "<h3>"],
      ["Bold", "bold", undefined],
      ["Italic", "italic", undefined],
      ["Bullet List", "insertUnorderedList", undefined],
      ["Numbered List", "insertOrderedList", undefined],
    ])("wires the %s button to execCommand", async (title, command, value) => {
      const execCommand = jest.fn()
      render(<BlogEditorPanel vm={makeVm({ execCommand })} />)

      await userEvent.click(screen.getByTitle(title as string))

      if (value === undefined) {
        expect(execCommand).toHaveBeenCalledWith(command)
      } else {
        expect(execCommand).toHaveBeenCalledWith(command, value)
      }
    })

    it("wires the link button to insertLink", async () => {
      const insertLink = jest.fn()
      render(<BlogEditorPanel vm={makeVm({ insertLink })} />)

      await userEvent.click(screen.getByTitle("Insert Link"))

      expect(insertLink).toHaveBeenCalledTimes(1)
    })

    it("uploads a selected inline image", async () => {
      const handleFileUpload = jest.fn()
      render(<BlogEditorPanel vm={makeVm({ handleFileUpload })} />)

      const file = new File(["x"], "inline.png", { type: "image/png" })
      const inlineInput = document.querySelectorAll('input[type="file"][accept="image/*"]')[1] as HTMLInputElement

      await userEvent.upload(inlineInput, file)

      expect(handleFileUpload).toHaveBeenCalledWith(file, "inline")
    })
  })

  describe("publishing settings", () => {
    it("reports a status change", async () => {
      const { setEditingPost, latest } = trackedSetter({})
      render(<BlogEditorPanel vm={makeVm({ setEditingPost })} />)

      await userEvent.selectOptions(screen.getByLabelText(/publishing status/i), "published")

      expect(latest()).toEqual({ status: "published" })
    })

    it("shows the schedule date field only when status is scheduled", () => {
      render(<BlogEditorPanel vm={makeVm({ editingPost: editingPost({ status: "scheduled" }) })} />)

      expect(screen.getByLabelText(/schedule date/i)).toBeInTheDocument()
    })

    it("hides the schedule date field for a draft", () => {
      render(<BlogEditorPanel vm={makeVm({ editingPost: editingPost({ status: "draft" }) })} />)

      expect(screen.queryByLabelText(/schedule date/i)).not.toBeInTheDocument()
    })

    it("reports a scheduled date change", async () => {
      const { setEditingPost, latest } = trackedSetter({})
      render(<BlogEditorPanel vm={makeVm({ setEditingPost, editingPost: editingPost({ status: "scheduled" }) })} />)

      const input = screen.getByLabelText(/schedule date/i)
      // fireEvent avoids userEvent's per-character typing into a datetime-local input.
      const { fireEvent } = await import("@testing-library/react")
      fireEvent.change(input, { target: { value: "2026-03-01T10:00" } })

      expect(latest()).toEqual({ scheduled_at: "2026-03-01T10:00" })
    })

    it("lists the available categories", () => {
      render(
        <BlogEditorPanel
          vm={makeVm({
            categories: [
              { id: "c-1", name: "News", slug: "news", description: null },
              { id: "c-2", name: "Tips", slug: "tips", description: null },
            ],
          })}
        />,
      )

      expect(screen.getByRole("option", { name: "News" })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: "Tips" })).toBeInTheDocument()
    })

    it("reports a category change", async () => {
      const { setEditingPost, latest } = trackedSetter({})
      render(
        <BlogEditorPanel vm={makeVm({ setEditingPost, categories: [{ id: "c-1", name: "News", slug: "news", description: null }] })} />,
      )

      await userEvent.selectOptions(screen.getByLabelText(/^category$/i), "c-1")

      expect(latest()).toEqual({ category_id: "c-1" })
    })

    it("reports an author name change", async () => {
      const { setEditingPost, latest } = trackedSetter({})
      render(<BlogEditorPanel vm={makeVm({ setEditingPost, editingPost: editingPost({ author_name: "" }) })} />)

      await userEvent.type(screen.getByLabelText(/author name/i), "A")

      expect(latest()).toEqual({ author_name: "A" })
    })

    it("toggles the featured switch", async () => {
      const { setEditingPost, latest } = trackedSetter({ is_featured: false })
      render(<BlogEditorPanel vm={makeVm({ setEditingPost, editingPost: editingPost({ is_featured: false }) })} />)

      await userEvent.click(screen.getByRole("switch"))

      expect(latest()).toEqual({ is_featured: true })
    })
  })

  describe("tags", () => {
    it("shows a placeholder when there are no tags", () => {
      render(<BlogEditorPanel vm={makeVm({ editingPost: editingPost({ tags: [] }) })} />)

      expect(screen.getByText("No tags added yet.")).toBeInTheDocument()
    })

    it("lists existing tags", () => {
      render(<BlogEditorPanel vm={makeVm({ editingPost: editingPost({ tags: ["logistics", "trade"] }) })} />)

      expect(screen.getByText("logistics")).toBeInTheDocument()
      expect(screen.getByText("trade")).toBeInTheDocument()
    })

    it("removes a tag", async () => {
      const handleRemoveTag = jest.fn()
      render(<BlogEditorPanel vm={makeVm({ handleRemoveTag, editingPost: editingPost({ tags: ["logistics"] }) })} />)

      const tagBadge = screen.getByText("logistics").closest("div") as HTMLElement
      await userEvent.click(within(tagBadge).getByRole("button"))

      expect(handleRemoveTag).toHaveBeenCalledWith("logistics")
    })

    it("reports tag input keystrokes", async () => {
      const setTagInput = jest.fn()
      render(<BlogEditorPanel vm={makeVm({ setTagInput })} />)

      await userEvent.type(screen.getByPlaceholderText(/type tag/i), "x")

      expect(setTagInput).toHaveBeenCalledWith("x")
    })

    it("delegates key handling on the tag input to handleTagKeyDown", async () => {
      const handleTagKeyDown = jest.fn()
      render(<BlogEditorPanel vm={makeVm({ handleTagKeyDown })} />)

      await userEvent.type(screen.getByPlaceholderText(/type tag/i), "{Enter}")

      expect(handleTagKeyDown).toHaveBeenCalled()
    })

    it("adds a tag from the Add button", async () => {
      const handleAddTag = jest.fn()
      render(<BlogEditorPanel vm={makeVm({ handleAddTag })} />)

      await userEvent.click(screen.getByRole("button", { name: "Add" }))

      expect(handleAddTag).toHaveBeenCalledTimes(1)
    })
  })

  describe("SEO fields", () => {
    it("reports an SEO title change", async () => {
      const { setEditingPost, latest } = trackedSetter({})
      render(<BlogEditorPanel vm={makeVm({ setEditingPost })} />)

      await userEvent.type(screen.getByLabelText(/seo meta title/i), "T")

      expect(latest()).toEqual({ seo_title: "T" })
    })

    it("shows the meta description character count", () => {
      render(<BlogEditorPanel vm={makeVm({ editingPost: editingPost({ meta_description: "hello" }) })} />)

      expect(screen.getByText("5/160 chars")).toBeInTheDocument()
    })

    it("reports a meta description change", async () => {
      const { setEditingPost, latest } = trackedSetter({})
      render(<BlogEditorPanel vm={makeVm({ setEditingPost })} />)

      await userEvent.type(screen.getByLabelText(/meta description/i), "d")

      expect(latest()).toEqual({ meta_description: "d" })
    })

    it("splits comma-separated SEO keywords into an array", async () => {
      const { setEditingPost, latest } = trackedSetter({})
      render(<BlogEditorPanel vm={makeVm({ setEditingPost })} />)

      const { fireEvent } = await import("@testing-library/react")
      fireEvent.change(screen.getByLabelText(/seo keywords/i), { target: { value: "tola, updates, news" } })

      expect(latest()).toEqual({ seo_keywords: ["tola", "updates", "news"] })
    })

    it("normalizes the slug field to lowercase and strips invalid characters", async () => {
      const { setEditingPost, latest } = trackedSetter({})
      render(<BlogEditorPanel vm={makeVm({ setEditingPost })} />)

      const { fireEvent } = await import("@testing-library/react")
      fireEvent.change(screen.getByLabelText(/url slug/i), { target: { value: "My Slug!!" } })

      expect(latest()).toEqual({ slug: "myslug" })
    })
  })

  describe("save / cancel", () => {
    it("calls handleSavePost from the Save Article button", async () => {
      const handleSavePost = jest.fn()
      render(<BlogEditorPanel vm={makeVm({ handleSavePost })} />)

      await userEvent.click(screen.getByRole("button", { name: /save article/i }))

      expect(handleSavePost).toHaveBeenCalledTimes(1)
    })

    it("disables Save while loading", () => {
      render(<BlogEditorPanel vm={makeVm({ isLoading: true })} />)

      expect(screen.getByRole("button", { name: /save article/i })).toBeDisabled()
    })

    it("calls setIsEditing(false) from the Cancel button", async () => {
      const setIsEditing = jest.fn()
      render(<BlogEditorPanel vm={makeVm({ setIsEditing })} />)

      await userEvent.click(screen.getByRole("button", { name: /cancel/i }))

      expect(setIsEditing).toHaveBeenCalledWith(false)
    })

    it("calls setIsEditing(false) from the back arrow", async () => {
      const setIsEditing = jest.fn()
      render(<BlogEditorPanel vm={makeVm({ setIsEditing })} />)

      const buttons = screen.getAllByRole("button")
      await userEvent.click(buttons[0])

      expect(setIsEditing).toHaveBeenCalledWith(false)
    })
  })
})
