import { redirect } from 'next/navigation';
import { use } from 'react';

/**
 * WS-C bug 10: this route was a duplicate tailor-detail page rendering 100% mock
 * data. The canonical, API-wired detail page lives at /services/tailoring/[id].
 * This route now permanently redirects there so there is a single detail surface.
 */
export default function TailorDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  redirect(`/services/tailoring/${id}`);
}
