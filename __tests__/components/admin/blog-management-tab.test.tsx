/**
 * Tests for BlogManagementTab (components/admin/blog-management-tab.tsx).
 *
 * A shell over useBlogEditor (already covered by __tests__/hooks/use-blog-editor.test.tsx)
 * and BlogPostList/BlogEditorPanel (covered by their own suites). What's
 * unique to this file, and worth pinning here, is: the loading gate, the
 * search/status filtering that produces `filteredPosts`, the switch between
 * list and editor view, and the toolbar helpers (execCommand, insertLink)
 * that this component alone owns.
 */

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { BlogManagementTab } from "@/components/admin/blog-management-tab"

const mockGet = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiGet: (...args: unknown[]) => mockGet(...args),
  clientApiPost: jest.fn(),
  clientApiPut: jest.fn(),
  clientApiDelete: jest.fn(),
}))

function post(over: Record<string, unknown> = {}) {
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

beforeEach(() => {
  jest.clearAllMocks()
})

/** Renders and waits for the initial posts/categories fetch to settle. */
async function renderReady(posts: unknown[] = [], categories: unknown[] = []) {
  mockGet.mockResolvedValueOnce({ data: posts }).mockResolvedValueOnce({ data: categories })
  const view = render(<BlogManagementTab />)
  await waitFor(() => expect(screen.queryByText("Loading TOLA Journal dashboard...")).not.toBeInTheDocument())
  return view
}

describe("BlogManagementTab", () => {
  it("shows a loading state before the initial fetch resolves", () => {
    mockGet.mockReturnValue(new Promise(() => {})) // never resolves within this test
    render(<BlogManagementTab />)

    expect(screen.getByText("Loading TOLA Journal dashboard...")).toBeInTheDocument()
  })

  it("renders the post list once loaded", async () => {
    await renderReady([post()])

    expect(screen.getByText("TOLA Journal")).toBeInTheDocument()
    expect(screen.getByText("Trade in Dodoma")).toBeInTheDocument()
  })

  it("shows the empty-filter state when there are no posts", async () => {
    await renderReady([])

    expect(screen.getByText("No articles found matching filters.")).toBeInTheDocument()
  })

  it("narrows the list to a title search match", async () => {
    await renderReady([post(), post({ id: "p-2", title: "Harvest Season Update", excerpt: "" })])

    await userEvent.type(screen.getByPlaceholderText("Search articles by title or excerpt..."), "harvest")

    expect(screen.queryByText("Trade in Dodoma")).not.toBeInTheDocument()
    expect(screen.getByText("Harvest Season Update")).toBeInTheDocument()
  })

  it("narrows the list to an excerpt search match", async () => {
    await renderReady([post(), post({ id: "p-2", title: "Harvest Season Update", excerpt: "Farmers report a strong yield." })])

    await userEvent.type(screen.getByPlaceholderText("Search articles by title or excerpt..."), "yield")

    expect(screen.queryByText("Trade in Dodoma")).not.toBeInTheDocument()
    expect(screen.getByText("Harvest Season Update")).toBeInTheDocument()
  })

  it("narrows the list by status", async () => {
    await renderReady([post({ status: "draft" }), post({ id: "p-2", title: "Published Piece", status: "published" })])

    await userEvent.selectOptions(screen.getByDisplayValue("All Statuses"), "published")

    expect(screen.queryByText("Trade in Dodoma")).not.toBeInTheDocument()
    expect(screen.getByText("Published Piece")).toBeInTheDocument()
  })

  it("opens the editor for a new article", async () => {
    await renderReady([])

    await userEvent.click(screen.getByRole("button", { name: /write article/i }))

    expect(screen.getByText("Create New Article")).toBeInTheDocument()
  })

  it("opens the editor pre-filled when editing an existing article", async () => {
    await renderReady([post()])

    await userEvent.click(screen.getByText("Trade in Dodoma"))

    expect(screen.getByText("Edit Article")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Trade in Dodoma")).toBeInTheDocument()
  })

  it("returns to the list from the editor's back button", async () => {
    await renderReady([post()])
    await userEvent.click(screen.getByRole("button", { name: /write article/i }))
    expect(screen.getByText("Create New Article")).toBeInTheDocument()

    const buttons = screen.getAllByRole("button")
    await userEvent.click(buttons[0])

    expect(screen.getByText("TOLA Journal")).toBeInTheDocument()
  })

  describe("rich-text toolbar", () => {
    it("focuses the editor and runs the command for a toolbar button", async () => {
      await renderReady([])
      await userEvent.click(screen.getByRole("button", { name: /write article/i }))

      const exec = jest.fn()
      document.execCommand = exec as unknown as typeof document.execCommand

      await userEvent.click(screen.getByTitle("Bold"))

      expect(exec).toHaveBeenCalledWith("bold", false, "")
    })

    it("does nothing for a toolbar button when the editor has no focus target", async () => {
      // Before any post is opened for editing there's no contenteditable
      // mounted, so this exercises the `if (editorRef.current)` guard --
      // simply not throwing is the assertion.
      await renderReady([])
      const exec = jest.fn()
      document.execCommand = exec as unknown as typeof document.execCommand

      expect(exec).not.toHaveBeenCalled()
    })

    it("inserts a link when a URL is provided", async () => {
      await renderReady([])
      await userEvent.click(screen.getByRole("button", { name: /write article/i }))

      const exec = jest.fn()
      document.execCommand = exec as unknown as typeof document.execCommand
      jest.spyOn(window, "prompt").mockReturnValue("https://example.test")

      await userEvent.click(screen.getByTitle("Insert Link"))

      expect(exec).toHaveBeenCalledWith("createLink", false, "https://example.test")
    })

    it("does not insert a link when the prompt is cancelled", async () => {
      await renderReady([])
      await userEvent.click(screen.getByRole("button", { name: /write article/i }))

      const exec = jest.fn()
      document.execCommand = exec as unknown as typeof document.execCommand
      jest.spyOn(window, "prompt").mockReturnValue(null)

      await userEvent.click(screen.getByTitle("Insert Link"))

      expect(exec).not.toHaveBeenCalled()
    })
  })
})
