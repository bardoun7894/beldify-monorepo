'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Instagram, Facebook, Twitter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { API_URL } from '@/config/constants';

const Footer = () => {
  const { t } = useTranslation();
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterEmail('');
  };

  const columns = [
    {
      title: t('footer.shop', 'Shop'),
      links: [
        { label: t('footer.women', 'Women'), href: '/categories/women' },
        { label: t('footer.men', 'Men'), href: '/categories/men' },
        { label: t('footer.kids', 'Kids'), href: '/categories/children' },
        { label: t('footer.tailoring', 'Tailoring'), href: '/services/tailoring' },
        { label: t('footer.newArrivals', 'New arrivals'), href: '/products?sort=newest' },
      ],
    },
    {
      title: t('footer.headingSellers', 'Sellers'),
      links: [
        { label: t('footer.becomeSeller', 'Become a seller'), href: '/seller/register' },
        // Seller dashboard is a Laravel Blade app reached via the /seller/enter SSO
        // handoff on the backend host — not a Next.js route. Must be a full-page nav
        // (external), otherwise Next tries to prefetch/render it and 404s.
        { label: t('footer.sellerDashboard', 'Seller dashboard'), href: `${API_URL}/seller/enter`, external: true },
      ],
    },
    {
      title: t('footer.headingCompany', 'Company'),
      links: [
        { label: t('footer.about', 'About Beldify'), href: '/about' },
      ],
    },
    {
      title: t('footer.headingHelp', 'Help'),
      links: [
        { label: t('footer.contactLink', 'Contact'), href: '/contact' },
        { label: t('footer.faq', 'FAQ'), href: '/faqs' },
        { label: t('footer.shipping', 'Shipping'), href: '/shipping' },
        { label: t('footer.returns', 'Returns'), href: '/returns' },
        { label: t('footer.trackOrder', 'Track order'), href: '/track' },
        { label: t('footer.privacy', 'Privacy'), href: '/privacy-policy' },
      ],
    },
  ];

  return (
    <footer className="bg-indigo-950 text-indigo-100 pt-16 pb-8 mt-12">
      <div className="mx-auto max-w-7xl px-6">

        {/* Main grid — brand col spans 2 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* ── Brand Column ─────────────────────────────────────── */}
          <div className="col-span-2">
            <Link
              href="/"
              aria-label={t('chrome.navbar.brandHome', 'Beldify home')}
              className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
            >
              <span
                className="text-3xl font-bold text-white tracking-tight"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {t('brand.name', 'Beldify')}
              </span>
            </Link>

            <p className="mt-4 text-sm text-indigo-200/80 max-w-xs leading-relaxed">
              {t(
                'footer.tagline',
                'A curated marketplace for authentic Moroccan fashion, tailoring, and crafts — from local ateliers to your door.'
              )}
            </p>

            {/* Contact details */}
            <ul className="mt-6 space-y-2 text-sm text-indigo-200/70">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-amber-300 mt-0.5 shrink-0" aria-hidden="true" />
                <span>123, Avenue de la Médina, Tétouan, Maroc</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-amber-300 shrink-0" aria-hidden="true" />
                <a href="tel:+212708150351" className="hover:text-white transition-colors">+212 (0) 7 08 15 03 51</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-amber-300 shrink-0" aria-hidden="true" />
                <a href="mailto:contact@beldify.com" className="hover:text-white transition-colors">contact@beldify.com</a>
              </li>
            </ul>

            {/* Social icons — DESIGN.md §6.6 */}
            <div className="mt-6 flex items-center gap-3">
              {[
                { Icon: Instagram, href: 'https://instagram.com/beldify', label: 'Instagram' },
                { Icon: Facebook, href: 'https://facebook.com/beldify', label: 'Facebook' },
                { Icon: Twitter, href: 'https://twitter.com/beldify', label: 'Twitter' },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/15 hover:bg-amber-400 hover:text-indigo-950 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>

            {/* Inline newsletter slot */}
            <div className="mt-8">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-300 font-medium mb-3">
                {t('footer.newsletter', 'Newsletter')}
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder={t('newsletter.placeholder', 'Your email address')}
                  required
                  aria-label={t('newsletter.placeholder', 'Your email address')}
                  className="flex-1 min-w-0 rounded-xl px-3 py-2 text-sm bg-white/10 border border-white/15 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400/60 transition-colors duration-200"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl bg-amber-400 text-gray-900 text-sm font-semibold hover:bg-amber-300 transition-colors duration-200 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-950"
                >
                  {t('newsletter.button', 'Subscribe')}
                </button>
              </form>
            </div>
          </div>

          {/* ── Link Columns ─────────────────────────────────────── */}
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold text-amber-300 tracking-[0.14em] uppercase mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    {'external' in l && l.external ? (
                      <a
                        href={l.href}
                        className="text-sm text-indigo-100/75 hover:text-white transition-colors duration-150 focus-visible:outline-none focus-visible:underline"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="text-sm text-indigo-100/75 hover:text-white transition-colors duration-150 focus-visible:outline-none focus-visible:underline"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Trust strip ──────────────────────────────────────── */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-indigo-300/60">
          <p>
            &copy; {new Date().getFullYear()} Beldify &mdash; {t('footer.rightsReserved', 'Crafted with care in Morocco.')}
          </p>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-white/5 ring-1 ring-white/10 text-indigo-200/70 font-medium">MAD (DH)</span>
            <span aria-hidden="true">·</span>
            <span>عربي / EN / FR</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
