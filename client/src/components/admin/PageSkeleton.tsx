"use client";
import React from 'react';

interface PageSkeletonProps {
  variant?: 'dashboard' | 'list' | 'form' | 'blog-edit' | 'blog-create' | 'tour-edit' | 'tour-create' | 'category-edit' | 'category-create' | 'subcategory-edit' | 'subcategory-create';
}

const PageSkeleton: React.FC<PageSkeletonProps> = ({ variant = 'list' }) => {
  // Base skeleton component without red borders or focus states
  const Skeleton = ({ className = '' }: { className?: string }) => (
    <div
      className={`animate-shimmer rounded-md bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 border-0 outline-none ring-0 ${className}`}
      style={{
        backgroundSize: '200% 100%',
      }}
      onFocus={(e) => e.currentTarget.blur()}
      tabIndex={-1}
    />
  );

  // Dashboard skeleton
  if (variant === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="p-4 sm:p-6 space-y-6">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-5">
                  <Skeleton className="w-14 h-14 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-4 w-32 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // List page skeleton (blogs, tours, categories, etc.)
  if (variant === 'list') {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="p-4 sm:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-5 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
                <Skeleton className="flex-1 h-11 rounded-lg" />
                <div className="flex gap-3 flex-wrap">
                  <Skeleton className="w-36 h-11 rounded-lg" />
                  <Skeleton className="w-36 h-11 rounded-lg" />
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-6 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 rounded" />
                  ))}
                </div>
              </div>
              
              {Array.from({ length: 6 }).map((_, row) => (
                <div key={row} className="px-6 py-5 border-b border-gray-100 last:border-b-0">
                  <div className="grid grid-cols-6 gap-6 items-center">
                    <Skeleton className="h-12 rounded-xl" />
                    <Skeleton className="h-4 rounded" />
                    <Skeleton className="h-4 rounded" />
                    <Skeleton className="h-4 rounded" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <div className="flex justify-center gap-2">
                      <Skeleton className="h-9 w-9 rounded-lg" />
                      <Skeleton className="h-9 w-9 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form skeleton (generic)
  if (variant === 'form') {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
          <Skeleton className="h-10 w-64 rounded-lg" />
          
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32 rounded" />
              <Skeleton className="h-11 w-full rounded-lg" />
              <Skeleton className="h-11 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
            
            <div className="space-y-4">
              <Skeleton className="h-6 w-32 rounded" />
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
            
            <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
              <Skeleton className="h-11 w-24 rounded-lg" />
              <Skeleton className="h-11 w-32 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Blog Edit/Create skeleton
  if (variant === 'blog-edit' || variant === 'blog-create') {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            {['Content', 'Media & SEO', 'Settings'].map((_, i) => (
              <Skeleton key={i} className="h-11 w-32 rounded-t-lg" />
            ))}
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <Skeleton className="h-6 w-24 rounded" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-6 w-24 rounded" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>
            </div>
            
            <div className="space-y-4">
              <Skeleton className="h-6 w-32 rounded" />
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
            
            <div className="space-y-4">
              <Skeleton className="h-6 w-32 rounded" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
            
            <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
              <Skeleton className="h-11 w-24 rounded-lg" />
              <Skeleton className="h-11 w-32 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tour Edit/Create skeleton
  if (variant === 'tour-edit' || variant === 'tour-create') {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
            {['Overview', 'Media', 'Itinerary', 'Details', 'Pricing', 'Resources', 'SEO'].map((_, i) => (
              <Skeleton key={i} className="h-11 w-28 rounded-t-lg flex-shrink-0" />
            ))}
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-6 w-24 rounded" />
                  <Skeleton className="h-11 w-full rounded-lg" />
                </div>
              ))}
            </div>
            
            <div className="space-y-4">
              <Skeleton className="h-6 w-32 rounded" />
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
            
            <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
              <Skeleton className="h-11 w-24 rounded-lg" />
              <Skeleton className="h-11 w-32 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Category/Subcategory Edit/Create skeleton
  if (variant?.includes('category') || variant?.includes('subcategory')) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <Skeleton className="h-6 w-32 rounded" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-6 w-32 rounded" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>
            </div>
            
            <div className="space-y-4">
              <Skeleton className="h-6 w-24 rounded" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
            
            <div className="space-y-4">
              <Skeleton className="h-6 w-32 rounded" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-48 rounded-lg" />
              </div>
            </div>
            
            <div className="space-y-4">
              <Skeleton className="h-6 w-32 rounded" />
              <Skeleton className="h-11 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
            
            <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
              <Skeleton className="h-11 w-24 rounded-lg" />
              <Skeleton className="h-11 w-32 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PageSkeleton;
