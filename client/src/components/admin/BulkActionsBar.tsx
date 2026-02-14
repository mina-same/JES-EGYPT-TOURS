"use client";

import * as React from "react";
import { Trash2, X } from "lucide-react";

type BulkActionsBarProps = {
  selectedCount: number;
  onClear: () => void;
  onDeleteSelected: () => void;
  deleteDisabled?: boolean;
  className?: string;
};

export default function BulkActionsBar({
  selectedCount,
  onClear,
  onDeleteSelected,
  deleteDisabled = false,
  className = "",
}: BulkActionsBarProps) {
  if (selectedCount <= 0) return null;

  return (
    <div className={"mb-3 flex flex-col gap-2 rounded-lg border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between " + className}>
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {selectedCount} selected
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-slate-700"
        >
          <X className="h-4 w-4" />
          Clear
        </button>
        <button
          type="button"
          onClick={onDeleteSelected}
          disabled={deleteDisabled}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
          Delete selected
        </button>
      </div>
    </div>
  );
}
