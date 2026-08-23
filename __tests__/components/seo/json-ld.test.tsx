/**
 * Tests for JsonLd (components/seo/json-ld.tsx).
 *
 * Renders three static ld+json <script> tags -- WebSite, Organization and a
 * site-navigation ItemList. There are no props to vary, so what's worth
 * asserting is that all three scripts are present, each parses as JSON, and
 * each carries the schema.org type and identifying fields a crawler actually
 * reads (site name/url/search action, org name/logo/contact points,
 * navigation entries with sequential positions).
 */

import { render } from "@testing-library/react"
import { JsonLd } from "@/components/seo/json-ld"

/** Parses every ld+json script tag's textContent, in document order. */
function readSchemas(container: HTMLElement) {
  const scripts = Array.from(container.querySelectorAll('script[type="application/ld+json"]'))
  return scripts.map((s) => JSON.parse(s.textContent || ""))
}

describe("JsonLd", () => {
  it("renders exactly three ld+json script tags, each valid JSON", () => {
    const { container } = render(<JsonLd />)

    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts).toHaveLength(3)

    const schemas = readSchemas(container)
    expect(schemas).toHaveLength(3)
    schemas.forEach((schema) => expect(schema["@context"]).toBe("https://schema.org"))
  })

  it("includes a WebSite schema with the site identity and a search action", () => {
    const { container } = render(<JsonLd />)
    const [website] = readSchemas(container)

    expect(website["@type"]).toBe("WebSite")
    expect(website.name).toBe("TOLA Tanzania")
    expect(website.url).toBe("https://tolatola.co")
    expect(website.alternateName).toContain("TolaTola")
    expect(website.potentialAction["@type"]).toBe("SearchAction")
    expect(website.potentialAction.target.urlTemplate).toBe("https://tolatola.co/shop?search={search_term_string}")
  })

  it("includes an Organization schema with logo, address and both contact points", () => {
    const { container } = render(<JsonLd />)
    const [, organization] = readSchemas(container)

    expect(organization["@type"]).toBe("Organization")
    expect(organization.name).toBe("TOLA Tanzania")
    expect(organization.logo).toBe("https://tolatola.co/logo-new.png")
    expect(organization.address).toEqual(
      expect.objectContaining({
        "@type": "PostalAddress",
        addressCountry: "TZ",
      }),
    )
    expect(organization.contactPoint).toHaveLength(2)
    organization.contactPoint.forEach((cp: { "@type": string; contactType: string }) => {
      expect(cp["@type"]).toBe("ContactPoint")
      expect(cp.contactType).toBe("customer service")
    })
  })

  it("includes a site-navigation ItemList with sequential, 1-based positions", () => {
    const { container } = render(<JsonLd />)
    const [, , navigation] = readSchemas(container)

    expect(navigation["@type"]).toBe("ItemList")
    expect(Array.isArray(navigation.itemListElement)).toBe(true)
    expect(navigation.itemListElement.length).toBeGreaterThan(0)

    navigation.itemListElement.forEach((entry: { "@type": string }) => {
      expect(entry["@type"]).toBe("SiteNavigationElement")
    })
    expect(navigation.itemListElement.map((e: { position: number }) => e.position)).toEqual(
      navigation.itemListElement.map((_: unknown, i: number) => i + 1),
    )

    const home = navigation.itemListElement[0]
    expect(home.name).toBe("Home")
    expect(home.url).toBe("https://tolatola.co")
  })
})
