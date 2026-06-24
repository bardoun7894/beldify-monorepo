/**
 * /search page — permanent redirect to /products preserving the `q` param.
 * Covers bookmarked/old links that used /search?q=... before the Navbar
 * search was updated to push /products?q=...
 */

import { permanentRedirect } from 'next/navigation';

interface SearchPageProps {
  searchParams?: Promise<{ q?: string; [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolved = await searchParams;
  const q = resolved?.q ?? '';
  const dest = q ? `/products?q=${encodeURIComponent(q)}` : '/products';
  permanentRedirect(dest);
}
