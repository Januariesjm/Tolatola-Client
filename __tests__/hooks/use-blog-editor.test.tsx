/**
 * Tests for useBlogEditor (hooks/use-blog-editor.ts).
 *
 * Extracted from a 1022-line component that had no coverage of these branches.
 * Focus is the paths that touch the API: initial load, image upload (success and
 * failure), post delete, post save (create vs update), and tag editing.
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import { setErrorReporter, type LogRecord } from "@/lib/logger"

const mockGet = jest.fn()
const mockPost = jest.fn()
const mockPut = jest.fn()
const mockDelete = jest.fn()

jest.mock("@/lib/api-client", () => ({
  clientApiGet: (...a: unknown[]) => mockGet(...a),
  clientApiPost: (...a: unknown[]) => mockPost(...a),
  clientApiPut: (...a: unknown[]) => mockPut(...a),
  clientApiDelete: (...a: unknown[]) => mockDelete(...a),
}))

import { useBlogEditor } from "@/hooks/use-blog-editor"

const post = (over: Record<string, unknown> = {}) => ({
  id: "p-1",
  title: "Trade in Dodoma",
  slug: "trade-in-dodoma",
  excerpt: null,
  content: "<p>hi</p>",
  cover_image_url: null,
  author_name: "TOLA Editorial",
  status: "draft",
  tags: ["trade"],
  seo_title: null,
  meta_description: null,
  seo_keywords: [],
  published_at: null,
  scheduled_at: null,
  created_at: "2026-02-01",
  view_count: 0,
  reading_time_minutes: 3,
  is_featured: false,
  category_id: "c-1",
  ...over,
})

let reported: LogRecord[]

/** Minimal FileReader stub: readAsDataURL resolves to a fixed data URL. */
function stubFileReader(shouldFail = false) {
  class FR {
    result: string | null = null
    onloadend: (() => void) | null = null
    readAsDataURL() {
      if (shouldFail) throw new Error("cannot read file")
      this.result = "data:image/png;base64,AAA"
      this.onloadend?.()
    }
  }
  global.FileReader = FR as unknown as typeof FileReader
}

beforeEach(() => {
  jest.clearAllMocks()
  reported = []
  setErrorReporter((r) => reported.push(r))
  jest.spyOn(console, "error").mockImplementation(() => {})
  jest.spyOn(console, "log").mockImplementation(() => {})
  jest.spyOn(window, "alert").mockImplementation(() => {})
  jest.spyOn(window, "confirm").mockReturnValue(true)
  mockGet.mockResolvedValue({ data: [] })
  stubFileReader()
})

afterEach(() => {
  setErrorReporter(null)
  jest.restoreAllMocks()
})

/** Renders the hook and waits for its initial fetch to settle. */
async function renderReady() {
  const view = renderHook(() => useBlogEditor())
  await waitFor(() => expect(view.result.current.isLoading).toBe(false))
  return view
}

