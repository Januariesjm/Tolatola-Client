import type React from "react"

export function JsonLd() {
    const websiteJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "TOLA",
        "url": "https://tolatola.co",
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://tolatola.co/products?search={search_term_string}",
            "query-input": "required name=search_term_string"
        }
    }

    const organizationJsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "TOLA",
        "url": "https://tolatola.co",
        "logo": "https://tolatola.co/tolalogo.jpg",
        "sameAs": [
            // Add social media links here if available
            "https://facebook.com/tolatola",
            "https://instagram.com/tolatola",
            "https://twitter.com/tolatola"
        ],
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+255-XXX-XXXXXX",
            "contactType": "customer service",
            "areaServed": "TZ",
            "availableLanguage": ["English", "Swahili"]
        }
    }

    // Sitelinks Searchbox and Site Navigation
    const siteNavigationJsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": [
            {
                "@type": "SiteNavigationElement",
                "position": 1,
                "name": "Home Page",
                "description": "TOLA - Tanzania's Premier Trade Ecosystem",
                "url": "https://tolatola.co"
            },
            {
                "@type": "SiteNavigationElement",
                "position": 2,
                "name": "Start Shopping",
                "description": "Browse products from verified vendors across Tanzania",
                "url": "https://tolatola.co/shop"
            },
            {
                "@type": "SiteNavigationElement",
                "position": 3,
                "name": "Become a Vendor",
                "description": "Join 500+ verified merchants and grow your business",
                "url": "https://tolatola.co/vendor/register"
            },
            {
                "@type": "SiteNavigationElement",
                "position": 4,
                "name": "Become a Transporter",
                "description": "Join our logistics network and earn with deliveries",
                "url": "https://tolatola.co/transporter/register"
            },
            {
                "@type": "SiteNavigationElement",
                "position": 5,
                "name": "Sign In",
                "description": "Access your TOLA account",
                "url": "https://tolatola.co/auth/sign-in"
            },
            {
                "@type": "SiteNavigationElement",
                "position": 6,
                "name": "Sign Up",
                "description": "Create your TOLA account",
                "url": "https://tolatola.co/auth/sign-up"
            },
            {
                "@type": "SiteNavigationElement",
                "position": 7,
                "name": "About Us",
                "description": "Learn about TOLA's mission and vision",
                "url": "https://tolatola.co/about"
            },
            {
                "@type": "SiteNavigationElement",
                "position": 8,
                "name": "Contact",
                "description": "Get in touch with our support team",
                "url": "https://tolatola.co/contact"
            },
            {
                "@type": "SiteNavigationElement",
                "position": 9,
                "name": "FAQ",
                "description": "Frequently asked questions",
                "url": "https://tolatola.co/faq"
            }
        ]
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavigationJsonLd) }}
            />
        </>
    )
}
