import type { BlogEditorState } from "@/hooks/use-blog-editor"
import type { BlogPost } from "@/hooks/use-blog-editor"

/**
 * What the blog panels render from: the editor hook's state plus the two
 * view-only helpers the tab owns.
 *
 * Passed as one prop so the markup could be split without rewriting it or
 * threading two dozen individual props.
 */
export interface BlogViewModel extends BlogEditorState {
  /** Rich-text toolbar action, scoped to the contenteditable area. */
  execCommand: (command: string, value?: string) => void
  insertLink: () => void
  /** Posts after the search box and status filter are applied. */
  filteredPosts: BlogPost[]
}
