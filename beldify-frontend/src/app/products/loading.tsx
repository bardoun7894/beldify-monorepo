// Route-level PLP skeleton shown instantly on navigation (storefront audit P1-E).
// Desktop filter sidebar + product grid shape. Atlas tokens, RTL-safe.
export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200/70 rounded-2xl w-56 mb-6" />
          <div className="flex gap-6">
            <div className="hidden md:block w-64 shrink-0 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 bg-gray-200/70 rounded-2xl" />
              ))}
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                  <div className="bg-gray-200/70 aspect-square rounded-2xl mb-3" />
                  <div className="h-3.5 bg-gray-200/70 rounded-full w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200/70 rounded-full w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
