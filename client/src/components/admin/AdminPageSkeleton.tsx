import React from 'react';
import { StatCardsSkeleton } from './skeletons/StatCardsSkeleton';
import { FiltersSkeleton } from './skeletons/FiltersSkeleton';
import { TableSkeleton } from './skeletons/TableSkeleton';

interface AdminPageSkeletonProps {
  showStats?: boolean;
  showFilters?: boolean;
  tableRows?: number;
}

export function AdminPageSkeleton({
  showStats = true,
  showFilters = true,
  tableRows = 8
}: AdminPageSkeletonProps) {
  return (
    <div className="admin-scope p-6" aria-busy="true" role="status" aria-label="Loading">
      {/* Header Skeleton */}
      <div className="admin-page-header">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Stats Skeleton */}
      {showStats && <StatCardsSkeleton />}

      {/* Filters Skeleton */}
      {showFilters && <FiltersSkeleton />}

      {/* Table Skeleton */}
      <TableSkeleton rows={tableRows} />
    </div>
  );
}
