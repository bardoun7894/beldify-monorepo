'use client';

import Link from 'next/link';
import { MapPin, Phone, Mail, Instagram, Facebook, Twitter } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  const columns = [
    {
      title: t('footer.shop', 'Shop'),
      links: [
        { label: t('footer.women', "Women"), href: '/categories/women' },
        { label: t('footer.men', 'Men'), href: '/categories/men' },
        { label: t('footer.kids', 'Kids'), href: '/categories/children' },
        { label: t('footer.tailoring', 'Tailoring'), href: '/tailoring' },
        { label: t('footer.newArrivals', 'New arrivals'), href: '/products?sort=newest' },
      ],
    },
    {
      title: t('footer.headingSellers', 'Sellers'),
      links: [
        { label: t('footer.becomeSeller', 'Become a seller'), href: '/seller/register' },
        { label: t('footer.sellerDashboard', 'Seller dashboard'), href: '/seller/dashboard' },
        { label: t('footer.sellerSupport', 'Seller support'), href: '/seller/support' },
        { label: t('footer.commissions', 'Commissions'), href: '/seller/commissions' },
      ],
    },
    {
      title: t('footer.headingCompany', 'Company'),
      links: [
        { label: t('footer.about', 'About Beldify'), href: '/about' },
        { label: t('footer.journal', 'Journal'), href: '/journal' },
        { label: t('footer.careers', 'Careers'), href: '/careers' },
        { label: t('footer.press', 'Press'), href: '/press' },
      ],
    },
    {
      title: t('footer.headingHelp', 'Help'),
      links: [
        { label: t('footer.contactLink', 'Contact'), href: '/contact' },
        { label: t('footer.faq', 'FAQ'), href: '/faq' },
        { label: t('footer.shipping', 'Shipping'), href: '/shipping' },
        { label: t('footer.returns', 'Returns'), href: '/returns' },
        { label: t('footer.privacy', 'Privacy'), href: '/privacy-policy' },
      ],
    },
  ];

  return (
    <footer className="bg-indigo-950 text-indigo-100 pb-12 pt-16 mt-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand col */}
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <span
                className="text-3xl font-bold text-white tracking-tight"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {t('brand.name', 'Beldify')}
              </span>
            </Link>
            <p className="mt-4 text-sm text-indigo-200/80 max-w-sm">
              {t(
                'footer.tagline',
                'A curated marketplace for authentic Moroccan fashion, tailoring, and crafts — from local ateliers to your door.'
              )}
            </p>
            <ul className="mt-6 space-y-2 text-sm text-indigo-200/80">
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-amber-300" /> 123, Avenue de la Médina, Tétouan, Morocco</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-amber-300" /> +212 (0) 7 08 15 03 51</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-amber-300" /> contact@beldify.com</li>
            </ul>

            <div className="mt-6 flex items-center gap-3">
              {[
                { Icon: Instagram, href: 'https://instagram.com/beldify', label: 'Instagram' },
                { Icon: Facebook, href: 'https://facebook.com/beldify', label: 'Facebook' },
                { Icon: Twitter, href: 'https://twitter.com/beldify', label: 'Twitter' },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/15 hover:bg-amber-400 hover:text-indigo-950 transition"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-amber-300 tracking-wide uppercase">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-indigo-100/85 hover:text-white transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-indigo-200/70">
          <p>&copy; {new Date().getFullYear()} Beldify. {t('footer.rightsReserved', 'Crafted with care in Morocco.')}</p>
          <div className="flex items-center gap-4">
            <span>MAD (DH)</span>
            <span>·</span>
            <span>عربي / EN / FR</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
