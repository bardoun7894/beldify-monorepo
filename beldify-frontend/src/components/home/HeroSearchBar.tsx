'use client';

/**
 * HeroSearchBar — persistent search bar embedded in the hero section.
 *
 * Specs:
 *  - Lucide Search icon (start of input)
 *  - i18n placeholder: home.hero.search_placeholder
 *  - Submits to /products?q=<query> (in-app, never external)
 *  - RTL-aware (uses logical properties via Tailwind dir-aware classes)
 *  - Atlas-token focus ring — hsl(var(--secondary)) amber (NOT raw amber-*)
 *  - ≥44px touch target (h-12 on input row)
 *  - Accessible: aria-label on input, type="submit" button
 *  - No raw indigo-N/amber-N/hex tokens — Atlas CSS vars only
 */

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/i18n/config';

export default function HeroSearchBar() {
  const { t } = useTranslation();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/products?q=${encodeURIComponent(q)}`);
    } else {
      router.push('/products');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label={t('home.hero.search_label', 'Search the marketplace')}
      className="w-full"
    >
      <div
        className="flex items-center gap-2 w-full rounded-full px-4 h-12 min-h-[44px] bg-white ring-1 ring-[hsl(var(--outline)/0.3)] transition-shadow duration-150 focus-within:ring-2 focus-within:ring-[hsl(var(--secondary)/0.5)]"
      >
        {/* Search icon */}
        <Search
          className="h-4 w-4 shrink-0"
          aria-hidden="true"
          style={{ color: 'hsl(var(--primary) / 0.5)' }}
        />

        {/* Input */}
        <input
          ref={inputRef}
          type="search"
          id="hero-search"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('home.hero.search_placeholder', 'Search caftans, djellabas…')}
          aria-label={t('home.hero.search_placeholder', 'Search caftans, djellabas…')}
          className="flex-1 w-full min-w-0 bg-transparent text-sm outline-none placeholder:opacity-50"
          style={{ color: 'hsl(var(--primary))' }}
          autoComplete="off"
          spellCheck="false"
        />

        {/* Submit button (icon-only, screen-reader labelled) */}
        <button
          type="submit"
          aria-label={t('home.hero.search_btn', 'Search')}
          className="shrink-0 rounded-full p-1.5 transition-colors duration-150 focus:outline-none focus-visible:ring-2"
          style={{
            background: 'hsl(var(--secondary))',
            color: 'hsl(var(--on-secondary))',
            ['--tw-ring-color' as string]: 'hsl(var(--secondary) / 0.4)',
          }}
        >
          <Search className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