describe("useBlogEditor", () => {
  describe("initial load", () => {
    it("fetches posts and categories", async () => {
      mockGet
        .mockResolvedValueOnce({ data: [post()] })
        .mockResolvedValueOnce({ data: [{ id: "c-1", name: "Trade", slug: "trade", description: null }] })

      const { result } = await renderReady()

      expect(mockGet).toHaveBeenCalledWith("admin/blog/posts")
      expect(mockGet).toHaveBeenCalledWith("blog/categories")
      expect(result.current.posts).toHaveLength(1)
      expect(result.current.categories).toHaveLength(1)
    })

    it("logs and stops loading when the fetch fails", async () => {
      mockGet.mockRejectedValue(new Error("500"))

      const { result } = await renderReady()

      expect(result.current.posts).toEqual([])
      expect(reported.map((r) => r.message)).toContain("failed to fetch blog data")
    })
  })

  describe("handleFileUpload", () => {
    const file = () => new File(["x"], "cover.png", { type: "image/png" })

    it("uploads a cover image and stores the returned url on the post", async () => {
      mockPost.mockResolvedValue({ url: "https://cdn.test/cover.png" })
      const { result } = await renderReady()

      act(() => result.current.handleOpenCreatePost())
      await act(async () => {
        await result.current.handleFileUpload(file(), "cover")
      })

      expect(mockPost).toHaveBeenCalledWith("uploads/blog", {
        filename: "cover.png",
        data: "data:image/png;base64,AAA",
        contentType: "image/png",
      })
      expect(result.current.editingPost?.cover_image_url).toBe("https://cdn.test/cover.png")
    })

    it("clears the uploading flag after a successful upload", async () => {
      mockPost.mockResolvedValue({ url: "https://cdn.test/a.png" })
      const { result } = await renderReady()

      await act(async () => {
        await result.current.handleFileUpload(file(), "cover")
      })

      expect(result.current.uploadingImage).toBe(false)
    })

    it("logs, alerts and clears the flag when the upload fails", async () => {
      mockPost.mockRejectedValue(new Error("413 payload too large"))
      const { result } = await renderReady()

      await act(async () => {
        await result.current.handleFileUpload(file(), "cover")
      })

      expect(reported.map((r) => r.message)).toContain("image upload failed")
      expect(window.alert).toHaveBeenCalledWith("Failed to upload image. Please try again.")
      expect(result.current.uploadingImage).toBe(false)
    })

    it("does not set a cover url when the upload fails", async () => {
      mockPost.mockRejectedValue(new Error("nope"))
      const { result } = await renderReady()

      act(() => result.current.handleOpenCreatePost())
      await act(async () => {
        await result.current.handleFileUpload(file(), "cover")
      })

      expect(result.current.editingPost?.cover_image_url).toBeNull()
    })

    it("inserts inline images into the editor rather than setting the cover", async () => {
      mockPost.mockResolvedValue({ url: "https://cdn.test/inline.png" })
      const exec = jest.fn()
      document.execCommand = exec as unknown as typeof document.execCommand

      const { result } = await renderReady()
      act(() => result.current.handleOpenCreatePost())

      const el = document.createElement("div")
      el.focus = jest.fn()
      Object.defineProperty(result.current.editorRef, "current", { value: el, writable: true })

      await act(async () => {
        await result.current.handleFileUpload(file(), "inline")
      })

      expect(exec).toHaveBeenCalledWith("insertHTML", false, expect.stringContaining("https://cdn.test/inline.png"))
      expect(result.current.editingPost?.cover_image_url).toBeNull()
    })
  })

  describe("handleDeletePost", () => {
    it("deletes after confirmation and drops the post from the list", async () => {
      mockGet.mockResolvedValueOnce({ data: [post(), post({ id: "p-2" })] }).mockResolvedValueOnce({ data: [] })
      mockDelete.mockResolvedValue({})
      const { result } = await renderReady()

      await act(async () => {
        await result.current.handleDeletePost("p-1")
      })

      expect(mockDelete).toHaveBeenCalledWith("admin/blog/posts/p-1")
      expect(result.current.posts.map((p) => p.id)).toEqual(["p-2"])
    })

    it("does nothing when the confirmation is dismissed", async () => {
      jest.spyOn(window, "confirm").mockReturnValue(false)
      const { result } = await renderReady()

      await act(async () => {
        await result.current.handleDeletePost("p-1")
      })

      expect(mockDelete).not.toHaveBeenCalled()
    })

    it("logs and alerts when the delete fails, keeping the post", async () => {
      mockGet.mockResolvedValueOnce({ data: [post()] }).mockResolvedValueOnce({ data: [] })
      mockDelete.mockRejectedValue(new Error("409"))
      const { result } = await renderReady()

      await act(async () => {
        await result.current.handleDeletePost("p-1")
      })

      expect(reported.map((r) => r.message)).toContain("failed to delete post")
      expect(result.current.posts).toHaveLength(1)
    })
  })

  describe("handleSavePost", () => {
    it("refuses to save a post with no title", async () => {
      const { result } = await renderReady()
      act(() => result.current.handleOpenCreatePost())

      await act(async () => {
        await result.current.handleSavePost()
      })

      expect(window.alert).toHaveBeenCalledWith("Please enter a title.")
      expect(mockPost).not.toHaveBeenCalled()
    })

    it("creates a new post via POST when there is no id", async () => {
      mockPost.mockResolvedValue({ data: post({ id: "new-1" }) })
      const { result } = await renderReady()

      act(() => result.current.handleOpenCreatePost())
      act(() => result.current.setEditingPost((p) => ({ ...p, title: "Fresh" })))
      await act(async () => {
        await result.current.handleSavePost()
      })

      expect(mockPost).toHaveBeenCalledWith("admin/blog/posts", expect.objectContaining({ title: "Fresh" }))
      expect(result.current.posts[0].id).toBe("new-1")
    })

    it("updates an existing post via PUT", async () => {
      mockGet.mockResolvedValueOnce({ data: [post()] }).mockResolvedValueOnce({ data: [] })
      mockPut.mockResolvedValue({ data: post({ title: "Renamed" }) })
      const { result } = await renderReady()

      act(() => result.current.handleOpenEditPost(result.current.posts[0]))
      await act(async () => {
        await result.current.handleSavePost()
      })

      expect(mockPut).toHaveBeenCalledWith("admin/blog/posts/p-1", expect.any(Object))
      expect(result.current.posts[0].title).toBe("Renamed")
    })

    it("logs and keeps the editor open when the save fails", async () => {
      mockPut.mockRejectedValue(new Error("422"))
      mockGet.mockResolvedValueOnce({ data: [post()] }).mockResolvedValueOnce({ data: [] })
      const { result } = await renderReady()

      act(() => result.current.handleOpenEditPost(result.current.posts[0]))
      await act(async () => {
        await result.current.handleSavePost()
      })

      expect(reported.map((r) => r.message)).toContain("failed to save post")
      expect(result.current.isEditing).toBe(true)
    })
  })

  describe("tag editing", () => {
    it("adds a trimmed tag and clears the input", async () => {
      const { result } = await renderReady()
      act(() => result.current.handleOpenCreatePost())

      act(() => result.current.setTagInput("  logistics  "))
      act(() => result.current.handleAddTag())

      expect(result.current.editingPost?.tags).toContain("logistics")
      expect(result.current.tagInput).toBe("")
    })

    it("removes a tag", async () => {
      const { result } = await renderReady()
      act(() => result.current.handleOpenCreatePost())
      act(() => result.current.setTagInput("logistics"))
      act(() => result.current.handleAddTag())

      act(() => result.current.handleRemoveTag("logistics"))

      expect(result.current.editingPost?.tags).not.toContain("logistics")
    })

    it("ignores an empty tag", async () => {
      const { result } = await renderReady()
      act(() => result.current.handleOpenCreatePost())

      act(() => result.current.setTagInput("   "))
      act(() => result.current.handleAddTag())

      expect(result.current.editingPost?.tags).toEqual([])
    })
  })
})
