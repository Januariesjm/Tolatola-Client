/**
 * Tests for BreadcrumbJsonLd (components/seo/breadcrumb-json-ld.tsx).
 *
 * The component renders a single <script type="application/ld+json"> tag
 * whose textContent is a JSON.stringify'd BreadcrumbList schema. What matters
 * is that the emitted markup actually parses as JSON, that positions are
 * 1-based and follow prop order, that relative URLs are qualified against the
 * site origin while absolute URLs pass through untouched, and that an empty
 * item list renders nothing at all.
 */

import { render } from "@testing-library/react"
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld"

/** Reads back the single ld+json script's parsed content. */
function readSchema(container: HTMLElement) {
  const script = container.querySelector('script[type="application/ld+json"]')
  expect(script).not.toBeNull()
  return JSON.parse(script!.textContent || "")
}

describe("BreadcrumbJsonLd", () => {
  it("renders nothing when items is empty", () => {
    const { container } = render(<BreadcrumbJsonLd items={[]} />)
    expect(container.querySelector("script")).toBeNull()
  })

  it("renders nothing when items is undefined-ish (falsy length guard)", () => {
    // @ts-expect-error -- exercising the runtime guard for missing items
    const { container } = render(<BreadcrumbJsonLd items={undefined} />)
    expect(container.querySelector("script")).toBeNull()
  })

  it("renders a BreadcrumbList schema with 1-based positions in prop order", () => {
    const { container } = render(
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Shop", url: "/shop" },
          { name: "Electronics", url: "/shop?category=electronics" },
        ]}
      />,
    )

    const schema = readSchema(container)

    expect(schema["@context"]).toBe("https://schema.org")
    expect(schema["@type"]).toBe("BreadcrumbList")
    expect(schema.itemListElement).toHaveLength(3)
    expect(schema.itemListElement.map((i: { position: number }) => i.position)).toEqual([1, 2, 3])
    expect(schema.itemListElement.map((i: { name: string }) => i.name)).toEqual(["Home", "Shop", "Electronics"])
    schema.itemListElement.forEach((entry: { "@type": string }) => {
      expect(entry["@type"]).toBe("ListItem")
    })
  })

  it("qualifies a relative url against the tolatola.co origin", () => {
    const { container } = render(<BreadcrumbJsonLd items={[{ name: "Shop", url: "/shop" }]} />)

    const schema = readSchema(container)

    expect(schema.itemListElement[0].item).toBe("https://tolatola.co/shop")
  })

  it("leaves an absolute http(s) url untouched", () => {
    const { container } = render(<BreadcrumbJsonLd items={[{ name: "External", url: "https://example.com/page" }]} />)

    const schema = readSchema(container)

    expect(schema.itemListElement[0].item).toBe("https://example.com/page")
  })
})
