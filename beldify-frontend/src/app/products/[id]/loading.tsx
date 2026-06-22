// Route-level PDP skeleton shown instantly on navigation, before the client page
// mounts (storefront audit P1-E). Two-column gallery + buy-pane shape matching the
// real PDP so there's no jarring layout swap. Atlas tokens, RTL-safe.
export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200/70 rounded-full w-48 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gallery */}
            <div className="space-y-3">
              <div className="aspect-square bg-gray-200/70 rounded-3xl" />
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-200/70 rounded-xl" />
                ))}
              </div>
            </div>
            {/* Buy pane */}
            <div className="space-y-4">
              <div className="h-4 bg-gray-200/70 rounded-full w-24" />
              <div className="h-8 bg-gray-200/70 rounded-2xl w-3/4" />
              <div className="h-7 bg-gray-200/70 rounded-xl w-32" />
              <div className="h-4 bg-gray-200/70 rounded-full w-40" />
              <div className="h-px bg-gray-200/70 my-2" />
              <div className="h-4 bg-gray-200/70 rounded-full w-full" />
              <div className="h-4 bg-gray-200/70 rounded-full w-5/6" />
              <div className="flex gap-3 pt-4">
                <div className="h-12 bg-gray-200/70 rounded-2xl flex-1" />
                <div className="h-12 bg-gray-200/70 rounded-2xl w-12" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
