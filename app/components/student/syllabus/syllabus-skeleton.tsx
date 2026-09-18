import { Skeleton } from "@/components/ui/skeleton";

export function SyllabusSkeleton() {
  return (
    <div className="flex flex-col gap-8 pb-12 w-full animate-pulse">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-10 w-64 mt-2" />
        <Skeleton className="h-5 w-full max-w-2xl mt-1" />
      </header>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Left/Top: Subject List Skeleton */}
        <div className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-hidden">
          <Skeleton className="h-14 w-full min-w-32 rounded-xl" />
          <Skeleton className="h-14 w-full min-w-32 rounded-xl" />
          <Skeleton className="h-14 w-full min-w-32 rounded-xl" />
          <Skeleton className="h-14 w-full min-w-32 rounded-xl hidden md:block" />
        </div>

        {/* Right/Bottom: Topic List Skeleton */}
        <div className="flex-1 w-full flex flex-col">
          <div className="mb-6 flex flex-col gap-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex flex-col border-y border-border divide-y divide-border">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="py-5 flex justify-between items-center">
                <div className="flex flex-col gap-2 w-full">
                  <Skeleton className="h-6 w-3/4 max-w-md" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-6 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
