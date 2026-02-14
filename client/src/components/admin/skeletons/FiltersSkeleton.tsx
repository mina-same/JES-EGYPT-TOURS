import React from 'react';

export function FiltersSkeleton() {
  return (
    <div className="filters-bar">
      {/* Search box skeleton */}
      <div className="search-box">
        <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
        <div className="h-4 flex-1 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Filter dropdowns skeleton */}
      {[1, 2].map((i) => (
        <div key={i} className="filter-group">
          <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}
