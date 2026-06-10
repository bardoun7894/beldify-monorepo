/**
 * /search page — permanent redirect to /products preserving the `q` param.
 * Covers bookmarked/old links that used /search?q=... before the Navbar
 * search was updated to push /products?q=...
 */

import { permanentRedirect } from 'next/navigation';

interface SearchPageProps {
  searchParams?: { q?: string; [key: string]: string | string[] | undefined };
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const q = searchParams?.q ?? '';
  const dest = q ? `/products?q=${encodeURIComponent(q)}` : '/products';
  permanentRedirect(dest);
}
