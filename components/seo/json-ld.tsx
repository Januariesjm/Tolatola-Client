import type React from "react"

export function JsonLd() {
    const websiteJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "TOLA Tanzania",
        "alternateName": ["TolaTola", "TOLA Digital Trade", "TOLA Digital Trade and Supply Chain Ecosystem"],
        "url": "https://tolatola.co",
        "description": "Tanzania's Digital Trade and Supply Chain Ecosystem. Registered with TRA, BRELA and TCRA. Buy from verified vendors, sell online, ship and pay with M-Pesa and Tigo Pesa. Secure escrow and nationwide logistics.",
        "inLanguage": ["en", "sw"],
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://tolatola.co/shop?search={search_term_string}"
            },
            "query-input": "required name=search_term_string"
        }
    }

    const organizationJsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "TOLA Tanzania",
        "alternateName": ["TolaTola", "TOLA Digital Trade", "DAN'G GROUP OF COMPANIES LIMITED"],
        "url": "https://tolatola.co",
        "logo": "https://tolatola.co/logo-new.png",
        "description": "Tanzania's Digital Trade and Supply Chain Ecosystem. Registered with TRA, BRELA and TCRA. Connect buyers, vendors and transporters with verified trade, secure payments (M-Pesa, Tigo Pesa) and integrated logistics.",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "P.O. Box 372",
            "addressLocality": "Kibaha",
            "addressRegion": "Pwani",
            "addressCountry": "TZ"
        },
        "sameAs": [
            "https://www.facebook.com/profile.php?id=61585501071622",
            "https://www.instagram.com/tola_tanzania/",
            "https://www.linkedin.com/in/faraja-dastan-mhalale-970821239/",
            "https://www.tiktok.com/@tolatola.inc"
        ],
        "contactPoint": [
            {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "telephone": "+255-678-227-227",
                "email": "support@tolatola.co",
                "areaServed": "TZ",
                "availableLanguage": ["English", "Swahili"],
                "url": "https://tolatola.co/contact",
                "name": "Dodoma HQ"
            },
            {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "telephone": "+255-625-377-978",
                "areaServed": "TZ",
                "url": "https://tolatola.co/contact",
                "name": "Dar Es Salaam"
            }
        ]
    }

    // Site navigation – helps Google understand structure and can support sitelinks
    const siteNavigationJsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": [
            { "@type": "SiteNavigationElement", "position": 1, "name": "Home", "description": "TOLA Tanzania – Digital Trade and Supply Chain Ecosystem. Registered with TRA, BRELA & TCRA.", "url": "https://tolatola.co" },
            { "@type": "SiteNavigationElement", "position": 2, "name": "Shop", "description": "Browse products from verified vendors. Secure checkout with M-Pesa & Tigo Pesa.", "url": "https://tolatola.co/shop" },
            { "@type": "SiteNavigationElement", "position": 3, "name": "Track Order", "description": "Track your delivery with tracking code and phone. View status and ETA.", "url": "https://tolatola.co/track" },
            { "@type": "SiteNavigationElement", "position": 4, "name": "Become a Vendor", "description": "Sell on TOLA. Verified sellers, secure payouts, integrated logistics.", "url": "https://tolatola.co/vendor/register" },
            { "@type": "SiteNavigationElement", "position": 5, "name": "Become a Transporter", "description": "Join TOLA logistics. Deliver across Tanzania and earn.", "url": "https://tolatola.co/transporter/register" },
            { "@type": "SiteNavigationElement", "position": 6, "name": "About Us", "description": "About TOLA – Tanzania's Digital Trade and Supply Chain Ecosystem.", "url": "https://tolatola.co/about" },
            { "@type": "SiteNavigationElement", "position": 7, "name": "Contact", "description": "Contact TOLA Tanzania – support and inquiries.", "url": "https://tolatola.co/contact" },
            { "@type": "SiteNavigationElement", "position": 8, "name": "FAQ", "description": "Frequently asked questions about TOLA Tanzania.", "url": "https://tolatola.co/faq" }
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
