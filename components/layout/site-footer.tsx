"use client"

import Image from "next/image"
import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin, ShieldCheck, CreditCard, Lock, Globe, ArrowRight, Mail, Phone, MapPin } from "lucide-react"

export function SiteFooter() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    company: [
      { name: "About us", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Our Blog", href: "/blog" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms & Conditions", href: "/terms" },
      { name: "Vendor SLA", href: "/legal/sla-vendor" },
      { name: "Transporter SLA", href: "/legal/sla-transporter" },
    ],
    support: [
      { name: "FAQ", href: "/faq" },
      { name: "Contact Us", href: "/contact" },
      { name: "Return Policy", href: "/return-policy" },
      { name: "Site Map", href: "/sitemap" },
    ],
    offices: [
      { name: "Dodoma HQ", phone: "+255 678 227 227", icon: MapPin },
      { name: "Dar Es Salaam", phone: "+255 625 377 978", icon: Globe },
    ]
  }

  return (
    <footer className="bg-gradient-to-br from-teal-900 via-cyan-900 to-teal-950 text-cyan-100 mt-auto selection:bg-white selection:text-teal-900">
      {/* Trust & Security Segment */}
      <div className="border-b border-teal-800/50">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4 p-6 rounded-3xl bg-teal-800/20 border border-cyan-700/30 group hover:border-white/40 transition-all duration-500">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-white font-black text-xs uppercase tracking-widest">Buyer Protection</h4>
                <p className="text-[10px] mt-1 font-medium">Safe & Insured Transactions</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 rounded-3xl bg-teal-800/20 border border-cyan-700/30 group hover:border-white/40 transition-all duration-500">
              <div className="h-12 w-12 rounded-2xl bg-amber-400/20 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-white font-black text-xs uppercase tracking-widest">SSL encryption</h4>
                <p className="text-[10px] mt-1 font-medium">256-Bit Financial Grade Security</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 rounded-3xl bg-teal-800/20 border border-cyan-700/30 group hover:border-white/40 transition-all duration-500">
              <div className="h-12 w-12 rounded-2xl bg-blue-400/20 flex items-center justify-center text-blue-300 group-hover:scale-110 transition-transform">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-white font-black text-xs uppercase tracking-widest">Verified Nodes</h4>
                <p className="text-[10px] mt-1 font-medium">Local & International Gateway</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16">

          {/* Brand & Mission */}
          <div className="lg:col-span-4 space-y-8">
            <Link href="/" className="inline-block group">
              <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-[1.5rem] overflow-hidden shadow-2xl ring-4 ring-teal-800/50 group-hover:rotate-6 transition-transform duration-500">
                <Image src="/tolalogo.jpg" alt="TOLA" fill className="object-cover" />
              </div>
              <h2 className="mt-6 text-3xl font-black tracking-tighter text-white">TOLA<span className="text-primary">.</span></h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300/70 mt-2">vivid Digital trade and Supply Chain Ecosystem infrastructure</p>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm">
              Empowering Tanzania's digital trade through a secure, high-end multi-vendor ecosystem. Tola bridges local craftsmanship with global accessibility.
            </p>
            <div className="flex items-center gap-4">
              {[
                { icon: Facebook, href: "https://facebook.com/tolamarketplace" },
                { icon: Twitter, href: "https://twitter.com/tolamarketplace" },
                { icon: Instagram, href: "https://instagram.com/tolamarketplace" },
                { icon: Linkedin, href: "https://linkedin.com/company/tolamarketplace" }
              ].map((social, i) => (
                <a key={i} href={social.href} className="h-10 w-10 rounded-xl bg-teal-800/40 flex items-center justify-center hover:bg-white hover:text-teal-900 transition-all duration-300 group">
                  <social.icon className="h-5 w-5 opacity-50 group-hover:opacity-100" />
                </a>
              ))}
              <a href="https://tiktok.com/@tolamarketplace" className="h-10 w-10 rounded-xl bg-teal-800/40 flex items-center justify-center hover:bg-white hover:text-teal-900 transition-all duration-300 group">
                <svg className="h-5 w-5 opacity-50 group-hover:opacity-100" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="font-serif text-xl italic text-white">Company</h3>
            <ul className="space-y-4">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm font-bold hover:text-white transition-colors flex items-center gap-2 group">
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <h3 className="font-serif text-xl italic text-white">Support</h3>
            <ul className="space-y-4">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm font-bold hover:text-white transition-colors flex items-center gap-2 group">
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Global Offices */}
          <div className="lg:col-span-4 space-y-8">
            <h3 className="font-serif text-xl italic text-white">Global Presence</h3>
            <div className="grid gap-6">
              {footerLinks.offices.map((office) => (
                <div key={office.name} className="flex gap-4 p-4 rounded-2xl bg-teal-800/20 border border-cyan-700/30">
                  <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-white/10 flex items-center justify-center text-white">
                    <office.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-[10px] uppercase tracking-widest">{office.name}</h4>
                    <a href={`tel:${office.phone.replace(/\s+/g, '')}`} className="text-sm font-bold mt-1 block hover:text-white transition-colors">{office.phone}</a>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 flex items-center gap-2">
              <Mail className="h-4 w-4 text-white" />
              <span className="text-[10px] font-black tracking-widest uppercase">support@tolatola.co</span>
            </div>
          </div>

        </div>
      </div>

      {/* Copyright Architecture */}
      <div className="border-t border-teal-800/50 bg-teal-950/80">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-6">
            {/* Company Registration Info */}
            <div className="text-center space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/80">
                Owned and Operated by DAN'G GROUP OF COMPANIES LIMITED
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[9px] font-bold uppercase tracking-widest text-cyan-300/60">
                <span>Company Reg: 165214285</span>
                <span className="hidden sm:inline">•</span>
                <span>TIN: 165-214-285</span>
                <span className="hidden sm:inline">•</span>
                <span>NSSF: 1042932</span>
                <span className="hidden sm:inline">•</span>
                <span>Business Name Reg: 627634</span>
              </div>
              <p className="text-[9px] font-medium tracking-wider text-cyan-300/50">
                P.O. Box 372, Kibaha-Pwani, Tanzania
              </p>
            </div>

            {/* Copyright and Status */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-teal-800/30">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/60">
                © {currentYear} TOLA Digital Trade and Supply Chain Ecosystem. Precision Engineered in Tanzania.
              </p>
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300/60">System Status: Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
