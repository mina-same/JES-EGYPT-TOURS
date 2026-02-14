import React from 'react';

export function StatCardsSkeleton() {
  return (
    <div className="stats-grid">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="stat-card"
          aria-busy="true"
        >
          <div className="h-14 w-14 rounded-xl bg-gray-300 dark:bg-gray-600 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
