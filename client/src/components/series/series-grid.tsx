import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import UnifiedSeriesCard from "@/components/ui/unified-series-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Series } from "@shared/schema";
import type { FilterOptions } from "@/types";

interface SeriesGridProps {
  filters?: FilterOptions;
  featured?: boolean;
  trending?: boolean;
  limit?: number;
  title?: string;
  showFilters?: boolean;
}

export default function SeriesGrid({
  filters = {},
  featured = false,
  trending = false,
  limit,
  title,
  showFilters = false,
}: SeriesGridProps) {
  const [, navigate] = useLocation();

  const queryKey = trending 
    ? ['/api/series/trending', { limit }]
    : ['/api/series', filters];

  const { data: series = [], isLoading, error } = useQuery<Series[]>({
    queryKey,
    enabled: true,
  });

  const handleSeriesClick = (seriesId: string) => {
    navigate(`/series/${seriesId}`);
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load series. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          {showFilters && (
            <div className="flex items-center space-x-2">
              {/* Filter buttons can be added here */}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
        {isLoading
          ? Array.from({ length: limit || 12 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="aspect-3-4 w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          : series.map((item) => (
              <UnifiedSeriesCard
                key={item.id}
                series={item}
                onClick={() => handleSeriesClick(item.id)}
              />
            ))}
      </div>

      {series.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No series found.</p>
          <p className="text-muted-foreground text-sm mt-2">
            Try adjusting your filters or check back later for new content.
          </p>
        </div>
      )}
    </div>
  );
}
