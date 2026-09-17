import { redirect } from 'next/navigation';
import { use } from 'react';

/**
 * Companion to /messages — see that route's comment. Preserves any query
 * string (e.g. ?postId=) since Open Souk proposal threads rely on it.
 */
export default function MessageThreadRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ shopId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { shopId } = use(params);
  const query = use(searchParams);
  const qs = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (typeof value === 'string') qs.set(key, value);
  });
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  redirect(`/community/messages/${shopId}${suffix}`);
}
