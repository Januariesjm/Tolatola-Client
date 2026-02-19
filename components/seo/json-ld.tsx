import type React from "react"

export function JsonLd() {
    const websiteJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "TOLA Tanzania",
        "alternateName": ["TolaTola", "TOLA Digital Trade"],
        "url": "https://tolatola.co",
        "description": "Tanzania's online marketplace. Shop from verified vendors, sell online, ecommerce with M-Pesa and Tigo Pesa. Secure escrow, logistics, best prices.",
        "inLanguage": ["en", "sw"],
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://tolatola.co/shop?search={search_term_string}",
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
        "description": "Tanzania's online marketplace and ecommerce platform. Connect with verified vendors, buy and sell online, secure payments with M-Pesa and Tigo Pesa.",
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

    // Sitelinks Searchbox and Site Navigation
    const siteNavigationJsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": [
            {
                "@type": "SiteNavigationElement",
                "position": 1,
                "name": "Home",
                "description": "TOLA Tanzania - Online marketplace and ecommerce for Tanzania",
                "url": "https://tolatola.co"
            },
            {
                "@type": "SiteNavigationElement",
                "position": 2,
                "name": "Shop",
                "description": "Online shopping from verified vendors in Tanzania. Best prices, secure checkout.",
                "url": "https://tolatola.co/shop"
            },
            {
                "@type": "SiteNavigationElement",
                "position": 3,
                "name": "Become a Vendor",
                "description": "Sell on TOLA - Join Tanzania's marketplace for vendors. Verified sellers, secure payouts.",
                "url": "https://tolatola.co/vendor/register"
            },
            {
                "@type": "SiteNavigationElement",
                "position": 4,
                "name": "Become a Transporter",
                "description": "Join TOLA logistics. Deliver for Tanzania's online marketplace and earn.",
                "url": "https://tolatola.co/transporter/register"
            },
            {
                "@type": "SiteNavigationElement",
                "position": 5,
                "name": "Sign In",
                "description": "Log in to your TOLA Tanzania account",
                "url": "https://tolatola.co/auth/login"
            },
            {
                "@type": "SiteNavigationElement",
                "position": 6,
                "name": "Sign Up",
                "description": "Create your TOLA account - buyers, vendors, transporters",
                "url": "https://tolatola.co/auth/sign-up"
            },
            {
                "@type": "SiteNavigationElement",
                "position": 7,
                "name": "About Us",
                "description": "About TOLA - Tanzania's online marketplace and ecommerce platform",
                "url": "https://tolatola.co/about"
            },
            {
                "@type": "SiteNavigationElement",
                "position": 8,
                "name": "Contact",
                "description": "Contact TOLA Tanzania - customer support and inquiries",
                "url": "https://tolatola.co/contact"
            },
            {
                "@type": "SiteNavigationElement",
                "position": 9,
                "name": "FAQ",
                "description": "Frequently asked questions about shopping and selling on TOLA Tanzania",
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
