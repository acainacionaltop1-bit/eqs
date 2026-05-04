import { cn } from '@/react-app/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-700/50', className)}
      {...props}
    />
  );
}

// Skeleton específicos para diferentes seções
const StatCardSkeleton = () => (
  <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50 space-y-3">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
    <Skeleton className="h-2 w-full rounded-full" />
  </div>
);

const VideoCardSkeleton = () => (
  <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50 space-y-3">
    <div className="flex items-center gap-4">
      <Skeleton className="w-20 h-14 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
      <Skeleton className="h-6 w-12" />
    </div>
  </div>
);

const TableRowSkeleton = () => (
  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
    <div className="text-right space-y-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-3 w-12" />
    </div>
  </div>
);

const PlanCardSkeleton = () => (
  <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700 space-y-4">
    <div className="text-center space-y-3">
      <Skeleton className="h-6 w-24 mx-auto rounded-full" />
      <Skeleton className="h-8 w-20 mx-auto" />
      <Skeleton className="h-4 w-32 mx-auto" />
    </div>
    
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-4 h-4 rounded-full flex-shrink-0" />
          <Skeleton className="h-3 flex-1" />
        </div>
      ))}
    </div>
    
    <Skeleton className="h-10 w-full rounded-xl" />
  </div>
);

const FeatureCardSkeleton = () => (
  <div className="rounded-3xl p-8 backdrop-blur-xl border border-gray-700/50 space-y-6">
    <Skeleton className="w-14 h-14 rounded-3xl" />
    <div className="space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    <Skeleton className="h-4 w-24" />
  </div>
);

const ProfileSkeleton = () => (
  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 space-y-4">
    <div className="flex items-center gap-4">
      <Skeleton className="w-16 h-16 lg:w-20 lg:h-20 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  </div>
);

const CouponHistorySkeleton = () => (
  <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30 space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="text-right space-y-2">
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  </div>
);

export { 
  Skeleton, 
  StatCardSkeleton, 
  VideoCardSkeleton, 
  TableRowSkeleton, 
  PlanCardSkeleton, 
  FeatureCardSkeleton,
  ProfileSkeleton,
  CouponHistorySkeleton
};
