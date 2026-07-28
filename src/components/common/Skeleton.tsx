interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-mist-200/80 ${className}`}
      aria-hidden="true"
    />
  );
}

export function ResultSkeleton() {
  return (
    <div className="glass-panel p-6" aria-hidden="true">
      <div className="flex gap-4">
        <Skeleton className="h-24 w-24 shrink-0 rounded-2xl" />
        <div className="flex-1 space-y-3 py-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    </div>
  );
}
