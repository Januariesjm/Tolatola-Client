/** Marker HTML used by both map providers. */

import { driverMarkup, escapeHtml, pinMarkup } from "@/components/transporter/navigation-map-markers"

describe("escapeHtml", () => {
  it("escapes characters that would break out of the marker markup", () => {
    expect(escapeHtml(`<b>"Kariakoo" & 'co'</b>`)).toBe("&lt;b&gt;&quot;Kariakoo&quot; &amp; &#39;co&#39;&lt;/b&gt;")
  })
})

describe("pinMarkup", () => {
  it("renders a blue pickup pin with the escaped label", () => {
    const html = pinMarkup("pickup", "Shop <A>")
    expect(html).toContain("#0284c7")
    expect(html).toContain("Shop &lt;A&gt;")
    expect(html).toContain("M6 2 3 6v14")
  })

  it("renders a violet drop-off pin", () => {
    const html = pinMarkup("dropoff", "Customer")
    expect(html).toContain("#7c3aed")
    expect(html).toContain("Customer")
    expect(html).toContain("M9 22V12h6v10")
  })
})

describe("driverMarkup", () => {
  it("draws the heading arrow without a package badge", () => {
    const html = driverMarkup(false)
    expect(html).toContain('data-driver-arrow="true"')
    expect(html).not.toContain("data-package-badge")
  })

  it("adds the green badge once the package is on board", () => {
    const html = driverMarkup(true)
    expect(html).toContain('data-package-badge="true"')
    expect(html).toContain("#16a34a")
  })
})
