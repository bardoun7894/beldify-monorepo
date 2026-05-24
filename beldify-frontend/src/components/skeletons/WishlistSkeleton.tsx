export default function WishlistSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 animate-pulse"
        >
          {/* Product Image Skeleton */}
          <div className="w-24 h-24 bg-gray-200 rounded-md" />

          {/* Product Info Skeleton */}
          <div className="flex-1 space-y-3">
            <div className="h-4 w-2/3 bg-gray-200 rounded" />
            <div className="h-4 w-1/3 bg-gray-200 rounded" />
            <div className="h-4 w-1/4 bg-gray-200 rounded" />
          </div>

          {/* Action Buttons Skeleton */}
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-gray-200 rounded-full" />
            <div className="h-8 w-8 bg-gray-200 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
