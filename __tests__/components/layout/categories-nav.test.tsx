import React from "react"
import { render, screen, within } from "@testing-library/react"
import { CategoriesNav } from "@/components/layout/categories-nav"

/**
 * Tests for components/layout/categories-nav.tsx.
 *
 * Presentational, driven entirely by the `categories` and `currentCategory`
 * props: it renders an "All" tile plus one tile per parent category (rows
 * with a `parent_id` are sub-categories and are excluded from the top-level
 * list), highlights whichever one matches `currentCategory` (or "All" when
 * none is set), always sorts "services" to the end, caps the row at 12
 * tiles, and shows a hover dropdown of sub-categories for any parent that
 * has them.
 */

// Use the real English strings so category names read the way users see them.
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

function category(overrides: Record<string, unknown> = {}) {
  return {
    id: "1",
    name: "Agriculture",
    slug: "agriculture",
    description: null,
    ...overrides,
  }
}

describe("CategoriesNav top-level tiles", () => {
  it("always renders an All Categories tile linking to the unfiltered shop", () => {
    render(<CategoriesNav categories={[]} currentCategory={null} />)

    expect(screen.getByRole("link", { name: /all/i })).toHaveAttribute("href", "/shop")
  })

  it("renders a tile for each parent category with the translated name and correct link", () => {
    render(
      <CategoriesNav
        categories={[
          category({ id: "1", name: "Raw DB Name", slug: "agriculture" }),
          category({ id: "2", name: "Handicrafts", slug: "handicrafts" }),
        ]}
        currentCategory={null}
      />,
    )

    // category.agriculture -> "Agriculture" in the real English translations,
    // so the translated label wins over the raw DB name.
    expect(screen.getByText("Agriculture")).toBeInTheDocument()
    expect(screen.queryByText("Raw DB Name")).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: /handicrafts/i })).toHaveAttribute("href", "/shop?category=handicrafts")
  })

  it("falls back to the raw name when no translation key matches the slug", () => {
    render(<CategoriesNav categories={[category({ name: "Bespoke Widgets", slug: "not-a-real-slug" })]} currentCategory={null} />)

    expect(screen.getByText("Bespoke Widgets")).toBeInTheDocument()
  })

  it("excludes sub-categories (rows with a parent_id) from the top-level row", () => {
    // parent_id "999" matches no category in this list, so "Fruit" is neither
    // a top-level tile nor listed under anyone else's subcategory dropdown --
    // isolating the exclusion from the (separately tested) dropdown behavior.
    render(
      <CategoriesNav
        categories={[category(), category({ id: "2", name: "Fruit", slug: "fruit", parent_id: "999" })]}
        currentCategory={null}
      />,
    )

    expect(screen.queryByRole("link", { name: /fruit/i })).not.toBeInTheDocument()
  })

  it("always sorts the services category to the end, regardless of input order", () => {
    render(
      <CategoriesNav
        categories={[
          category({ id: "2", name: "Services", slug: "services" }),
          category({ id: "1", name: "Agriculture", slug: "agriculture" }),
        ]}
        currentCategory={null}
      />,
    )

    const links = screen.getAllByRole("link")
    expect(links[links.length - 1]).toHaveAttribute("href", "/shop?category=services")
  })

  it("caps the row at 12 parent categories", () => {
    const many = Array.from({ length: 20 }, (_, i) => category({ id: String(i), name: `Category ${i}`, slug: `category-${i}` }))
    render(<CategoriesNav categories={many} currentCategory={null} />)

    // +1 for the always-present "All" tile.
    expect(screen.getAllByRole("link")).toHaveLength(13)
  })
})

describe("CategoriesNav active state", () => {
  it("highlights the All tile when no category is selected", () => {
    render(<CategoriesNav categories={[category()]} currentCategory={null} />)

    const allLink = screen.getByRole("link", { name: /all/i })
    expect(allLink.querySelector("div")).toHaveClass("bg-primary")
  })

  it("does not highlight the All tile once a category is selected", () => {
    render(<CategoriesNav categories={[category()]} currentCategory="agriculture" />)

    const allLink = screen.getByRole("link", { name: /all/i })
    expect(allLink.querySelector("div")).not.toHaveClass("bg-primary")
  })

  it("highlights the matching category tile when currentCategory is set", () => {
    render(
      <CategoriesNav
        categories={[category({ id: "1", slug: "agriculture" }), category({ id: "2", name: "Handicrafts", slug: "handicrafts" })]}
        currentCategory="agriculture"
      />,
    )

    const activeLink = screen.getByRole("link", { name: /agriculture/i })
    const inactiveLink = screen.getByRole("link", { name: /handicrafts/i })

    expect(activeLink.querySelector("div")).toHaveClass("ring-primary")
    expect(inactiveLink.querySelector("div")).not.toHaveClass("ring-primary")
  })
})

describe("CategoriesNav subcategory dropdown", () => {
  it("does not render a dropdown for a category with no subcategories", () => {
    render(<CategoriesNav categories={[category()]} currentCategory={null} />)

    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument()
  })

  it("lists subcategories, with a count badge, for a category that has them", () => {
    render(
      <CategoriesNav
        categories={[
          category({ id: "1", name: "Agriculture", slug: "agriculture" }),
          category({ id: "2", name: "Crops", slug: "crops", parent_id: "1" }),
          category({ id: "3", name: "Livestock", slug: "livestock", parent_id: "1" }),
        ]}
        currentCategory={null}
      />,
    )

    expect(screen.getByText("2")).toBeInTheDocument() // subcategory count badge
    expect(screen.getByRole("link", { name: /crops/i })).toHaveAttribute("href", "/shop?category=crops")
    expect(screen.getByRole("link", { name: /livestock/i })).toHaveAttribute("href", "/shop?category=livestock")
  })

  it("scopes subcategories to their own parent", () => {
    render(
      <CategoriesNav
        categories={[
          category({ id: "1", name: "Agriculture", slug: "agriculture" }),
          category({ id: "2", name: "Handicrafts", slug: "handicrafts" }),
          category({ id: "3", name: "Crops", slug: "crops", parent_id: "1" }),
        ]}
        currentCategory={null}
      />,
    )

    const handicraftsTile = screen.getByRole("link", { name: /handicrafts/i }).closest("div.relative") as HTMLElement
    expect(within(handicraftsTile).queryByText("Crops")).not.toBeInTheDocument()
  })
})
