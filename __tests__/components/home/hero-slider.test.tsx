/**
 * Tests for HeroSlider (components/home/hero-slider.tsx).
 *
 * The component owns: sorting promotions by display_order, auto-advancing
 * the visible slide on a timer, manual prev/next navigation, jumping to a
 * slide via its indicator dot, and building the CTA button(s) for a slide
 * from its button_text/button_link (pipe-delimited lists, a default when
 * absent, and a special-cased "SPECIAL_VENDOR_ACTIONS" link that renders
 * three fixed CTAs instead). It renders nothing when there are no
 * promotions, and hides the arrows/indicators entirely for a single slide.
 */

import React from "react"
import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HeroSlider } from "@/components/home/hero-slider"

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

function promo(overrides: Record<string, unknown> = {}) {
  return {
    id: "promo-1",
    title: "Big Sale",
    description: "Everything must go",
    image_url: "/promo1.jpg",
    background_color: "#123456",
    text_color: "#ffffff",
    button_text: "Shop Now",
    button_link: "/sale",
    display_order: 0,
    ...overrides,
  }
}

/** The wrapper div around a slide's content carries the visibility classes. */
function slideWrapperFor(title: string) {
  return screen.getByText(title).closest(".transition-all") as HTMLElement
}

describe("HeroSlider empty state", () => {
  it("renders nothing when there are no promotions", () => {
    const { container } = render(<HeroSlider promotions={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe("HeroSlider rendering", () => {
  it("renders the title and description of the current slide", () => {
    render(<HeroSlider promotions={[promo()]} />)

    expect(screen.getByText("Big Sale")).toBeInTheDocument()
    expect(screen.getByText("Everything must go")).toBeInTheDocument()
  })

  it("falls back to the translated default description when a slide has none", () => {
    render(<HeroSlider promotions={[promo({ description: null })]} />)

    expect(screen.getByText("Connect with local vendors, shop securely, and get fast delivery across Tanzania")).toBeInTheDocument()
  })

  it("renders a placeholder block instead of an image when image_url is missing", () => {
    render(<HeroSlider promotions={[promo({ image_url: null })]} />)

    expect(screen.queryByRole("img")).not.toBeInTheDocument()
  })

  it("renders the promotion image when image_url is present", () => {
    render(<HeroSlider promotions={[promo({ image_url: "/promo1.jpg" })]} />)

    expect(screen.getByRole("img")).toHaveAttribute("src", "/promo1.jpg")
  })

  it("sorts slides by display_order regardless of input order", () => {
    render(
      <HeroSlider
        promotions={[promo({ id: "b", title: "Second", display_order: 2 }), promo({ id: "a", title: "First", display_order: 1 })]}
      />,
    )

    // The lowest display_order slide should be the initially visible one.
    expect(slideWrapperFor("First")).toHaveClass("opacity-100")
    expect(slideWrapperFor("Second")).toHaveClass("opacity-0")
  })

  it("does not render arrows or indicators for a single slide", () => {
    render(<HeroSlider promotions={[promo()]} />)

    expect(screen.queryByLabelText("Previous slide")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Next slide")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Go to slide 1")).not.toBeInTheDocument()
  })

  it("renders arrows and one indicator per slide when there is more than one", () => {
    render(
      <HeroSlider
        promotions={[
          promo({ id: "a", title: "First", display_order: 0 }),
          promo({ id: "b", title: "Second", display_order: 1 }),
          promo({ id: "c", title: "Third", display_order: 2 }),
        ]}
      />,
    )

    expect(screen.getByLabelText("Previous slide")).toBeInTheDocument()
    expect(screen.getByLabelText("Next slide")).toBeInTheDocument()
    expect(screen.getByLabelText("Go to slide 1")).toBeInTheDocument()
    expect(screen.getByLabelText("Go to slide 2")).toBeInTheDocument()
    expect(screen.getByLabelText("Go to slide 3")).toBeInTheDocument()
  })
})

describe("HeroSlider navigation", () => {
  const threeSlides = [
    promo({ id: "a", title: "First", display_order: 0 }),
    promo({ id: "b", title: "Second", display_order: 1 }),
    promo({ id: "c", title: "Third", display_order: 2 }),
  ]

  it("advances to the next slide when the next arrow is clicked", async () => {
    const user = userEvent.setup()
    render(<HeroSlider promotions={threeSlides} />)

    expect(slideWrapperFor("First")).toHaveClass("opacity-100")

    await user.click(screen.getByLabelText("Next slide"))

    expect(slideWrapperFor("Second")).toHaveClass("opacity-100")
    expect(slideWrapperFor("First")).toHaveClass("opacity-0")
  })

  it("wraps around to the first slide when next is clicked from the last slide", async () => {
    const user = userEvent.setup()
    render(<HeroSlider promotions={threeSlides} />)

    await user.click(screen.getByLabelText("Next slide"))
    await user.click(screen.getByLabelText("Next slide"))
    expect(slideWrapperFor("Third")).toHaveClass("opacity-100")

    await user.click(screen.getByLabelText("Next slide"))
    expect(slideWrapperFor("First")).toHaveClass("opacity-100")
  })

  it("goes to the previous slide, wrapping to the last slide from the first", async () => {
    const user = userEvent.setup()
    render(<HeroSlider promotions={threeSlides} />)

    await user.click(screen.getByLabelText("Previous slide"))

    expect(slideWrapperFor("Third")).toHaveClass("opacity-100")
  })

  it("jumps directly to a slide when its indicator is clicked", async () => {
    const user = userEvent.setup()
    render(<HeroSlider promotions={threeSlides} />)

    await user.click(screen.getByLabelText("Go to slide 3"))

    expect(slideWrapperFor("Third")).toHaveClass("opacity-100")
  })
})

describe("HeroSlider auto-rotation", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("automatically advances to the next slide after 12 seconds", () => {
    render(
      <HeroSlider
        promotions={[promo({ id: "a", title: "First", display_order: 0 }), promo({ id: "b", title: "Second", display_order: 1 })]}
      />,
    )

    expect(slideWrapperFor("First")).toHaveClass("opacity-100")

    act(() => {
      jest.advanceTimersByTime(12000)
    })

    expect(slideWrapperFor("Second")).toHaveClass("opacity-100")
  })

  it("keeps advancing on every subsequent interval, wrapping around", () => {
    render(
      <HeroSlider
        promotions={[promo({ id: "a", title: "First", display_order: 0 }), promo({ id: "b", title: "Second", display_order: 1 })]}
      />,
    )

    act(() => {
      jest.advanceTimersByTime(12000)
    })
    expect(slideWrapperFor("Second")).toHaveClass("opacity-100")

    act(() => {
      jest.advanceTimersByTime(12000)
    })
    expect(slideWrapperFor("First")).toHaveClass("opacity-100")
  })

  it("does not set up an auto-rotate interval for a single slide", () => {
    render(<HeroSlider promotions={[promo({ title: "Only" })]} />)

    act(() => {
      jest.advanceTimersByTime(60000)
    })

    // Still the only slide, and nothing should have thrown from an interval
    // ticking against an out-of-range index.
    expect(slideWrapperFor("Only")).toHaveClass("opacity-100")
  })
})

describe("HeroSlider call-to-action buttons", () => {
  it("renders a single default 'Start Shopping' link to /shop when no button fields are given", () => {
    render(<HeroSlider promotions={[promo({ button_text: undefined, button_link: undefined })]} />)

    const link = screen.getByRole("link", { name: "Start Shopping" })
    expect(link).toHaveAttribute("href", "/shop")
  })

  it("renders one link per pipe-delimited label/link pair", () => {
    render(
      <HeroSlider
        promotions={[
          promo({
            button_text: "Shop Now | Learn More",
            button_link: "/shop | /about",
          }),
        ]}
      />,
    )

    expect(screen.getByRole("link", { name: "Shop Now" })).toHaveAttribute("href", "/shop")
    expect(screen.getByRole("link", { name: "Learn More" })).toHaveAttribute("href", "/about")
  })

  it("reuses the first link for extra labels when there are fewer links than labels", () => {
    render(
      <HeroSlider
        promotions={[
          promo({
            button_text: "Shop Now | Learn More",
            button_link: "/only-link",
          }),
        ]}
      />,
    )

    expect(screen.getByRole("link", { name: "Shop Now" })).toHaveAttribute("href", "/only-link")
    expect(screen.getByRole("link", { name: "Learn More" })).toHaveAttribute("href", "/only-link")
  })

  it("renders the three special vendor CTAs when button_link is SPECIAL_VENDOR_ACTIONS", () => {
    render(<HeroSlider promotions={[promo({ button_link: "SPECIAL_VENDOR_ACTIONS" })]} />)

    expect(screen.getByRole("link", { name: /start shopping/i })).toHaveAttribute("href", "/shop")
    expect(screen.getByRole("link", { name: /become seller/i })).toHaveAttribute("href", "/auth/sign-up?userType=vendor")
    expect(screen.getByRole("link", { name: /become transporter/i })).toHaveAttribute("href", "/auth/sign-up?userType=transporter")
  })
})
