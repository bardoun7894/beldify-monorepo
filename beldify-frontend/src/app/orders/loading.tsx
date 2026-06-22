// Route-level orders skeleton shown instantly on navigation, replacing the spinner-only
// OrdersLoadingScreen for the initial paint (storefront audit P1-E + P2 state review).
// Order-card list shape. Atlas tokens, RTL-safe.
export default function OrdersLoading() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200/70 rounded-2xl w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white ring-1 ring-indigo-100 rounded-2xl p-5 shadow-atlas-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-100 rounded-full w-36" />
                <div className="h-6 bg-gray-100 rounded-full w-24" />
              </div>
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="h-3.5 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
