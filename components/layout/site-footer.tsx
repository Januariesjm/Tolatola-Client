"use client"

import Image from "next/image"
import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin, ShieldCheck, CreditCard, Lock, Globe, ArrowRight, Mail, Phone, MapPin } from "lucide-react"

export function SiteFooter() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    company: [
      { name: "About us", href: "/about" },
      { name: "Meet the Founder", href: "/founder" },
      { name: "Careers", href: "/careers" },
      { name: "Our Blog", href: "/blog" },

      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms & Conditions", href: "/terms" },
      { name: "Vendor SLA", href: "/legal/sla-vendor" },
      { name: "Transporter SLA", href: "/legal/sla-transporter" },
      { name: "Agent Portal", href: "/agent/login" },
    ],
    support: [
      { name: "Track Order", href: "/track" },
      { name: "Market Survey", href: "/validation" },
      { name: "FAQ", href: "/faq" },
      { name: "Account Deletion Request", href: "/account-deletion-request" },
      { name: "Contact Us", href: "/contact" },
      { name: "Return Policy", href: "/return-policy" },
      { name: "Site Map", href: "/sitemap" },
    ],
    offices: [
      { name: "Mikocheni Dar Es Salaam HQ", phone: "+255 678 227 227", icon: MapPin },
      { name: "Kibaha Pwani Main Branch", phone: "+255 625 377 978", icon: Globe },
    ]
  }

  return (
    <footer className="bg-gradient-to-br from-teal-900 via-cyan-900 to-teal-950 text-cyan-100 mt-auto selection:bg-white selection:text-teal-900">
      {/* Trust & Security Segment */}
      <div className="border-b border-teal-800/50">
        <div className="container mx-auto px-4 py-4 sm:py-8">
          <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-1 sm:pb-0 sm:grid sm:grid-cols-3">
            <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-teal-800/20 border border-cyan-700/30 group hover:border-white/40 transition-all duration-500 min-w-[260px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform flex-shrink-0">
                <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h4 className="text-white font-black text-[10px] sm:text-xs uppercase tracking-widest">Buyer Protection</h4>
                <p className="text-[9px] sm:text-[10px] mt-0.5 sm:mt-1 font-medium">Safe & Insured Transactions</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-teal-800/20 border border-cyan-700/30 group hover:border-white/40 transition-all duration-500 min-w-[260px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-amber-400/20 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform flex-shrink-0">
                <Lock className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h4 className="text-white font-black text-[10px] sm:text-xs uppercase tracking-widest">SSL encryption</h4>
                <p className="text-[9px] sm:text-[10px] mt-0.5 sm:mt-1 font-medium">256-Bit Financial Grade Security</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-teal-800/20 border border-cyan-700/30 group hover:border-white/40 transition-all duration-500 min-w-[260px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-blue-400/20 flex items-center justify-center text-blue-300 group-hover:scale-110 transition-transform flex-shrink-0">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h4 className="text-white font-black text-[10px] sm:text-xs uppercase tracking-widest">Verified Tola Vendors</h4>
                <p className="text-[9px] sm:text-[10px] mt-0.5 sm:mt-1 font-medium">Local & International Reach</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 md:gap-16">

          {/* Brand & Mission */}
          <div className="lg:col-span-4 space-y-5 sm:space-y-8">
            <Link href="/" className="inline-block group">
              <div className="relative h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-[1.25rem] sm:rounded-[1.5rem] overflow-hidden shadow-2xl ring-4 ring-teal-800/50 group-hover:rotate-6 transition-transform duration-500">
                <Image src="/logo-new.png" alt="TOLA" fill className="object-cover" />
              </div>
              <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-black tracking-tighter text-white">TOLA<span className="text-primary">.</span></h2>
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-cyan-300/70 mt-1 sm:mt-2">Digital trade and Supply Chain Ecosystem</p>
            </Link>
            <p className="text-xs sm:text-sm leading-relaxed max-w-sm">
              Empowering Tanzania's digital trade through a secure, high-end multi-vendor ecosystem. Tola bridges local craftsmanship with global accessibility.
            </p>
            <div className="pt-2">
              <a
                href="https://play.google.com/store/apps/details?id=co.tolata.tolamobile&pcampaignid=web_share"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-black border border-white/20 text-white hover:bg-stone-900 transition-all duration-300 shadow-xl group hover:scale-[1.02] active:scale-95"
              >
                <svg className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#ea4335" d="M3.609 1.814L13.792 12 3.61 22.186a1.94 1.94 0 0 1-.61-1.428V3.242c0-.555.226-1.055.609-1.428z" />
                  <path fill="#fbbc04" d="M17.483 8.309l-3.691 3.691 3.691 3.691 4.298-2.456c.749-.428.749-1.127 0-1.555l-4.298-2.371z" />
                  <path fill="#4285f4" d="M13.792 12L3.609 1.814c.338-.338.838-.456 1.341-.17l12.533 7.165-3.691 3.191z" />
                  <path fill="#34a853" d="M13.792 12l3.691 3.191L4.95 22.356c-.503.286-1.003.168-1.341-.17L13.792 12z" />
                </svg>
                <div className="flex flex-col text-left leading-none">
                  <span className="text-[9px] uppercase font-bold text-stone-300 tracking-wider">Get it On</span>
                  <span className="text-xs sm:text-sm font-black text-white tracking-tight mt-0.5">Google Play</span>
                </div>
              </a>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              {[
                { icon: Facebook, href: "https://www.facebook.com/profile.php?id=61585501071622" },
                { icon: Instagram, href: "https://www.instagram.com/tola_tanzania/" },
                { icon: Linkedin, href: "https://www.linkedin.com/in/faraja-dastan-mhalale-970821239/" }
              ].map((social, i) => (
                <a key={i} href={social.href} target="_blank" rel="noopener noreferrer" className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-teal-800/40 flex items-center justify-center hover:bg-white hover:text-teal-900 transition-all duration-300 group">
                  <social.icon className="h-4 w-4 sm:h-5 sm:w-5 opacity-50 group-hover:opacity-100" />
                </a>
              ))}
              <a href="https://www.tiktok.com/@tolatola.inc?is_from_webapp=1&sender_device=pc" target="_blank" rel="noopener noreferrer" className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-teal-800/40 flex items-center justify-center hover:bg-white hover:text-teal-900 transition-all duration-300 group">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 opacity-50 group-hover:opacity-100" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Company & Support Links — Side by side on mobile */}
          <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:contents">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <h3 className="font-serif text-base sm:text-xl italic text-white">Company</h3>
              <ul className="space-y-2.5 sm:space-y-4">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-xs sm:text-sm font-bold hover:text-white transition-colors flex items-center gap-2 group">
                      <ArrowRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all hidden sm:block" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <h3 className="font-serif text-base sm:text-xl italic text-white">Support</h3>
              <ul className="space-y-2.5 sm:space-y-4">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    {link.name === "Contact Us" ? (
                      <button
                        onClick={() => window.dispatchEvent(new Event('open-support-chat'))}
                        className="text-xs sm:text-sm font-bold hover:text-white transition-colors flex items-center gap-2 group w-full text-left"
                      >
                        <ArrowRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all hidden sm:block" />
                        Live Support
                      </button>
                    ) : (
                      <Link href={link.href} className="text-xs sm:text-sm font-bold hover:text-white transition-colors flex items-center gap-2 group">
                        <ArrowRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all hidden sm:block" />
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact & Global Offices */}
          <div className="lg:col-span-4 space-y-5 sm:space-y-8">
            <h3 className="font-serif text-base sm:text-xl italic text-white">Global Presence</h3>
            <div className="grid gap-3 sm:gap-6">
              {footerLinks.offices.map((office) => (
                <div key={office.name} className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-teal-800/20 border border-cyan-700/30">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 rounded-lg bg-white/10 flex items-center justify-center text-white">
                    <office.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-white font-black text-[9px] sm:text-[10px] uppercase tracking-widest truncate">{office.name}</h4>
                    <a href={`tel:${office.phone.replace(/\s+/g, '')}`} className="text-xs sm:text-sm font-bold mt-0.5 sm:mt-1 block hover:text-white transition-colors">{office.phone}</a>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2 sm:pt-4 flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white flex-shrink-0" />
              <span className="text-[9px] sm:text-[10px] font-black tracking-widest uppercase">support@tolatola.co</span>
            </div>
          </div>

        </div>
      </div>

      {/* Copyright Architecture */}
      <div className="border-t border-teal-800/50 bg-teal-950/80">
        <div className="container mx-auto px-4 py-5 sm:py-8">
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Company Registration Info */}
            <div className="text-center space-y-1.5 sm:space-y-2">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-cyan-300/80">
                Owned and Operated by TOLA GLOBAL SYSTEMS LIMITED
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-cyan-300/60">
                <span>Company Reg: REGISTRATION NO 207121622</span>
                <span className="hidden sm:inline">•</span>
                <span>TIN NO: 207121622</span>
              </div>
              <p className="text-[8px] sm:text-[9px] font-medium tracking-wider text-cyan-300/50">
                P O BOX 372, MIKOCHENI DAR ES SALAAM, TANZANIA
              </p>
            </div>

            {/* Copyright and Status */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-teal-800/30">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-cyan-300/60 text-center sm:text-left">
                © {currentYear} TOLA Digital Trade and Supply Chain Ecosystem. Precision Engineered in Tanzania.
              </p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-cyan-300/60">System Status: Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for mobile bottom nav */}
      <div className="h-20 lg:hidden bg-teal-950/80" />
    </footer>
  )
}

export default SiteFooter
