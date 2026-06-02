import { redirect } from 'next/navigation';

/**
 * WS-C bug 10: this route was a duplicate tailor-detail page rendering 100% mock
 * data. The canonical, API-wired detail page lives at /services/tailoring/[id].
 * This route now permanently redirects there so there is a single detail surface.
 */
export default function TailorDetailRedirect({ params }: { params: { id: string } }) {
  redirect(`/services/tailoring/${params.id}`);
}
