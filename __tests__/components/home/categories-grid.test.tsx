/**
 * Tests for CategoriesGrid (components/home/categories-grid.tsx).
 *
 * Presentational: categories and the slug->image lookup map come from the
 * caller. What matters is that each parent category renders as a link to
 * the shop filtered by that category, that sub-categories (categories with
 * a parent_id) are excluded, that the "services" category is always sorted
 * last, that the list is capped at 12 items, and that the image-resolution
 * fallback chain (explicit image_url -> slug lookup -> name-based lookup ->
 * keyword heuristics -> default) behaves as written.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import { CategoriesGrid } from "@/components/home/categories-grid"

// Use the real English strings so selectors match the copy users actually see.
jest.mock("@/lib/i18n/language-context", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { translations } = require("@/lib/i18n/translations")
  return {
    useLanguage: () => ({
      t: (key: string) => translations.en[key] ?? key,
      language: "en",
      setLanguage: jest.fn(),
    }),
  }
})

const categoryImages: Record<string, string> = {
  agriculture: "/images/agriculture.png",
  handicrafts: "/images/handicrafts.png",
  default: "/images/default.png",
}

const baseCategories = [
  { id: "1", name: "Agriculture", slug: "agriculture" },
  { id: "2", name: "Handicrafts", slug: "handicrafts" },
  { id: "3", name: "Services", slug: "services" },
]

describe("CategoriesGrid", () => {
  it("renders a link for each parent category", () => {
    render(<CategoriesGrid categories={baseCategories} categoryImages={categoryImages} />)

    expect(screen.getByRole("link", { name: /agriculture/i })).toHaveAttribute("href", "/shop?category=agriculture")
    expect(screen.getByRole("link", { name: /handicrafts/i })).toHaveAttribute("href", "/shop?category=handicrafts")
    expect(screen.getByRole("link", { name: /services/i })).toHaveAttribute("href", "/shop?category=services")
  })

  it("uses the translated category name when a translation key exists", () => {
    render(
      <CategoriesGrid
        categories={[{ id: "1", name: "Raw DB Name", slug: "agriculture" }]}
        categoryImages={categoryImages}
      />,
    )

    // category.agriculture -> "Agriculture" in the real English translations,
    // so the translated label wins over the raw DB name.
    expect(screen.getByText("Agriculture")).toBeInTheDocument()
    expect(screen.queryByText("Raw DB Name")).not.toBeInTheDocument()
  })

  it("falls back to the raw name when no translation key matches", () => {
    render(
      <CategoriesGrid
        categories={[{ id: "1", name: "Bespoke Widgets", slug: "not-a-real-slug" }]}
        categoryImages={categoryImages}
      />,
    )

    expect(screen.getByText("Bespoke Widgets")).toBeInTheDocument()
  })

  it("excludes sub-categories that have a parent_id", () => {
    render(
      <CategoriesGrid
        categories={[
          ...baseCategories,
          { id: "4", name: "Fruit", slug: "fruit", parent_id: "1" },
        ]}
        categoryImages={categoryImages}
      />,
    )

    expect(screen.queryByText("Fruit")).not.toBeInTheDocument()
    expect(screen.getAllByRole("link")).toHaveLength(3)
  })

  it("sorts the Services category to the end regardless of input order", () => {
    render(
      <CategoriesGrid
        categories={[
          { id: "3", name: "Services", slug: "services" },
          { id: "1", name: "Agriculture", slug: "agriculture" },
        ]}
        categoryImages={categoryImages}
      />,
    )

    const links = screen.getAllByRole("link")
    expect(links[links.length - 1]).toHaveAttribute("href", "/shop?category=services")
  })

  it("caps the rendered grid at 12 categories", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      id: String(i),
      name: `Category ${i}`,
      slug: `category-${i}`,
    }))

    render(<CategoriesGrid categories={many} categoryImages={categoryImages} />)

    expect(screen.getAllByRole("link")).toHaveLength(12)
  })

  it("renders nothing but an empty grid when there are no categories", () => {
    render(<CategoriesGrid categories={[]} categoryImages={categoryImages} />)

    expect(screen.queryAllByRole("link")).toHaveLength(0)
  })

  it("uses the explicit image_url over any lookup when present", () => {
    render(
      <CategoriesGrid
        categories={[{ id: "1", name: "Agriculture", slug: "agriculture", image_url: "/custom.png" }]}
        categoryImages={categoryImages}
      />,
    )

    expect(screen.getByRole("img")).toHaveAttribute("src", "/custom.png")
  })

  it("falls back to a keyword match on the category name when the slug has no direct image", () => {
    render(
      <CategoriesGrid
        categories={[{ id: "1", name: "Local Handicrafts & Crafts", slug: "unrelated-slug" }]}
        categoryImages={categoryImages}
      />,
    )

    expect(screen.getByRole("img")).toHaveAttribute("src", "/images/handicrafts.png")
  })

  it("falls back to the default image when nothing matches", () => {
    render(
      <CategoriesGrid
        categories={[{ id: "1", name: "Mystery Goods", slug: "mystery" }]}
        categoryImages={categoryImages}
      />,
    )

    expect(screen.getByRole("img")).toHaveAttribute("src", "/images/default.png")
  })

  it("falls back to the static placeholder image when no default image is configured either", () => {
    render(
      <CategoriesGrid categories={[{ id: "1", name: "Mystery Goods", slug: "mystery" }]} categoryImages={{}} />,
    )

    expect(screen.getByRole("img")).toHaveAttribute("src", "/abstract-categories.png")
  })
})
