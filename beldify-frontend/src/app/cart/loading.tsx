// Route-level cart skeleton shown instantly on navigation (storefront audit P1-E).
// Mirrors the cart page's own inline two-column loading shape. Atlas tokens, RTL-safe.
export default function CartLoading() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-4 bg-gray-100 rounded-full w-40" />
          <div className="h-10 bg-gray-100 rounded-2xl w-52" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex gap-4 bg-white ring-1 ring-indigo-100 rounded-2xl p-4 shadow-atlas-sm"
                >
                  <div className="w-24 h-24 bg-gray-100 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-3 pt-1">
                    <div className="h-5 bg-gray-100 rounded w-3/4" />
                    <div className="h-3.5 bg-gray-100 rounded w-1/2" />
                    <div className="h-3.5 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white ring-1 ring-indigo-100 rounded-2xl p-6 h-72 shadow-atlas-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
