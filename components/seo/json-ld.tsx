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
                "url": "https://tolatola.co"
            },
            {
                "@type": "SiteNavigationElement",
                "position": 2,
                "name": "Become a Vendor",
                "url": "https://tolatola.co/vendor/register"
            },
            {
                "@type": "SiteNavigationElement",
                "position": 3,
                "name": "Sign In",
                "url": "https://tolatola.co/auth/login"
            },
            {
                "@type": "SiteNavigationElement",
                "position": 4,
                "name": "Shop Page",
                "url": "https://tolatola.co/products"
            },
            {
                "@type": "SiteNavigationElement",
                "position": 5,
                "name": "Trending Products",
                "url": "https://tolatola.co/trending"
            },
            {
                "@type": "SiteNavigationElement",
                "position": 6,
                "name": "Support",
                "url": "https://tolatola.co/contact"
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
