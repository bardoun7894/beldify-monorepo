// Route-level skeleton shown instantly on navigation to a category page, before the
// client component mounts and runs its own fetch (storefront audit P1-E). Atlas tokens,
// RTL-safe (symmetric spacing, no physical directional classes).
export default function CategoryLoading() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200/70 rounded-full w-40 mb-6" />
          <div className="h-9 bg-gray-200/70 rounded-2xl w-64 mb-3" />
          <div className="h-4 bg-gray-200/70 rounded-full w-48 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <div className="bg-gray-200/70 aspect-square rounded-2xl mb-3" />
                <div className="h-3.5 bg-gray-200/70 rounded-full w-3/4 mb-2" />
                <div className="h-3 bg-gray-200/70 rounded-full w-1/2 mb-3" />
                <div className="h-3 bg-gray-200/70 rounded-full w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
