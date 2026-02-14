import React from 'react';

export function FormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gray-200 dark:bg-slate-800 rounded-md" />
          <div className="h-4 w-48 bg-gray-100 dark:bg-slate-800/50 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info Card */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div className="h-6 w-32 bg-gray-200 dark:bg-slate-800 rounded-md mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-20 bg-gray-200 dark:bg-slate-800 rounded" />
              <div className="h-10 w-full bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-20 bg-gray-200 dark:bg-slate-800 rounded" />
              <div className="h-10 w-full bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 bg-gray-200 dark:bg-slate-800 rounded" />
            <div className="h-32 w-full bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg" />
          </div>
        </div>

        {/* Media Card */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div className="h-6 w-32 bg-gray-200 dark:bg-slate-800 rounded-md mb-4" />
          <div className="h-40 w-full bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg" />
        </div>

        {/* SEO Card */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div className="h-6 w-32 bg-gray-200 dark:bg-slate-800 rounded-md mb-4" />
          <div className="space-y-4">
             <div className="h-10 w-full bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg" />
             <div className="h-10 w-full bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-slate-800">
        <div className="h-10 w-24 bg-gray-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-10 w-32 bg-blue-100 dark:bg-blue-900/30 rounded-lg" />
      </div>
    </div>
  );
}
