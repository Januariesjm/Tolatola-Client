"use client"

import Image from "next/image"
import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t bg-gradient-to-b from-background to-muted/20 mt-auto">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left Section - Logo and Offices */}
          <div className="space-y-6">
            <div className="transition-transform hover:scale-105 duration-300">
              <Image src="/tolalogo.jpg" alt="TOLA" width={180} height={60} className="h-16 w-auto" />
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-foreground">Offices</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="group">
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">Dodoma HQ</p>
                  <a
                    href="tel:+255678227227"
                    className="hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    <span>📞</span> +255 678 227 227
                  </a>
                </div>
                <div className="group">
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                    Dar Es Salaam
                  </p>
                  <a
                    href="tel:+255625377978"
                    className="hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    <span>📞</span> +255 625 377 978
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-foreground">Company</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                  About us
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                  Our Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-foreground">Support</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/faq"
                  className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/return-policy"
                  className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                  Return Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                  Terms And Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/sitemap"
                  className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                  Site Map
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Media Icons */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} TOLA. All rights reserved.</p>

            <div className="flex items-center gap-4">
              <a
                href="https://facebook.com/tolamarketplace"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative"
                aria-label="Facebook"
              >
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-300 transform group-hover:scale-110">
                  <Facebook className="h-5 w-5" />
                </div>
              </a>

              <a
                href="https://twitter.com/tolamarketplace"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative"
                aria-label="Twitter/X"
              >
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-300 transform group-hover:scale-110">
                  <Twitter className="h-5 w-5" />
                </div>
              </a>

              <a
                href="https://tiktok.com/@tolamarketplace"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative"
                aria-label="TikTok"
              >
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-300 transform group-hover:scale-110">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                </div>
              </a>

              <a
                href="https://instagram.com/tolamarketplace"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative"
                aria-label="Instagram"
              >
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-300 transform group-hover:scale-110">
                  <Instagram className="h-5 w-5" />
                </div>
              </a>

              <a
                href="https://linkedin.com/company/tolamarketplace"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative"
                aria-label="LinkedIn"
              >
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-300 transform group-hover:scale-110">
                  <Linkedin className="h-5 w-5" />
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
