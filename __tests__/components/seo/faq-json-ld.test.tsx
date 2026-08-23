/**
 * Tests for FAQJsonLd (components/seo/faq-json-ld.tsx).
 *
 * Mirrors the BreadcrumbJsonLd suite: assert the rendered ld+json script
 * parses to a valid FAQPage schema whose mainEntity maps each { q, a } prop
 * to a Question / Answer pair in order, and that an empty list renders
 * nothing.
 */

import { render } from "@testing-library/react"
import { FAQJsonLd } from "@/components/seo/faq-json-ld"

function readSchema(container: HTMLElement) {
  const script = container.querySelector('script[type="application/ld+json"]')
  expect(script).not.toBeNull()
  return JSON.parse(script!.textContent || "")
}

describe("FAQJsonLd", () => {
  it("renders nothing when items is empty", () => {
    const { container } = render(<FAQJsonLd items={[]} />)
    expect(container.querySelector("script")).toBeNull()
  })

  it("renders nothing when items is undefined-ish (falsy length guard)", () => {
    // @ts-expect-error -- exercising the runtime guard for missing items
    const { container } = render(<FAQJsonLd items={undefined} />)
    expect(container.querySelector("script")).toBeNull()
  })

  it("renders an FAQPage schema with one Question per item, in order", () => {
    const { container } = render(
      <FAQJsonLd
        items={[
          { q: "How do I pay?", a: "M-Pesa or Tigo Pesa." },
          { q: "How do I track an order?", a: "Use your tracking code and phone number." },
        ]}
      />,
    )

    const schema = readSchema(container)

    expect(schema["@context"]).toBe("https://schema.org")
    expect(schema["@type"]).toBe("FAQPage")
    expect(schema.mainEntity).toHaveLength(2)
    expect(schema.mainEntity.map((e: { name: string }) => e.name)).toEqual(["How do I pay?", "How do I track an order?"])
  })

  it("nests each answer under acceptedAnswer with the Question/Answer types", () => {
    const { container } = render(<FAQJsonLd items={[{ q: "Is escrow supported?", a: "Yes, on every order." }]} />)

    const schema = readSchema(container)
    const [entry] = schema.mainEntity

    expect(entry["@type"]).toBe("Question")
    expect(entry.acceptedAnswer).toEqual({
      "@type": "Answer",
      text: "Yes, on every order.",
    })
  })
})
